import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getSession } from '@/lib/auth';

// GET — admin sees all tickets; client sees only their own
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const query = session.role === 'client' ? { client: session.id } : {};
  const tickets = await Ticket.find(query).populate('client', 'name clientCode').sort({ createdAt: -1 });
  return NextResponse.json({ tickets });
}

// POST — client raises a support ticket
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'client') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await connectDB();
  const ticket = await Ticket.create({
    client: session.id,
    subject: body.subject,
    message: body.message,
    priority: body.priority || 'Low',
  });

  return NextResponse.json({ success: true, ticket }, { status: 201 });
}
