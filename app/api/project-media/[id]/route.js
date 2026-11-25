import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import ProjectMedia from '@/models/ProjectMedia';

export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const media = await ProjectMedia.findById(id);
  if (!media) return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
  const body = await req.json();
  if (body.clientVisible !== undefined) media.clientVisible = !!body.clientVisible;
  if (typeof body.album === 'string' && body.album.trim()) media.album = body.album.trim().slice(0, 80);
  await media.save();
  return NextResponse.json({ success: true, media });
}
