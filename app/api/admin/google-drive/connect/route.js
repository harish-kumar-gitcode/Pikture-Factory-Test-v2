import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createDriveOAuthState, driveConfigured, getDriveAuthorizationUrl } from '@/lib/googleDrive';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!driveConfigured()) {
    return NextResponse.json({ error: 'Google Drive OAuth is not configured. Add GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET.' }, { status: 503 });
  }
  const state = createDriveOAuthState();
  const response = NextResponse.json({ url: getDriveAuthorizationUrl(state) });
  response.cookies.set('pf_drive_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60,
  });
  return response;
}
