import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Enquiry from '@/models/Enquiry';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

// GET single enquiry with full detail (name, contact, event info, vendor, pricing, notes)
export async function GET(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const enquiry = await Enquiry.findById(id);
  if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ enquiry });
}

// PATCH — update lead fields, tag, and/or push a new timestamped note
export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const enquiry = await Enquiry.findById(id);
  if (!enquiry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const editableFields = ['name', 'email', 'phone', 'eventDate', 'eventPlace', 'vendorSelected', 'vendorCode', 'pricing', 'tag'];
  editableFields.forEach((f) => {
    if (body[f] !== undefined) enquiry[f] = body[f];
  });

  if (body.note && body.note.trim()) {
    enquiry.notes.push({ text: body.note.trim(), author: body.author || 'Admin' });
  }

  await enquiry.save();
  return NextResponse.json({ success: true, enquiry });
}
