import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    emailDomain: { type: String, default: 'campus.edu' },
    address: { type: String, default: 'Swarnandhra Campus, Seetharampuram, Andhra Pradesh' },
    logo: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Institution = mongoose.model('Institution', institutionSchema);
