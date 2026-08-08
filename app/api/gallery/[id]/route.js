import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';

// PATCH — admin approves (with category) / rejects a pending upload, or
// toggles whether an approved item is featured on the homepage showcase.
export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const item = await GalleryItem.findById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  if (body.action === 'approve') {
    item.status = 'approved';
    item.category = body.category || item.category || 'Uncategorised';
  } else if (body.action === 'reject') {
    item.status = 'rejected';
    item.featuredHome = false;
  } else if (body.action === 'feature') {
    item.featuredHome = true;
  } else if (body.action === 'unfeature') {
    item.featuredHome = false;
  }

  await item.save();
  return NextResponse.json({ success: true, item });
}
