import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { getSession } from '@/lib/auth';

export async function PATCH(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  await connectDB();
  const admin = await Admin.findById(session.id);
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, admin.password);
  if (!match) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();
  return NextResponse.json({ success: true });
}
