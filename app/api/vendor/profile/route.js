import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const vendor = await Vendor.findById(session.id).select('-password');
  return NextResponse.json({ vendor });
}

export async function PATCH(req) {
  const session = await getSession();
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const vendor = await Vendor.findById(session.id);
  if (body.avatar) vendor.avatar = body.avatar;
  await vendor.save();
  return NextResponse.json({ success: true, vendor });
}
