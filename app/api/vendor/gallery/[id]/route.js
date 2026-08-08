import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';

// PATCH — a vendor removes (or restores) one of their own uploads.
// This is a soft delete: it disappears from the vendor's active list and from the
// public site, but the admin can still see the item, marked "Deleted by vendor".
export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const item = await GalleryItem.findById(id);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (item.vendor.toString() !== session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  if (body.action === 'delete') {
    item.deletedByVendor = true;
    item.featuredHome = false;
  } else if (body.action === 'restore') {
    item.deletedByVendor = false;
  }

  await item.save();
  return NextResponse.json({ success: true, item });
}
