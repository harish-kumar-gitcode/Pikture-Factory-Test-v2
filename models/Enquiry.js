import mongoose from 'mongoose';
import NoteSchema from './NoteSchema';

const EnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, required: true },
    eventDate: { type: Date },
    eventPlace: { type: String, default: '' },

    vendorSelected: { type: String, default: '' },  // vendor name typed/selected at enquiry stage
    vendorCode: { type: String, default: '' },
    pricing: { type: Number, default: 0 },

    tag: {
      type: String,
      enum: ['new', 'follow_up', 'converted', 'lost'],
      default: 'new',
    },

    notes: [NoteSchema],
    convertedToClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
