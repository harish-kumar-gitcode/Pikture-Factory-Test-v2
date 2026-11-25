import mongoose from 'mongoose';
import NoteSchema from './NoteSchema';

const EnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    eventDate: { type: Date },
    eventPlace: { type: String, default: '' },

    vendorSelected: { type: String, default: '' },
    vendorCode: { type: String, default: '' },
    pricing: { type: Number, default: 0 },

    eventType: { type: String, default: '' },
    budget: { type: String, default: '' },
    packageSelections: [{ slug: String, name: String, category: String, price: Number, _id: false }],
    addonSelections: [{ id: String, name: String, price: Number, _id: false }],

    // Attribution for enquiries created from the public gallery lightbox.
    source: {
      type: String,
      enum: ['contact_form', 'gallery', 'other', 'package_store'],
      default: 'contact_form',
    },
    galleryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GalleryItem',
      default: null,
    },
    imagePreview: { type: String, default: '' },
    message: { type: String, default: '' },

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
