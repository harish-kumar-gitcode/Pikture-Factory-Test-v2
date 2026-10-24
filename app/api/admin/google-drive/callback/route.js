import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { exchangeCode, saveDriveConnection, driveConfigured } from '@/lib/googleDrive';
import { connectDB } from '@/lib/mongodb';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const cookieState = request.cookies.get('pf_drive_oauth_state')?.value;

  if (error) return NextResponse.redirect(new URL(`/admin/settings?drive=error&message=${encodeURIComponent(error)}`, request.url));
  if (!code || !state || state !== cookieState) {
    return NextResponse.redirect(new URL('/admin/settings?drive=error&message=Invalid%20authorization%20state', request.url));
  }

  const session = await getSession();
  if (!session || session.role !== 'admin' || !driveConfigured()) {
    return NextResponse.redirect(new URL('/admin/settings?drive=error&message=Unauthorized', request.url));
  }

  try {
    await connectDB();
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Please reconnect and approve Drive access.');
    await saveDriveConnection({ refreshToken: tokens.refresh_token, accessToken: tokens.access_token, adminId: session.id });
    const response = NextResponse.redirect(new URL('/admin/settings?drive=connected', request.url));
    response.cookies.delete('pf_drive_oauth_state');
    return response;
  } catch (err) {
    console.error('Google Drive callback error:', err);
    return NextResponse.redirect(new URL(`/admin/settings?drive=error&message=${encodeURIComponent(err.message)}`, request.url));
  }
}
