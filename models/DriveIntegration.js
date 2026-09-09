import mongoose from 'mongoose';

const DriveIntegrationSchema = new mongoose.Schema(
  {
    provider: { type: String, unique: true, default: 'google_drive' },
    accountEmail: { type: String, default: '' },
    refreshToken: { type: String, required: true },
    rootFolderId: { type: String, default: '' },
    rootFolderUrl: { type: String, default: '' },
    connectedAt: { type: Date, default: Date.now },
    connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.DriveIntegration || mongoose.model('DriveIntegration', DriveIntegrationSchema);
