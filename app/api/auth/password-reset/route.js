import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';

function makePassword() {
  // Easy enough to type, while still providing a fresh random credential.
  return `PF-${crypto.randomBytes(4).toString('hex').toUpperCase()}!`;
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = body.role === 'vendor' ? 'vendor' : 'client';
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Password resets can only be initiated by an admin from the account record.' }, { status: 403 });
    }

    await connectDB();
    const Model = role === 'vendor' ? Vendor : Client;
    const account = await Model.findOne({ email });

    // Do not reveal whether an email is registered when the request comes from a login page.
    if (!account) {
      return NextResponse.json({ success: true, message: 'If an account exists for that email, a new password has been sent.' });
    }

    if (role === 'vendor' && account.status && !['approved', 'active'].includes(account.status)) {
      return NextResponse.json({ error: 'This vendor account is not active.' }, { status: 403 });
    }

    const newPassword = makePassword();
    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();

    const name = role === 'vendor'
      ? `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.businessName || 'Vendor'
      : account.name || 'Client';

    const delivered = await sendPasswordResetEmail({
      to: account.email,
      name,
      username: account.email,
      password: newPassword,
      role,
    });

    if (!delivered) {
      return NextResponse.json({ error: 'The new password was generated, but the email could not be sent. Please check the mail configuration before trying again.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'A new password has been sent to your email address.' });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Unable to reset the password right now.' }, { status: 500 });
  }
}
