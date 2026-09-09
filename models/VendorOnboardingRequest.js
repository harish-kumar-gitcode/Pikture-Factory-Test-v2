import mongoose from 'mongoose';

const VendorOnboardingRequestSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['requested', 'contacted', 'completed', 'cancelled'], default: 'requested' },
  },
  { timestamps: true }
);

export default mongoose.models.VendorOnboardingRequest || mongoose.model('VendorOnboardingRequest', VendorOnboardingRequestSchema);
