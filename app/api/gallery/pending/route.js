import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';

// GET pending uploads for the admin approval queue
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const items = await GalleryItem.find({ status: 'pending' })
    .populate('vendor', 'firstName lastName vendorCode')
    .populate('project', 'projectCode')
    .sort({ createdAt: -1 });

  return NextResponse.json({ items });
}
