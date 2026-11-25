import mongoose from 'mongoose';

/** "Get a Free Quote" popup submissions triggered from the public gallery */
const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    galleryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'GalleryItem' },
    imagePreview: { type: String, default: '' },
    vendorCode: { type: String, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'converted'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
