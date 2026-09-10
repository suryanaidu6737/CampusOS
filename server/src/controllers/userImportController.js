import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Institution } from '../models/Institution.js';
import { AuditLog } from '../models/AuditLog.js';

/**
 * Helper to get or create department dynamically if missing from initial database seed
 */
const resolveOrCreateDepartment = async (departmentInput, institutionId) => {
  if (!departmentInput) return null;
  const inputTrimmed = departmentInput.trim();
  const inputLower = inputTrimmed.toLowerCase();

  let dept = await Department.findOne({
    $or: [
      { code: { $regex: new RegExp(`^${inputTrimmed}$`, 'i') } },
      { name: { $regex: new RegExp(`^${inputTrimmed}$`, 'i') } },
    ],
  });

  if (!dept) {
    // Standard department names mapping for common academic codes
    let deptName = inputTrimmed;
    if (inputLower === 'me' || inputLower === 'mechanical') deptName = 'Mechanical Engineering';
    else if (inputLower === 'civil') deptName = 'Civil Engineering';
    else if (inputLower === 'ai&ml' || inputLower === 'aiml') deptName = 'Artificial Intelligence & Machine Learning';

    dept = await Department.create({
      institutionId,
      name: deptName,
      code: inputTrimmed.toUpperCase(),
      description: `Department of ${deptName}`,
    });
  }

  return dept;
};

/**
 * Validates a batch of parsed CSV rows against schema and existing DB data
 */
export const validateImportUsers = async (req, res) => {
  try {
    const { importType = 'AUTO', rows } = req.body; // importType: 'STUDENT' | 'FACULTY' | 'AUTO'

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided in CSV data' });
    }

    // Resolve default institution for department creation if needed
    let defaultInst = await Institution.findOne({ code: 'SWARNANDHRA' });
    if (!defaultInst) defaultInst = await Institution.findOne({});
    const institutionId = defaultInst ? defaultInst._id : null;

    // Fetch existing database users and departments for resolution
    const existingUsers = await User.find({}).select('email studentId employeeId');
    const existingDepartments = await Department.find({});

    const dbEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const dbStudentIds = new Set(
      existingUsers.map((u) => u.studentId?.toLowerCase()).filter(Boolean)
    );
    const dbEmployeeIds = new Set(
      existingUsers.map((u) => u.employeeId?.toLowerCase()).filter(Boolean)
    );

    const batchEmails = new Set();
    const batchStudentIds = new Set();
    const batchEmployeeIds = new Set();

    const validatedRows = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 1;
      const errors = [];

      // Normalize row keys to lower-case and strip underscores
      const normalizedRow = {};
      Object.keys(row).forEach((k) => {
        const cleanKey = k.trim().toLowerCase().replace(/_/g, '');
        normalizedRow[cleanKey] = (row[k] || '').toString().trim();
      });

      const name = normalizedRow['name'] || normalizedRow['fullname'] || '';
      const email = (normalizedRow['email'] || normalizedRow['emailaddress'] || '').toLowerCase();
      const departmentInput = normalizedRow['department'] || normalizedRow['dept'] || normalizedRow['departmentcode'] || '';
      const studentId = normalizedRow['studentid'] || normalizedRow['student id'] || normalizedRow['rollno'] || normalizedRow['rollnumber'] || '';
      const employeeId = normalizedRow['employeeid'] || normalizedRow['employee id'] || normalizedRow['empid'] || normalizedRow['facultyid'] || '';
      const year = normalizedRow['year'] || normalizedRow['academicyear'] || '';
      const section = normalizedRow['section'] || '';
      const designationInput = normalizedRow['designation'] || normalizedRow['role'] || normalizedRow['title'] || '';
      const entityTypeInput = (normalizedRow['entitytype'] || normalizedRow['type'] || '').toLowerCase();

      // Determine actual row role
      let rowRole = 'STUDENT';
      if (importType === 'FACULTY' || entityTypeInput === 'faculty' || (employeeId && !studentId)) {
        rowRole = 'FACULTY';
      } else if (importType === 'STUDENT' || entityTypeInput === 'student' || studentId) {
        rowRole = 'STUDENT';
      }

      // Field level validations
      if (!name) errors.push('Missing required field: Name');
      if (!email) {
        errors.push('Missing required field: Email');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Invalid email format: "${email}"`);
      } else if (dbEmails.has(email)) {
        errors.push(`Duplicate email already registered in system: "${email}"`);
      } else if (batchEmails.has(email)) {
        errors.push(`Duplicate email in CSV batch: "${email}"`);
      }

      if (rowRole === 'STUDENT') {
        if (!studentId) {
          errors.push('Missing required field: Student ID');
        } else if (dbStudentIds.has(studentId.toLowerCase())) {
          errors.push(`Duplicate Student ID registered in system: "${studentId}"`);
        } else if (batchStudentIds.has(studentId.toLowerCase())) {
          errors.push(`Duplicate Student ID in CSV batch: "${studentId}"`);
        }
      } else if (rowRole === 'FACULTY') {
        if (!employeeId) {
          errors.push('Missing required field: Employee ID');
        } else if (dbEmployeeIds.has(employeeId.toLowerCase())) {
          errors.push(`Duplicate Employee ID registered in system: "${employeeId}"`);
        } else if (batchEmployeeIds.has(employeeId.toLowerCase())) {
          errors.push(`Duplicate Employee ID in CSV batch: "${employeeId}"`);
        }
      }

      // Resolve department
      let resolvedDept = null;
      if (!departmentInput) {
        errors.push('Missing required field: Department');
      } else {
        resolvedDept = existingDepartments.find(
          (d) =>
            d.code.toLowerCase() === departmentInput.toLowerCase() ||
            d.name.toLowerCase() === departmentInput.toLowerCase()
        );

        // If not found in initial cache, attempt dynamic lookup or creation
        if (!resolvedDept && institutionId) {
          resolvedDept = await resolveOrCreateDepartment(departmentInput, institutionId);
          if (resolvedDept) {
            existingDepartments.push(resolvedDept); // Cache for subsequent rows
          }
        }

        if (!resolvedDept) {
          errors.push(`Unknown department code/name: "${departmentInput}"`);
        }
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
        batchEmails.add(email);
        if (studentId) batchStudentIds.add(studentId.toLowerCase());
        if (employeeId) batchEmployeeIds.add(employeeId.toLowerCase());
      } else {
        invalidCount++;
      }

      validatedRows.push({
        rowNumber: rowNum,
        isValid,
        errors,
        data: {
          name,
          email,
          role: rowRole,
          studentId,
          employeeId,
          year,
          section,
          designation: designationInput || (rowRole === 'FACULTY' ? 'Faculty Member' : 'Undergraduate Student'),
          departmentInput,
          departmentId: resolvedDept ? resolvedDept._id : null,
          departmentName: resolvedDept ? resolvedDept.name : null,
          departmentCode: resolvedDept ? resolvedDept.code : null,
        },
      });
    }

    res.json({
      success: true,
      totalRows: rows.length,
      validCount,
      invalidCount,
      validatedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Creates batch users in MongoDB Atlas with accountStatus = PENDING_ACTIVATION
 */
export const executeImportUsers = async (req, res) => {
  try {
    const { importType, validRows } = req.body; // Array of validated row data

    if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid user rows provided for import' });
    }

    // Resolve default institution
    let institution = await Institution.findOne({ code: 'SWARNANDHRA' });
    if (!institution) {
      institution = await Institution.findOne({});
    }
    const institutionId = institution ? institution._id : req.user.institutionId;

    const createdUsers = [];
    const errorList = [];
    let imported = 0;
    let skipped = 0;

    for (const item of validRows) {
      try {
        const { name, email, role, studentId, employeeId, year, section, designation, departmentId, departmentInput } = item.data;

        // Double-check uniqueness prior to insertion
        const existing = await User.findOne({ email });
        if (existing) {
          skipped++;
          errorList.push({ rowNumber: item.rowNumber, email, reason: 'User with email already exists' });
          continue;
        }

        // Ensure departmentId is resolved
        let finalDeptId = departmentId;
        if (!finalDeptId && departmentInput) {
          const deptObj = await resolveOrCreateDepartment(departmentInput, institutionId);
          if (deptObj) finalDeptId = deptObj._id;
        }

        // Generate activation code and unguessable dummy password hash
        const rawActivationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const randomPass = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPass, salt);

        const targetRole = role || (importType === 'FACULTY' ? 'FACULTY' : 'STUDENT');

        const newUser = await User.create({
          name,
          email,
          passwordHash,
          role: targetRole,
          accountStatus: 'PENDING_ACTIVATION',
          activationCode: rawActivationCode,
          institutionId,
          departmentId: finalDeptId,
          studentId: targetRole === 'STUDENT' ? studentId : null,
          employeeId: targetRole === 'FACULTY' ? employeeId : null,
          year: targetRole === 'STUDENT' ? year : null,
          section: targetRole === 'STUDENT' ? section : null,
          designation: designation || (targetRole === 'FACULTY' ? 'Faculty Member' : 'Undergraduate Student'),
          isActive: true,
        });

        imported++;
        createdUsers.push({
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          accountStatus: newUser.accountStatus,
          activationCode: newUser.activationCode,
          studentId: newUser.studentId,
          employeeId: newUser.employeeId,
        });
      } catch (err) {
        skipped++;
        errorList.push({
          rowNumber: item.rowNumber,
          email: item.data?.email || 'N/A',
          reason: err.message,
        });
      }
    }

    // Write audit log for Admin batch import
    await AuditLog.create({
      userId: req.user._id,
      action: 'ADMIN_IMPORT_USERS_BATCH',
      metadata: {
        importType,
        importedCount: imported,
        skippedCount: skipped,
        errorCount: errorList.length,
      },
    });

    res.status(201).json({
      success: true,
      imported,
      skipped,
      errorCount: errorList.length,
      errors: errorList,
      createdUsers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
