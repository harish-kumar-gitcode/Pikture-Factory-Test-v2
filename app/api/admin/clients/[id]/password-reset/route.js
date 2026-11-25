import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
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
  const client = await Client.findById(id);
  if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
  if (!client.email) return NextResponse.json({ error: 'This client has no email address.' }, { status: 400 });

  const password = makePassword();
  client.password = await bcrypt.hash(password, 10);
  await client.save();

  const delivered = await sendPasswordResetEmail({
    to: client.email,
    name: client.name,
    username: client.email,
    password,
    role: 'client',
  });

  if (!delivered) {
    return NextResponse.json({ error: 'Password was changed, but the email could not be sent. Check the mail configuration.' }, { status: 502 });
  }

  return NextResponse.json({ success: true, message: `A new password was emailed to ${client.email}.` });
}
