import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const admin = await Admin.findById(session.id).select('-password');
  return NextResponse.json({ admin });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const admin = await Admin.findById(session.id);
  if (body.name) admin.name = body.name;
  if (body.avatar) admin.avatar = body.avatar;
  await admin.save();
  return NextResponse.json({ success: true, admin });
}
