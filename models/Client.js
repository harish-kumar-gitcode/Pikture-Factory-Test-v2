import mongoose from 'mongoose';
import NoteSchema from './NoteSchema';

const ClientSchema = new mongoose.Schema(
  {
    clientCode: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },

    eventDate: { type: Date },
    eventPlace: { type: String },
    pricing: { type: Number, default: 0 },

    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },
    vendorCode: { type: String, default: '' },

    projectStatus: {
      type: String,
      enum: [
        'lead', 'booked', 'vendor_assigned', 'shoot_scheduled',
        'shoot_completed', 'editing', 'preview', 'approved',
        'delivered', 'closed',
      ],
      default: 'booked',
    },

    notes: [NoteSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model('Client', ClientSchema);
