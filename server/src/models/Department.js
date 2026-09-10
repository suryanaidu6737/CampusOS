import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    headUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);


export const Department = mongoose.model('Department', departmentSchema);
