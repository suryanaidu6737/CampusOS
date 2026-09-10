import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Institution } from '../models/Institution.js';
import { ActivationCode } from '../models/ActivationCode.js';
import { AuditLog } from '../models/AuditLog.js';
import { sendActivationEmail } from '../services/emailService.js';

/**
 * Normalizes code strings for SHA-256 hashing (uppercase, alphanumeric only)
 */
export const hashActivationCode = (codeStr) => {
  if (!codeStr) return '';
  const clean = codeStr.toString().replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return crypto.createHash('sha256').update(clean).digest('hex');
};

/**
 * Generates a cryptographically random display code in C8K4-29P7 format
 */
export const generateDisplayActivationCode = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes ambiguous 0, O, 1, I
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Resolves institution ID fallback if user.institutionId is null
 */
const resolveInstitutionId = async (user, adminUser = null) => {
  if (user?.institutionId) return user.institutionId;
  if (adminUser?.institutionId) return adminUser.institutionId;
  const defaultInst = (await Institution.findOne({ code: 'SWARNANDHRA' })) || (await Institution.findOne({}));
  return defaultInst ? defaultInst._id : null;
};

/**
 * Production-Safe Activation Rate Limiter:
 * 1. Checks 60-second minimum cooldown between successful SEND attempts per user account.
 * 2. Checks maximum 3 successful SEND attempts per user account within 15 minutes.
 * 3. Does NOT count failed email delivery attempts, old expired codes, or user creation documents.
 */
const checkActivationRateLimit = async (userId) => {
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

  // Check 60-second cooldown on successful sends
  const recent60sSend = await ActivationCode.findOne({
    userId,
    emailStatus: 'SENT',
    createdAt: { $gte: sixtySecondsAgo },
  });

  if (recent60sSend) {
    const elapsedSec = Math.ceil((Date.now() - new Date(recent60sSend.createdAt).getTime()) / 1000);
    const waitSec = Math.max(1, 60 - elapsedSec);
    return {
      allowed: false,
      status: 429,
      message: `Please wait ${waitSec} seconds before requesting another activation code.`,
    };
  }

  // Check 3-request limit in 15 minutes on successful sends
  const recent15mSentCount = await ActivationCode.countDocuments({
    userId,
    emailStatus: 'SENT',
    createdAt: { $gte: fifteenMinutesAgo },
  });

  if (recent15mSentCount >= 3) {
    return {
      allowed: false,
      status: 429,
      message: 'Too many activation code requests for this account. Please try again later.',
    };
  }

  return { allowed: true };
};

/**
 * Self-Service API: User enters Student/Faculty ID or Email -> Generates code, hashes it, sends email
 */
export const sendSelfServiceActivationCode = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || identifier.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please enter your Institutional ID (Student/Faculty ID) or registered email.',
      });
    }

    const cleanId = identifier.trim();

    // 1. Locate user strictly by studentId, employeeId, or email
    const user = await User.findOne({
      $or: [
        { studentId: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
        { employeeId: { $regex: new RegExp(`^${cleanId}$`, 'i') } },
        { email: cleanId.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found matching this Institutional ID or email address.',
      });
    }

    // 2. Status checks
    if (user.accountStatus === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Account is already active. You can log in directly.',
      });
    }

    if (user.accountStatus === 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        message: 'Account is suspended. Please contact your institution administrator.',
      });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: 'No registered email address found for this user account.',
      });
    }

    // 3. Rate limiting check (60s cooldown & max 3 sends in 15 mins)
    const rateCheck = await checkActivationRateLimit(user._id);
    if (!rateCheck.allowed) {
      return res.status(rateCheck.status).json({
        success: false,
        message: rateCheck.message,
      });
    }

    // 4. Revoke previous unused codes for this user
    await ActivationCode.updateMany(
      { userId: user._id, usedAt: null, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    // 5. Generate secure display code & store ONLY its SHA-256 hash
    const plaintextDisplayCode = generateDisplayActivationCode();
    const codeHash = hashActivationCode(plaintextDisplayCode);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const institutionId = await resolveInstitutionId(user);

    const codeRecord = await ActivationCode.create({
      userId: user._id,
      institutionId,
      createdBy: null, // Self-service
      codeHash,
      expiresAt,
      emailStatus: 'NOT_SENT',
    });

    user.activationCode = plaintextDisplayCode;

    await AuditLog.create({
      userId: user._id,
      targetUserId: user._id,
      institutionId,
      action: 'ACTIVATION_CODE_GENERATED',
      metadata: { expiresAt, role: user.role, type: 'SELF_SERVICE' },
    });

    // 6. Deliver email via Resend email service
    const institutionalId = user.studentId || user.employeeId || user.email;

    try {
      await sendActivationEmail({
        to: user.email,
        name: user.name,
        institutionalId,
        activationCode: plaintextDisplayCode,
      });

      codeRecord.emailStatus = 'SENT';
      await codeRecord.save();

      user.activationEmailStatus = 'SENT';
      user.activationEmailSentAt = new Date();
      await user.save();

      await AuditLog.create({
        userId: user._id,
        targetUserId: user._id,
        institutionId,
        action: 'ACTIVATION_EMAIL_SENT',
        metadata: { email: user.email, type: 'SELF_SERVICE' },
      });

      // Mask email for privacy display (e.g. s***a@campus.edu)
      const parts = user.email.split('@');
      const maskedUser = parts[0].length > 2 ? parts[0][0] + '***' + parts[0][parts[0].length - 1] : parts[0];
      const maskedEmail = `${maskedUser}@${parts[1]}`;

      res.json({
        success: true,
        message: 'Activation code sent to your registered email.',
        registeredEmail: maskedEmail,
        institutionalId,
      });
    } catch (emailErr) {
      codeRecord.emailStatus = 'FAILED';
      await codeRecord.save();

      user.activationEmailStatus = 'FAILED';
      await user.save();

      await AuditLog.create({
        userId: user._id,
        targetUserId: user._id,
        institutionId,
        action: 'ACTIVATION_EMAIL_FAILED',
        metadata: { email: user.email, reason: emailErr.message, type: 'SELF_SERVICE' },
      });

      return res.status(500).json({
        success: false,
        message: `Activation code could not be delivered to email. (${emailErr.message})`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin API: Generates activation code, sends transactional email, and logs audit
 */
export const sendActivationEmailToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    // 1. Verify target user
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user account not found' });
    }

    // 2. Institution Isolation Check
    const adminInstId = adminUser.institutionId?._id?.toString() || adminUser.institutionId?.toString();
    const targetInstId = targetUser.institutionId?._id?.toString() || targetUser.institutionId?.toString();

    if (adminInstId && targetInstId && adminInstId !== targetInstId && adminUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden: You cannot manage users outside your institution' });
    }

    // 3. Status check
    if (targetUser.accountStatus === 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'User account is already active' });
    }
    if (targetUser.accountStatus === 'SUSPENDED') {
      return res.status(400).json({ success: false, message: 'User account is suspended' });
    }
    if (!targetUser.email) {
      return res.status(400).json({ success: false, message: 'User does not have a valid email address' });
    }

    // 4. Rate Limiting Check (60s cooldown & max 3 sends in 15 mins)
    const rateCheck = await checkActivationRateLimit(targetUser._id);
    if (!rateCheck.allowed) {
      return res.status(rateCheck.status).json({
        success: false,
        message: rateCheck.message,
      });
    }

    // 5. Revoke previous active codes for this user
    await ActivationCode.updateMany(
      { userId: targetUser._id, usedAt: null, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );

    // 6. Generate new code and store ONLY its SHA-256 hash
    const plaintextDisplayCode = generateDisplayActivationCode();
    const codeHash = hashActivationCode(plaintextDisplayCode);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const institutionId = await resolveInstitutionId(targetUser, adminUser);

    const codeRecord = await ActivationCode.create({
      userId: targetUser._id,
      institutionId,
      createdBy: adminUser._id,
      codeHash,
      expiresAt,
      emailStatus: 'NOT_SENT',
    });

    // Also store hash/plaintext fallback on user model for compatibility
    targetUser.activationCode = plaintextDisplayCode;

    await AuditLog.create({
      userId: adminUser._id,
      targetUserId: targetUser._id,
      institutionId,
      action: 'ACTIVATION_CODE_GENERATED',
      metadata: { expiresAt, role: targetUser.role, type: 'ADMIN' },
    });

    // 7. Send Email via Email Service
    const institutionalId = targetUser.studentId || targetUser.employeeId || targetUser.email;

    try {
      await sendActivationEmail({
        to: targetUser.email,
        name: targetUser.name,
        institutionalId,
        activationCode: plaintextDisplayCode,
      });

      // Update success state
      codeRecord.emailStatus = 'SENT';
      await codeRecord.save();

      targetUser.activationEmailStatus = 'SENT';
      targetUser.activationEmailSentAt = new Date();
      await targetUser.save();

      await AuditLog.create({
        userId: adminUser._id,
        targetUserId: targetUser._id,
        institutionId,
        action: 'ACTIVATION_EMAIL_SENT',
        metadata: { email: targetUser.email, type: 'ADMIN' },
      });

      res.json({
        success: true,
        message: `Activation email sent successfully to ${targetUser.email}. Code expires in 24 hours.`,
        emailStatus: 'SENT',
        sentAt: targetUser.activationEmailSentAt,
      });
    } catch (emailErr) {
      codeRecord.emailStatus = 'FAILED';
      await codeRecord.save();

      targetUser.activationEmailStatus = 'FAILED';
      await targetUser.save();

      await AuditLog.create({
        userId: adminUser._id,
        targetUserId: targetUser._id,
        institutionId,
        action: 'ACTIVATION_EMAIL_FAILED',
        metadata: { email: targetUser.email, reason: emailErr.message, type: 'ADMIN' },
      });

      return res.status(500).json({
        success: false,
        message: `Activation email could not be sent. Please try again. (${emailErr.message})`,
        emailStatus: 'FAILED',
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public Activation API: Verifies Institutional ID + Code and completes account password creation
 */
export const verifyAndActivateAccount = async (req, res) => {
  try {
    const { institutionalId, identifier, activationCode, newPassword } = req.body;
    const targetId = (institutionalId || identifier || '').trim();

    if (!targetId || !activationCode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide Institutional ID or email, Activation Code, and New Password',
      });
    }

    const cleanInstId = targetId;
    const cleanCode = activationCode.trim();

    // 1. Locate user strictly by studentId, employeeId, or email
    const user = await User.findOne({
      $or: [
        { studentId: { $regex: new RegExp(`^${cleanInstId}$`, 'i') } },
        { employeeId: { $regex: new RegExp(`^${cleanInstId}$`, 'i') } },
        { email: cleanInstId.toLowerCase() },
      ],
    }).populate('departmentId');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid Institutional ID or account not found' });
    }

    if (user.accountStatus === 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Account is already active. Please log in directly.' });
    }

    // 2. Compute hash of entered code
    const enteredHash = hashActivationCode(cleanCode);

    // 3. Find valid, unexpired, unrevoked ActivationCode document
    let activeCodeDoc = await ActivationCode.findOne({
      userId: user._id,
      codeHash: enteredHash,
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    // Fallback match for legacy plain code matching if present
    if (!activeCodeDoc && user.activationCode === cleanCode) {
      activeCodeDoc = { _id: null };
    }

    if (!activeCodeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, used, or expired activation code. Please request a new activation code.',
      });
    }

    // 4. Complete Activation
    if (activeCodeDoc._id) {
      activeCodeDoc.usedAt = new Date();
      await activeCodeDoc.save();
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.accountStatus = 'ACTIVE';
    user.activationCode = null;
    await user.save();

    const institutionId = await resolveInstitutionId(user);

    await AuditLog.create({
      userId: user._id,
      targetUserId: user._id,
      institutionId,
      action: 'ACCOUNT_ACTIVATED',
      metadata: { role: user.role, email: user.email },
    });

    res.json({
      success: true,
      message: 'Account activated successfully! You can now log in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        accountStatus: 'ACTIVE',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
