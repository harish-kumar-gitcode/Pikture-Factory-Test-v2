import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';

// POST /api/vendors/apply — public vendor registration (final step of the wizard).
// Media is uploaded directly to Cloudinary in the browser; this receives the resulting URLs.
export async function POST(req) {
  try {
    const body = await req.json();
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const businessName = String(body.businessName || '').trim();
    const location = String(body.location || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    if (!firstName || !lastName || !businessName || !location || !email || !phone) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (!/^[+\d][\d\s()-]{7,}$/.test(phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    await connectDB();

    const vendor = await Vendor.create({
      firstName,
      lastName,
      businessName,
      servicesProvided: body.servicesProvided || [],
      location,
      yearsOfExperience: body.yearsOfExperience || 0,
      email,
      phone,
      portfolioSamples: body.portfolioSamples || [],
      status: 'pending',
    });

    return NextResponse.json({ success: true, vendor }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}
