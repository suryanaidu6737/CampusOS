import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { AuditLog } from '../models/AuditLog.js';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '7d',
  });
};


export const register = async (req, res) => {
  try {
    const { name, email, password, role, departmentCode, studentId, designation } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    let departmentId = null;
    if (departmentCode) {
      const dept = await Department.findOne({ code: departmentCode });
      if (dept) departmentId = dept._id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'STUDENT',
      departmentId,
      studentId: studentId || null,
      designation: designation || (role === 'STUDENT' ? 'Student' : 'Staff Member'),
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        designation: user.designation,
        isActive: user.isActive,
        department: departmentId ? { id: departmentId } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('departmentId');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact administrator.' });
    }

    if (user.accountStatus === 'PENDING_ACTIVATION') {
      return res.status(403).json({
        success: false,
        message: 'Account pending activation. Please use your activation code to set your password.',
        requiresActivation: true,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    // Audit log for successful login
    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN_SUCCESS',
      metadata: { role: user.role, email: user.email },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        designation: user.designation,
        isActive: user.isActive,
        accountStatus: user.accountStatus || 'ACTIVE',
        department: user.departmentId ? { id: user.departmentId._id, name: user.departmentId.name, code: user.departmentId.code } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const activateAccount = async (req, res) => {
  try {
    const { email, activationCode, newPassword } = req.body;

    if (!email || !activationCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide email, activation code, and new password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    if (user.accountStatus === 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Account is already active. You can log in directly.' });
    }

    if (!user.activationCode || user.activationCode.trim() !== activationCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid activation code provided' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.accountStatus = 'ACTIVE';
    user.activationCode = null;
    await user.save();

    const token = generateToken(user._id);

    await AuditLog.create({
      userId: user._id,
      action: 'USER_ACCOUNT_ACTIVATED',
      metadata: { role: user.role, email: user.email },
    });

    res.json({
      success: true,
      message: 'Account activated successfully! You are now logged in.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        designation: user.designation,
        isActive: user.isActive,
        accountStatus: 'ACTIVE',
        department: user.departmentId ? { id: user.departmentId._id, name: user.departmentId.name, code: user.departmentId.code } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash').populate('departmentId');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        designation: user.designation,
        isActive: user.isActive,
        accountStatus: user.accountStatus || 'ACTIVE',
        department: user.departmentId ? { id: user.departmentId._id, name: user.departmentId.name, code: user.departmentId.code } : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-passwordHash')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!['ACTIVE', 'SUSPENDED', 'PENDING_ACTIVATION'].includes(accountStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid account status provided' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.accountStatus = accountStatus;
    user.isActive = accountStatus !== 'SUSPENDED';
    await user.save();

    await AuditLog.create({
      institutionId: req.user.institutionId || null,
      userId: req.user._id,
      action: 'ADMIN_UPDATE_USER_STATUS',
      metadata: { targetUserId: user._id, targetEmail: user.email, newStatus: accountStatus },
    });

    res.json({
      success: true,
      message: `Account status updated to ${accountStatus}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountStatus: user.accountStatus,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


