import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import Project from '@/models/Project';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

// GET client detail + their project(s)
export async function GET(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const client = await Client.findById(id).populate('vendor', 'firstName lastName vendorCode businessName');
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const projects = await Project.find({ client: client._id }).populate('vendor', 'firstName lastName vendorCode');
  return NextResponse.json({ client, projects });
}

// PATCH — manage: change project status, reassign vendor, add note
export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const client = await Client.findById(id);
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.projectStatus) client.projectStatus = body.projectStatus;

  if (body.vendorId !== undefined) {
    if (body.vendorId) {
      const vendor = await Vendor.findById(body.vendorId);
      client.vendor = vendor ? vendor._id : null;
      client.vendorCode = vendor ? vendor.vendorCode : '';
    } else {
      client.vendor = null;
      client.vendorCode = '';
    }
    // reflect the change on the linked project too
    await Project.updateMany({ client: client._id }, { vendor: client.vendor });
  }

  if (body.note && body.note.trim()) {
    client.notes.push({ text: body.note.trim(), author: session.name || 'Admin' });
  }

  await client.save();

  if (body.projectStatus) {
    await Project.updateMany({ client: client._id }, { status: body.projectStatus });
  }

  return NextResponse.json({ success: true, client });
}
