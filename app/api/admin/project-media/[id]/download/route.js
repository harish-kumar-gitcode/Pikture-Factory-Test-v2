import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import ProjectMedia from '@/models/ProjectMedia';
import { downloadDriveFile } from '@/lib/googleDrive';

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const media = await ProjectMedia.findById(id);
  if (!media || !media.isAvailable) return NextResponse.json({ error: 'Media not available.' }, { status: 404 });
  try {
    const driveResponse = await downloadDriveFile(media.driveFileId);
    const contentType = driveResponse.headers.get('content-type') || media.mimeType || 'application/octet-stream';
    const headers = new Headers({ 'Content-Type': contentType, 'Content-Disposition': `attachment; filename="${String(media.name).replace(/"/g, '')}"`, 'Cache-Control': 'private, no-store' });
    if (driveResponse.headers.get('content-length')) headers.set('Content-Length', driveResponse.headers.get('content-length'));
    return new NextResponse(driveResponse.body, { status: 200, headers });
  } catch (err) {
    console.error('Admin Drive download error:', err);
    return NextResponse.json({ error: 'Unable to download this file right now.' }, { status: 500 });
  }
}
