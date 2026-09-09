import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import GalleryItem from '@/models/GalleryItem';
import Enquiry from '@/models/Enquiry';
import { getSession } from '@/lib/auth';

// POST — public gallery quote request. The request is recorded both as a Lead
// and as an Enquiry so admins see it in the normal Enquiries workspace.
export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone number are required.' }, { status: 400 });
    }

    if (!/^[+\d][\d\s()-]{7,}$/.test(phone)) {
      return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    }

    await connectDB();

    let vendorCode = '';
    let imagePreview = '';
    let vendorSelected = '';

    if (body.galleryItemId) {
      const item = await GalleryItem.findById(body.galleryItemId)
        .populate('vendor', 'firstName lastName businessName vendorCode')
        .lean();

      if (item) {
        vendorCode = item.vendorCode || item.vendor?.vendorCode || '';
        imagePreview = item.url || '';
        vendorSelected = item.vendor?.businessName || '';
      }
    }

    const lead = await Lead.create({
      name,
      phone,
      galleryItem: body.galleryItemId || null,
      imagePreview,
      vendorCode,
    });

    const enquiry = await Enquiry.create({
      name,
      phone,
      vendorSelected,
      vendorCode,
      source: 'gallery',
      galleryItem: body.galleryItemId || null,
      imagePreview,
      message: body.message || 'Quote requested from homepage gallery image.',
      tag: 'new',
    });

    return NextResponse.json({ success: true, lead, enquiry }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const leads = await Lead.find().sort({ createdAt: -1 }).limit(100);
  return NextResponse.json({ leads });
}
