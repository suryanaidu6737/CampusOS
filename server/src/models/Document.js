import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
    fileName: { type: String, required: true },
    documentType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    extractedMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

documentSchema.index({ requestId: 1 });

export const Document = mongoose.model('Document', documentSchema);

