import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';

// POST /api/vendors/apply — public vendor registration (final step of the wizard).
// Media is uploaded directly to Cloudinary in the browser; this receives the resulting URLs.
export async function POST(req) {
  try {
    const body = await req.json();
    await connectDB();

    const vendor = await Vendor.create({
      firstName: body.firstName,
      lastName: body.lastName,
      businessName: body.businessName,
      servicesProvided: body.servicesProvided || [],
      location: body.location,
      yearsOfExperience: body.yearsOfExperience || 0,
      email: body.email.toLowerCase(),
      phone: body.phone,
      portfolioSamples: body.portfolioSamples || [],
      status: 'pending',
    });

    return NextResponse.json({ success: true, vendor }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}
