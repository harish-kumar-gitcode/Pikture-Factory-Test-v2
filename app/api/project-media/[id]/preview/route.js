import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import ProjectMedia from '@/models/ProjectMedia';
import Project from '@/models/Project';
import { downloadDriveFile } from '@/lib/googleDrive';

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !['admin', 'client'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const media = await ProjectMedia.findById(id);
  if (!media || !media.isAvailable) return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
  const project = await Project.findById(media.project).select('client drive');
  if (!project || (session.role === 'client' && project.client?.toString() !== session.id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  if (session.role === 'client') {
    const delivery = project.drive || {};
    const rawAllowed = delivery.deliveryStage === 'raw_selection' && delivery.clientRawAccess && media.workflowStage === 'raw';
    const editedAllowed = delivery.deliveryStage === 'edited_delivery' && delivery.clientEditedAccess && media.workflowStage === 'edited' && media.clientVisible;
    if (!rawAllowed && !editedAllowed) return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
  }
  if (!media.mimeType?.startsWith('image/')) return NextResponse.json({ error: 'Preview unavailable.' }, { status: 400 });
  try {
    const driveResponse = await downloadDriveFile(media.driveFileId);
    const headers = new Headers({ 'Content-Type': media.mimeType, 'Cache-Control': 'private, max-age=300' });
    if (driveResponse.headers.get('content-length')) headers.set('Content-Length', driveResponse.headers.get('content-length'));
    return new NextResponse(driveResponse.body, { status: 200, headers });
  } catch (err) {
    console.error('Drive preview error:', { mediaId: id, driveFileId: media.driveFileId, error: err?.message || err });
    return NextResponse.json({ error: 'Unable to preview this file right now.' }, { status: 502 });
  }
}
