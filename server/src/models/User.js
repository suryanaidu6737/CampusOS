import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'STAFF', 'HOD', 'ADMIN'],
      required: true,
      default: 'STUDENT',
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'PENDING_ACTIVATION', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    activationCode: { type: String, default: null },
    activationEmailSentAt: { type: Date, default: null },
    activationEmailStatus: {
      type: String,
      enum: ['NOT_SENT', 'SENT', 'FAILED'],
      default: 'NOT_SENT',
    },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    studentId: { type: String, default: null },
    employeeId: { type: String, default: null },
    year: { type: String, default: null },
    section: { type: String, default: null },
    designation: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.index({ departmentId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ institutionId: 1 });

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);

