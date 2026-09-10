import mongoose from 'mongoose';

const workflowStepSchema = new mongoose.Schema(
  {
    stepKey: { type: String, required: true },
    label: { type: String, required: true },
    roleRequired: { type: String, enum: ['STUDENT', 'FACULTY', 'STAFF', 'HOD', 'ADMIN', 'SYSTEM'], required: true },
    assignedDepartmentCode: { type: String, default: null }, // e.g. 'STUDENT_SECTION', 'DEPT_ACADEMIC', etc.
    isApprovalStep: { type: Boolean, default: false },
    canRequestInfo: { type: Boolean, default: true },
    autoEscalateHours: { type: Number, default: 48 },
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true }, // e.g. 'bonafide_certificate', 'leave_request'
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g. 'CERTIFICATE', 'LEAVE', 'COMPLAINT', 'GRIEVANCE'
    steps: [workflowStepSchema],
    requiredFields: [{ type: String }],
    responsibleDepartmentCode: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

workflowSchema.index({ institutionId: 1 });


export const Workflow = mongoose.model('Workflow', workflowSchema);
