import mongoose from 'mongoose';

const ProjectMediaSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    driveFileId: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    modifiedTime: { type: Date, default: null },
    webViewLink: { type: String, default: '' },
    thumbnailLink: { type: String, default: '' },
    parentFolderId: { type: String, default: '' },
    folderPath: { type: String, default: '' },
    album: { type: String, default: '' },
    // raw = original client-selection asset; selected = copied into an editing round;
    // edited = final delivery asset uploaded to EDITED.
    workflowStage: {
      type: String,
      enum: ['raw', 'selected', 'edited'],
      default: 'raw',
    },
    selectionRound: { type: Number, default: 0 },
    sourceDriveFileId: { type: String, default: '' },
    clientVisible: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ProjectMediaSchema.index({ project: 1, driveFileId: 1 }, { unique: true });
ProjectMediaSchema.index({ project: 1, clientVisible: 1 });

export default mongoose.models.ProjectMedia || mongoose.model('ProjectMedia', ProjectMediaSchema);
