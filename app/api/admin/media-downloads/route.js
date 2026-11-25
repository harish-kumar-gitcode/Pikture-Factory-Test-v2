import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import MediaDownload from '@/models/MediaDownload';
import '@/models/Client';
import '@/models/Project';
import '@/models/ProjectMedia';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const downloads = await MediaDownload.find().sort({ downloadedAt: -1 }).limit(80)
    .populate('client', 'name clientCode')
    .populate('project', 'projectCode eventType eventDate')
    .populate('media', 'name album');
  return NextResponse.json({ downloads });
}
