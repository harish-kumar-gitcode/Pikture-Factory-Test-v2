import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

// GET /api/vendors?status=approved&search=&from=&to=  — list vendors
// status defaults to 'approved' (the main roster); pass status=pending or status=rejected for the other tabs
export async function GET(req) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'approved';
  const search = searchParams.get('search') || '';

  const query = { status };
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { businessName: { $regex: search, $options: 'i' } },
      { vendorCode: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const vendors = await Vendor.find(query).sort({ createdAt: -1 });
  return NextResponse.json({ vendors });
}
