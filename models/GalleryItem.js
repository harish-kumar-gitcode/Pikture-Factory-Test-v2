import mongoose from 'mongoose';

const GalleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },

    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    vendorCode: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },

    category: { type: String, default: '' }, // set by admin on approval
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    featuredHome: { type: Boolean, default: false }, // curated by admin to show on the homepage
    deletedByVendor: { type: Boolean, default: false }, // soft-delete: hidden from vendor + public, admin still sees it (marked "Deleted")
  },
  { timestamps: true }
);

export default mongoose.models.GalleryItem || mongoose.model('GalleryItem', GalleryItemSchema);
