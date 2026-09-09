import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { getSession } from '@/lib/auth';

// PATCH — admin replies and/or updates status (open / in_progress / follow_up / closed)
export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const ticket = await Ticket.findById(id);
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  if (body.status) ticket.status = body.status;
  if (body.reply && body.reply.trim()) {
    ticket.replies.push({ message: body.reply.trim(), author: session.name || 'Admin' });
  }
  ticket.seenByAdmin = true;

  await ticket.save();
  return NextResponse.json({ success: true, ticket });
}
