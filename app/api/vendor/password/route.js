import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

export async function PATCH(req) {
  const session = await getSession();
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  await connectDB();
  const vendor = await Vendor.findById(session.id);
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, vendor.password);
  if (!match) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

  vendor.password = await bcrypt.hash(newPassword, 10);
  await vendor.save();
  return NextResponse.json({ success: true });
}
