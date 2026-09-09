import mongoose from 'mongoose';

const MediaDownloadSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectMedia', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    fileName: { type: String, default: '' },
    downloadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.MediaDownload || mongoose.model('MediaDownload', MediaDownloadSchema);
