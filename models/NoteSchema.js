import mongoose from 'mongoose';

/** Reusable embedded sub-schema for timestamped notes / audit trail entries */
const NoteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, default: 'Admin' },
    field: { type: String, default: '' },     // e.g. "amountPaidToVendor" when logging an edit
    oldValue: { type: String, default: '' },
    newValue: { type: String, default: '' },
    visibleToClient: { type: Boolean, default: false }, // shown on the client's own dashboard when true
    visibleToVendor: { type: Boolean, default: false }, // shown in the vendor's project chat when true
  },
  { timestamps: true }
);

export default NoteSchema;
