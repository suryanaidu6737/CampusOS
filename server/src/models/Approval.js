import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stepKey: { type: String, required: true },
    decision: { type: String, enum: ['APPROVED', 'REJECTED', 'REQUEST_INFO', 'ESCALATED'], required: true },
    comments: { type: String, default: '' },
  },
  { timestamps: true }
);

approvalSchema.index({ requestId: 1, stepKey: 1 });

export const Approval = mongoose.model('Approval', approvalSchema);

