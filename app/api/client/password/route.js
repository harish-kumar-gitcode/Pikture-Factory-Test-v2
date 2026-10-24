import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getSession } from '@/lib/auth';

export async function PATCH(req) {
  const session = await getSession();
  if (!session || session.role !== 'client') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  await connectDB();
  const client = await Client.findById(session.id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const match = await bcrypt.compare(currentPassword, client.password);
  if (!match) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });

  client.password = await bcrypt.hash(newPassword, 10);
  await client.save();
  return NextResponse.json({ success: true });
}
