import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, required: true, unique: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workflowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workflow', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    extractedData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'IN_REVIEW', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'PENDING_INFO', 'ESCALATED', 'CANCELLED'],
      default: 'SUBMITTED',
    },
    priority: { type: String, enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], default: 'NORMAL' },
    currentStep: { type: String, required: true }, // Key matching workflow steps
    currentStepIndex: { type: Number, default: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    missingFields: [{ type: String }],
    history: [
      {
        step: { type: String },
        status: { type: String },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comments: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

requestSchema.index({ userId: 1, createdAt: -1 });
requestSchema.index({ departmentId: 1, status: 1 });
requestSchema.index({ assignedTo: 1, status: 1 });
requestSchema.index({ workflowId: 1 });
requestSchema.index({ institutionId: 1 });

export const Request = mongoose.model('Request', requestSchema);

