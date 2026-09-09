import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    await connectDB();
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = signToken({ id: admin._id.toString(), role: 'admin', name: admin.name, email: admin.email });
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: admin._id, name: admin.name, email: admin.email, avatar: admin.avatar },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
