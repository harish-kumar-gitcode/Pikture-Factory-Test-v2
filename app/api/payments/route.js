import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import { getSession } from '@/lib/auth';

// GET /api/payments — powers the Admin Payments tab (All / Clients / Vendors views)
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const projects = await Project.find()
    .populate('client', 'name clientCode')
    .populate('vendor', 'firstName lastName vendorCode')
    .sort({ createdAt: -1 });

  const clientPayments = projects.map((p) => ({
    projectId: p._id,
    projectCode: p.projectCode,
    client: p.client,
    total: p.amountTotal,
    paid: p.amountPaidByClient,
    pending: p.amountPendingClient,
  }));

  const vendorPayments = projects
    .filter((p) => p.vendor)
    .map((p) => ({
      projectId: p._id,
      projectCode: p.projectCode,
      vendor: p.vendor,
      paid: p.amountPaidToVendor,
      pending: p.amountPendingVendor,
    }));

  const totals = {
    clientCollected: clientPayments.reduce((s, p) => s + p.paid, 0),
    clientPending: clientPayments.reduce((s, p) => s + p.pending, 0),
    vendorPaid: vendorPayments.reduce((s, p) => s + p.paid, 0),
    vendorPending: vendorPayments.reduce((s, p) => s + p.pending, 0),
  };

  return NextResponse.json({ clientPayments, vendorPayments, totals });
}
