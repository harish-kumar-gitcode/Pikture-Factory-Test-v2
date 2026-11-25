import mongoose from 'mongoose';
import NoteSchema from './NoteSchema';

const VendorSchema = new mongoose.Schema(
  {
    vendorCode: { type: String, unique: true, sparse: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    businessName: { type: String, required: true },
    servicesProvided: [{ type: String }],       // ['Wedding','Corporate',...]
    location: { type: String, required: true }, // area serviceable
    yearsOfExperience: { type: Number, default: 0 },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },

    portfolioSamples: [
      {
        url: String,
        publicId: String,
        type: { type: String, enum: ['image', 'video'], default: 'image' },
      },
    ],

    avatar: { type: String, default: '' },
    password: { type: String, default: '' }, // set only once approved

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    notes: [NoteSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
