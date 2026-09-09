import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Vendor from '@/models/Vendor';
import VendorOnboardingRequest from '@/models/VendorOnboardingRequest';
import { sendVendorOnboardingRequestEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    if (!body.date || !body.time) return NextResponse.json({ error: 'Preferred date and time are required.' }, { status: 400 });
    const preferredDate = new Date(`${body.date}T${body.time}:00`);
    if (Number.isNaN(preferredDate.getTime())) return NextResponse.json({ error: 'Please choose a valid date and time.' }, { status: 400 });
    await connectDB();
    const vendor = await Vendor.findById(session.id).select('firstName lastName businessName email vendorCode phone');
    if (!vendor) return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });
    const request = await VendorOnboardingRequest.create({ vendor: vendor._id, preferredDate, preferredTime: body.time, notes: body.notes || '' });
    await sendVendorOnboardingRequestEmail({ vendor, preferredDate, preferredTime: body.time, notes: body.notes || '' });
    return NextResponse.json({ success: true, requestId: request._id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Could not submit onboarding request.' }, { status: 500 });
  }
}
