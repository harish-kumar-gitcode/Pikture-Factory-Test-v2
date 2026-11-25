import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    await connectDB();
    const vendor = await Vendor.findOne({ email: email.toLowerCase() });
    if (!vendor || vendor.status !== 'approved' || !vendor.password) {
      return NextResponse.json({ error: 'Invalid credentials or account not yet approved.' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, vendor.password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({
      id: vendor._id.toString(),
      role: 'vendor',
      name: `${vendor.firstName} ${vendor.lastName}`,
      email: vendor.email,
      vendorCode: vendor.vendorCode,
    });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: vendor._id, name: `${vendor.firstName} ${vendor.lastName}`, email: vendor.email, vendorCode: vendor.vendorCode },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
