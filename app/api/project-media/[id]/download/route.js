import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import ProjectMedia from '@/models/ProjectMedia';
import Project from '@/models/Project';
import MediaDownload from '@/models/MediaDownload';
import { downloadDriveFile } from '@/lib/googleDrive';

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'client') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const media = await ProjectMedia.findById(id);
  if (!media || !media.clientVisible || !media.isAvailable) return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
  const project = await Project.findById(media.project).select('client projectCode');
  if (!project || project.client?.toString() !== session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const driveResponse = await downloadDriveFile(media.driveFileId);
    const contentType = driveResponse.headers.get('content-type') || media.mimeType || 'application/octet-stream';
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${String(media.name).replace(/"/g, '')}"`,
      'Cache-Control': 'private, no-store',
    });
    if (driveResponse.headers.get('content-length')) headers.set('Content-Length', driveResponse.headers.get('content-length'));
    media.downloadCount = (media.downloadCount || 0) + 1;
    media.lastDownloadedAt = new Date();
    await media.save();
    await MediaDownload.create({ project: media.project, media: media._id, client: session.id, fileName: media.name });
    return new NextResponse(driveResponse.body, { status: 200, headers });
  } catch (err) {
    console.error('Drive download error:', err);
    return NextResponse.json({ error: 'Unable to download this file right now.' }, { status: 500 });
  }
}
