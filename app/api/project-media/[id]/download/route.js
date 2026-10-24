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
  if (!session || !['admin', 'client', 'vendor'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const media = await ProjectMedia.findById(id);
  if (!media || !media.isAvailable) {
    return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
  }

  const project = await Project.findById(media.project).select('client vendor projectCode');
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  if (session.role === 'client') {
    if (project.client?.toString() !== session.id) {
      return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
    }
    const fullProject = await Project.findById(media.project).select('client drive');
    const delivery = fullProject?.drive || {};
    const rawAllowed = delivery.deliveryStage === 'raw_selection' && delivery.clientRawAccess && media.workflowStage === 'raw';
    const editedAllowed = delivery.deliveryStage === 'edited_delivery' && delivery.clientEditedAccess && media.workflowStage === 'edited' && media.clientVisible;
    if (!rawAllowed && !editedAllowed) {
      return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
    }
  }

  if (session.role === 'vendor' && project.vendor?.toString() !== session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const driveResponse = await downloadDriveFile(media.driveFileId);
    const contentType = driveResponse.headers.get('content-type') || media.mimeType || 'application/octet-stream';
    const safeName = String(media.name || 'media-file').replace(/[\\"\r\n]/g, '');
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
    });

    if (driveResponse.headers.get('content-length')) {
      headers.set('Content-Length', driveResponse.headers.get('content-length'));
    }

    if (session.role === 'client') {
      media.downloadCount = (media.downloadCount || 0) + 1;
      media.lastDownloadedAt = new Date();
      await media.save();
      await MediaDownload.create({
        project: media.project,
        media: media._id,
        client: session.id,
        fileName: media.name,
      });
    }

    return new NextResponse(driveResponse.body, { status: 200, headers });
  } catch (err) {
    console.error('Drive download error:', err);
    return NextResponse.json({ error: 'Unable to download this file right now.' }, { status: 500 });
  }
}
