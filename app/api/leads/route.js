import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';

// POST /api/leads — PUBLIC: "Get a Free Quote" popup on the gallery image lightbox
export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();

    let vendorCode = '';
    let imagePreview = '';
    if (body.galleryItemId) {
      const item = await GalleryItem.findById(body.galleryItemId);
      if (item) { vendorCode = item.vendorCode; imagePreview = item.url; }
    }

    const lead = await Lead.create({
      name: body.name,
      phone: body.phone,
      galleryItem: body.galleryItemId || null,
      imagePreview,
      vendorCode,
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
  }
}

// GET — admin: view captured leads (name, phone, vendor code, image preview)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const leads = await Lead.find().sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ leads });
}
