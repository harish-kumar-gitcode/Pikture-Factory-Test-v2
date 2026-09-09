import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { getSession } from '@/lib/auth';

// GET /api/enquiries — list all (admin only)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const enquiries = await Enquiry.find().sort({ createdAt: -1 });
  return NextResponse.json({ enquiries });
}

// POST /api/enquiries — create (public, from the homepage contact form)
export async function POST(req) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    if (!name || !phone) return NextResponse.json({ error: 'Name and phone number are required.' }, { status: 400 });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (!/^[+\d][\d\s()-]{7,}$/.test(phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    await connectDB();
    const enquiry = await Enquiry.create({
      name,
      email,
      phone,
      eventDate: body.eventDate || null,
      eventPlace: body.eventPlace || '',
      vendorSelected: body.vendorSelected || '',
      vendorCode: body.vendorCode || '',
      pricing: Number(body.pricing || 0),
      source: body.source || 'contact_form',
      galleryItem: body.galleryItemId || null,
      imagePreview: body.imagePreview || '',
      message: body.message || '',
    });
    return NextResponse.json({ success: true, enquiry }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit enquiry.' }, { status: 500 });
  }
}
