import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import Client from '@/models/Client';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';
import { generateProjectCode } from '@/lib/codes';

// GET /api/projects — admin: all projects (used by Payments tab). vendor: only their own assigned
// projects (client identity always withheld — vendors never see client name/phone/email).
// client: only their own projects (vendor's personal contact withheld, business name only).
export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  if (session.role === 'vendor') {
    const projects = await Project.find({ vendor: session.id }).sort({ createdAt: -1 });
    const safe = projects.map((p) => {
      const obj = p.toObject();
      delete obj.notes;
      delete obj.amountPaidByClient;
      delete obj.amountPendingClient;
      delete obj.amountTotal;
      return obj;
    });
    return NextResponse.json({ projects: safe });
  }

  if (session.role === 'client') {
    const projects = await Project.find({ client: session.id })
      .populate('vendor', 'businessName vendorCode')
      .sort({ createdAt: -1 });
    const safe = projects.map((p) => {
      const obj = p.toObject();
      obj.notes = (obj.notes || []).filter((n) => n.visibleToClient);
      delete obj.vendorUpdate;
      delete obj.amountPaidToVendor;
      delete obj.amountPendingVendor;
      return obj;
    });
    return NextResponse.json({ projects: safe });
  }

  if (session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await Project.find()
    .populate('client', 'name clientCode')
    .populate('vendor', 'firstName lastName vendorCode')
    .sort({ createdAt: -1 });

  return NextResponse.json({ projects });
}

// POST /api/projects — admin creates a new shoot request for an existing client (e.g. client wants vendor XYZ)
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();

    const client = await Client.findById(body.clientId);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    let vendor = null;
    if (body.vendorId) vendor = await Vendor.findById(body.vendorId);

    const project = await Project.create({
      projectCode: generateProjectCode(),
      client: client._id,
      vendor: vendor ? vendor._id : null,
      eventType: body.eventType || 'Wedding',
      eventDate: body.eventDate || null,
      location: body.location || client.eventPlace || '',
      status: vendor ? 'vendor_assigned' : 'requested',
      amountTotal: body.amountTotal || 0,
      amountPendingClient: body.amountTotal || 0,
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 });
  }
}
