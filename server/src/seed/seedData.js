import '../config/env.js';
import 'dotenv/config';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import { Institution } from '../models/Institution.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Workflow } from '../models/Workflow.js';



export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    console.log('Running Safe & Idempotent Database Seed...');

    // 1. Seed Default Institution (Swarnandhra University)
    const defaultInst = await Institution.findOneAndUpdate(
      { code: 'SWARNANDHRA' },
      {
        $setOnInsert: {
          name: 'Swarnandhra University',
          code: 'SWARNANDHRA',
          emailDomain: 'campus.edu',
          address: 'Swarnandhra Campus, Seetharampuram, Narsapur, Andhra Pradesh',
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    const instId = defaultInst._id;

    // 2. Seed Departments Safely
    const departmentDefinitions = [
      { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of Computer Science & Engineering' },
      { name: 'Electronics & Communication', code: 'ECE', description: 'Department of Electronics & Communication Engineering' },
      { name: 'Electrical & Electronics', code: 'EEE', description: 'Department of Electrical & Electronics Engineering' },
      { name: 'Student Section / Registrar', code: 'STUDENT_SECTION', description: 'Central University Student & Certificate Services' },
      { name: 'Examination & Evaluation', code: 'EXAMINATION', description: 'University Examination Controller Office' },
      { name: 'Accounts & Finance', code: 'ACCOUNTS', description: 'Fees & Financial Administration' },
      { name: 'Hostel Administration', code: 'HOSTEL', description: 'Student Accommodation & Hostel Welfare' },
      { name: 'Campus Maintenance', code: 'MAINTENANCE', description: 'Infrastructure & Electrical Maintenance' },
      { name: 'University Administration', code: 'ADMINISTRATION', description: 'Office of the Vice Chancellor & Deans' },
    ];

    const deptMap = {};
    for (const d of departmentDefinitions) {
      const deptDoc = await Department.findOneAndUpdate(
        { code: d.code },
        {
          $setOnInsert: {
            institutionId: instId,
            name: d.name,
            code: d.code,
            description: d.description,
          },
        },
        { upsert: true, new: true }
      );
      deptMap[d.code] = deptDoc._id;
    }

    // Hash default password for initial seed users
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Seed Initial System Accounts Safely ($setOnInsert preserves existing passwords & edits)
    const userDefinitions = [
      // Students
      { name: 'Surya', email: 'surya@campus.edu', role: 'STUDENT', departmentCode: 'CSE', studentId: 'STU-2026-001', designation: 'Undergraduate Student' },
      { name: 'Rahul Sharma', email: 'rahul@campus.edu', role: 'STUDENT', departmentCode: 'CSE', studentId: 'STU-2026-002', designation: 'Undergraduate Student' },
      { name: 'Priya Patel', email: 'priya@campus.edu', role: 'STUDENT', departmentCode: 'ECE', studentId: 'STU-2026-003', designation: 'Undergraduate Student' },
      { name: 'Ananya Roy', email: 'ananya@campus.edu', role: 'STUDENT', departmentCode: 'EEE', studentId: 'STU-2026-004', designation: 'Undergraduate Student' },

      // Faculty
      { name: 'Dr. Ramesh Kumar', email: 'faculty.cse@campus.edu', role: 'FACULTY', departmentCode: 'CSE', designation: 'Assistant Professor & Advisor' },
      { name: 'Prof. Sunita Rao', email: 'faculty.ece@campus.edu', role: 'FACULTY', departmentCode: 'ECE', designation: 'Associate Professor' },

      // Staff
      { name: 'Vikram Singh', email: 'staff.student@campus.edu', role: 'STAFF', departmentCode: 'STUDENT_SECTION', designation: 'Senior Section Officer' },
      { name: 'Meena Saxena', email: 'staff.exam@campus.edu', role: 'STAFF', departmentCode: 'EXAMINATION', designation: 'Evaluation Controller Staff' },
      { name: 'Rajesh Worker', email: 'staff.maintenance@campus.edu', role: 'STAFF', departmentCode: 'MAINTENANCE', designation: 'Facility Supervisor' },

      // HODs
      { name: 'Dr. A. K. Verma', email: 'hod.cse@campus.edu', role: 'HOD', departmentCode: 'CSE', designation: 'Head of Department' },
      { name: 'Dr. S. N. Gupta', email: 'hod.ece@campus.edu', role: 'HOD', departmentCode: 'ECE', designation: 'Head of Department' },

      // Admin
      { name: 'Campus System Administrator', email: 'admin@campus.edu', role: 'ADMIN', departmentCode: 'ADMINISTRATION', designation: 'System Administrator' },
    ];

    const userMap = {};
    for (const u of userDefinitions) {
      const userDoc = await User.findOneAndUpdate(
        { email: u.email },
        {
          $setOnInsert: {
            institutionId: instId,
            name: u.name,
            email: u.email,
            passwordHash,
            role: u.role,
            departmentId: deptMap[u.departmentCode] || null,
            studentId: u.studentId || null,
            designation: u.designation,
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      userMap[u.email] = userDoc._id;
    }

    // Link HODs to Departments
    if (userMap['hod.cse@campus.edu']) {
      await Department.updateOne({ code: 'CSE' }, { $set: { headUserId: userMap['hod.cse@campus.edu'] } });
    }
    if (userMap['hod.ece@campus.edu']) {
      await Department.updateOne({ code: 'ECE' }, { $set: { headUserId: userMap['hod.ece@campus.edu'] } });
    }

    // 4. Seed Core Workflows Safely
    const workflowDefinitions = [
      {
        name: 'ID Card Replacement & Reissuance',
        key: 'id_card_replacement',
        description: 'Automated processing for reissuance of lost, damaged, or stolen student identity cards.',
        category: 'ID_CARD',
        responsibleDepartmentCode: 'STUDENT_SECTION',
        requiredFields: ['purpose', 'studentId'],
        steps: [
          { stepKey: 'SUBMITTED', label: 'Request Submitted', roleRequired: 'STUDENT', isApprovalStep: false },
          { stepKey: 'VALIDATION', label: 'AI & Identity Validation', roleRequired: 'SYSTEM', isApprovalStep: false },
          { stepKey: 'ID_DESK_VERIFICATION', label: 'Student Section Desk Review', roleRequired: 'STAFF', assignedDepartmentCode: 'STUDENT_SECTION', isApprovalStep: true },
          { stepKey: 'ID_CARD_PRINTED', label: 'New ID Card Printed & Issued', roleRequired: 'STAFF', assignedDepartmentCode: 'STUDENT_SECTION', isApprovalStep: true },
          { stepKey: 'COMPLETED', label: 'ID Card Handed Over & Completed', roleRequired: 'SYSTEM', isApprovalStep: false },
        ],
      },
      {
        name: 'Bonafide Certificate Request',
        key: 'bonafide_certificate',
        description: 'Automated processing of official university bonafide certificates for internships, passport, bank accounts, or visa processing.',
        category: 'CERTIFICATE',
        responsibleDepartmentCode: 'STUDENT_SECTION',
        requiredFields: ['purpose', 'studentId'],
        steps: [
          { stepKey: 'SUBMITTED', label: 'Request Submitted', roleRequired: 'STUDENT', isApprovalStep: false },
          { stepKey: 'VALIDATION', label: 'AI & Data Validation', roleRequired: 'SYSTEM', isApprovalStep: false },
          { stepKey: 'DEPARTMENT_REVIEW', label: 'Student Section Review', roleRequired: 'STAFF', assignedDepartmentCode: 'STUDENT_SECTION', isApprovalStep: true },
          { stepKey: 'APPROVAL', label: 'Registrar Approval', roleRequired: 'STAFF', assignedDepartmentCode: 'STUDENT_SECTION', isApprovalStep: true },
          { stepKey: 'COMPLETED', label: 'Certificate Issued & Completed', roleRequired: 'SYSTEM', isApprovalStep: false },
        ],
      },
      {
        name: 'Leave & Duty Permission Request',
        key: 'leave_request',
        description: 'Academic duty leave or medical leave approval workflow.',
        category: 'LEAVE',
        responsibleDepartmentCode: 'CSE',
        requiredFields: ['purpose', 'leave_dates'],
        steps: [
          { stepKey: 'SUBMITTED', label: 'Request Submitted', roleRequired: 'STUDENT', isApprovalStep: false },
          { stepKey: 'VALIDATION', label: 'AI Validation', roleRequired: 'SYSTEM', isApprovalStep: false },
          { stepKey: 'FACULTY_REVIEW', label: 'Faculty Advisor Review', roleRequired: 'FACULTY', assignedDepartmentCode: 'CSE', isApprovalStep: true },
          { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', roleRequired: 'HOD', assignedDepartmentCode: 'CSE', isApprovalStep: true },
          { stepKey: 'COMPLETED', label: 'Leave Sanctioned', roleRequired: 'SYSTEM', isApprovalStep: false },
        ],
      },
      {
        name: 'Campus Infrastructure Complaint',
        key: 'campus_complaint',
        description: 'Reporting maintenance, electrical, hostel or facility issues.',
        category: 'COMPLAINT',
        responsibleDepartmentCode: 'MAINTENANCE',
        requiredFields: ['purpose', 'location'],
        steps: [
          { stepKey: 'SUBMITTED', label: 'Complaint Registered', roleRequired: 'STUDENT', isApprovalStep: false },
          { stepKey: 'VALIDATION', label: 'AI Triage', roleRequired: 'SYSTEM', isApprovalStep: false },
          { stepKey: 'MAINTENANCE_TRIAGE', label: 'Maintenance Staff Inspection', roleRequired: 'STAFF', assignedDepartmentCode: 'MAINTENANCE', isApprovalStep: true },
          { stepKey: 'RESOLUTION', label: 'Work Order Execution', roleRequired: 'STAFF', assignedDepartmentCode: 'MAINTENANCE', isApprovalStep: true },
          { stepKey: 'VERIFICATION', label: 'Student Verification', roleRequired: 'STUDENT', isApprovalStep: false },
          { stepKey: 'CLOSED', label: 'Complaint Resolved & Closed', roleRequired: 'SYSTEM', isApprovalStep: false },
        ],
      },
      {
        name: 'Academic Evaluation Grievance',
        key: 'academic_grievance',
        description: 'Formal academic re-evaluation and marks verification appeal.',
        category: 'GRIEVANCE',
        responsibleDepartmentCode: 'EXAMINATION',
        requiredFields: ['purpose', 'subject'],
        steps: [
          { stepKey: 'SUBMITTED', label: 'Grievance Lodged', roleRequired: 'STUDENT', isApprovalStep: false },
          { stepKey: 'VALIDATION', label: 'Exam Section Verification', roleRequired: 'SYSTEM', isApprovalStep: false },
          { stepKey: 'DEAN_REVIEW', label: 'Dean / Controller Review', roleRequired: 'STAFF', assignedDepartmentCode: 'EXAMINATION', isApprovalStep: true },
          { stepKey: 'COMMITTEE_HEARING', label: 'Academic Committee Hearing', roleRequired: 'HOD', assignedDepartmentCode: 'EXAMINATION', isApprovalStep: true },
          { stepKey: 'RESOLUTION', label: 'Marks Updated & Resolution Issued', roleRequired: 'STAFF', assignedDepartmentCode: 'EXAMINATION', isApprovalStep: true },
          { stepKey: 'CLOSED', label: 'Case Closed', roleRequired: 'SYSTEM', isApprovalStep: false },
        ],
      },
    ];

    for (const w of workflowDefinitions) {
      await Workflow.findOneAndUpdate(
        { key: w.key },
        {
          $set: {
            institutionId: instId,
            name: w.name,
            key: w.key,
            description: w.description,
            category: w.category,
            steps: w.steps,
            requiredFields: w.requiredFields,
            responsibleDepartmentCode: w.responsibleDepartmentCode,
            active: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Database Safe & Idempotent Seed Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
  }
};

if (process.argv[1] && process.argv[1].endsWith('seedData.js')) {
  seedDatabase().then(() => closeDB().then(() => process.exit(0)));
}
