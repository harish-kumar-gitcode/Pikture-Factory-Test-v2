import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';

function makePassword() {
  return `PF-${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
}

export async function POST(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const vendor = await Vendor.findById(id);
  if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
  if (!vendor.email) return NextResponse.json({ error: 'This vendor has no email address.' }, { status: 400 });
  if (vendor.status !== 'approved') return NextResponse.json({ error: 'Only an approved vendor can receive a portal password.' }, { status: 409 });

  const password = makePassword();
  vendor.password = await bcrypt.hash(password, 10);
  await vendor.save();

  const delivered = await sendPasswordResetEmail({
    to: vendor.email,
    name: `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || vendor.businessName,
    username: vendor.email,
    password,
    role: 'vendor',
  });

  if (!delivered) {
    return NextResponse.json({ error: 'Password was changed, but the email could not be sent. Check the mail configuration.' }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: `A new password was emailed to ${vendor.email}.` });
}
