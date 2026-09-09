import mongoose from 'mongoose';
import NoteSchema from './NoteSchema';

/** A booked shoot / event — links a Client to a Vendor and tracks money + status */
const ProjectSchema = new mongoose.Schema(
  {
    projectCode: { type: String, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', default: null },

    eventType: { type: String, default: 'Wedding' },
    eventDate: { type: Date },
    location: { type: String, default: '' },

    status: {
      type: String,
      enum: [
        'requested', 'vendor_assigned', 'shoot_scheduled', 'shoot_completed',
        'editing', 'preview', 'client_approved', 'delivered', 'closed',
      ],
      default: 'requested',
    },

    amountTotal: { type: Number, default: 0 },
    amountPaidByClient: { type: Number, default: 0 },   // received FROM client
    amountPendingClient: { type: Number, default: 0 },  // due FROM client

    amountPaidToVendor: { type: Number, default: 0 },   // paid TO vendor
    amountPendingVendor: { type: Number, default: 0 },  // due TO vendor

    // Free-text progress update the vendor shares about the order/shoot.
    // Visible only to the admin — never exposed on the client side.
    vendorUpdate: { type: String, default: '' },
    vendorUpdateAt: { type: Date, default: null },

    // Private Google Drive delivery workspace created for this event after the vendor
    // marks the shoot completed. Only authenticated vendor/admin/client surfaces expose
    // the appropriate links/media; the Drive provider is intentionally hidden in the UI.
    drive: {
      status: { type: String, enum: ['not_created', 'ready', 'error'], default: 'not_created' },
      folderName: { type: String, default: '' },
      projectFolderId: { type: String, default: '' },
      projectFolderUrl: { type: String, default: '' },
      rawFolderId: { type: String, default: '' },
      rawFolderUrl: { type: String, default: '' },
      editedFolderId: { type: String, default: '' },
      editedFolderUrl: { type: String, default: '' },
      createdAt: { type: Date, default: null },
      lastSyncedAt: { type: Date, default: null },
      error: { type: String, default: '' },
    },

    notes: [NoteSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
