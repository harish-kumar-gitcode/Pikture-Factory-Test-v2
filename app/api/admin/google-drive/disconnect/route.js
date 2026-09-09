import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import { getDriveIntegration, revokeDriveConnection } from '@/lib/googleDrive';
import DriveIntegration from '@/models/DriveIntegration';

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const integration = await getDriveIntegration();
  await revokeDriveConnection(integration?.refreshToken);
  await DriveIntegration.deleteOne({ provider: 'google_drive' });
  return NextResponse.json({ success: true });
}
