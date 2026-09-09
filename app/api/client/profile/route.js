import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getSession } from '@/lib/auth';

// GET /api/client/profile — the logged-in client's own record
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'client') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const client = await Client.findById(session.id).populate('vendor', 'businessName vendorCode').select('-password');
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ client });
}
