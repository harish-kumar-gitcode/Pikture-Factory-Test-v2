import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { driveConfigured, getDriveIntegration } from '@/lib/googleDrive';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const integration = await getDriveIntegration();
  return NextResponse.json({
    configured: driveConfigured(),
    connected: !!integration,
    accountEmail: integration?.accountEmail || '',
    rootFolderUrl: integration?.rootFolderUrl || '',
    connectedAt: integration?.connectedAt || null,
  });
}
