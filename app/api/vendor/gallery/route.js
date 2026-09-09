import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';

// GET — a vendor's own uploads (all statuses) for their Portfolio tab
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const items = await GalleryItem.find({ vendor: session.id }).sort({ createdAt: -1 });
  return NextResponse.json({ items });
}
