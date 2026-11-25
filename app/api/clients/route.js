import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';
import { generateClientCode, generateProjectCode, generateTempPassword } from '@/lib/codes';
import { sendClientCredentialsEmail } from '@/lib/mailer';

// GET /api/clients?search=&status=  — list with search (name/phone) + status filter
export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  if (status) query.projectStatus = status;

  const clients = await Client.find(query).populate('vendor', 'firstName lastName vendorCode').sort({ createdAt: -1 });
  return NextResponse.json({ clients });
}

// POST /api/clients — admin creates a client (from enquiry or fresh), auto-generates login + emails credentials
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    if (!name || !email || !phone) return NextResponse.json({ error: 'Name, email and phone are required.' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    if (!/^[+\d][\d\s()-]{7,}$/.test(phone)) return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 400 });
    await connectDB();

    let vendorDoc = null;
    if (body.vendorId) vendorDoc = await Vendor.findById(body.vendorId);

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 10);

    const client = await Client.create({
      clientCode: await generateClientCode(),
      name,
      email,
      phone,
      password: hashed,
      eventDate: body.eventDate || null,
      eventPlace: body.eventPlace || '',
      pricing: body.pricing || 0,
      vendor: vendorDoc ? vendorDoc._id : null,
      vendorCode: vendorDoc ? vendorDoc.vendorCode : '',
      projectStatus: vendorDoc ? 'vendor_assigned' : 'booked',
    });

    const project = await Project.create({
      projectCode: generateProjectCode(),
      client: client._id,
      vendor: vendorDoc ? vendorDoc._id : null,
      eventType: body.eventType || 'Wedding',
      eventDate: body.eventDate || null,
      location: body.eventPlace || '',
      status: vendorDoc ? 'vendor_assigned' : 'requested',
      amountTotal: body.pricing || 0,
      amountPendingClient: body.pricing || 0,
    });

    await sendClientCredentialsEmail({
      to: client.email,
      name: client.name,
      username: client.email,
      password: tempPassword,
    });

    return NextResponse.json({ success: true, client, project }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create client.' }, { status: 500 });
  }
}
