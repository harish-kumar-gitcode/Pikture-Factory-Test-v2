import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { getSession } from '@/lib/auth';

const FOLDERS = {
  'pikture-factory/vendor-applications': { public: true, types: ['image', 'video'] },
  'pikture-factory/portfolio-uploads': { role: 'vendor', types: ['image', 'video'] },
  'pikture-factory/gallery-submissions': { role: 'vendor', types: ['image', 'video'] },
  'pikture-factory/vendor-avatars': { role: 'vendor', types: ['image'] },
  'pikture-factory/admin-avatars': { role: 'admin', types: ['image'] },
};

export async function POST(request) {
  try {
    const { folder, resourceType } = await request.json();
    const policy = FOLDERS[folder];
    if (!policy || !policy.types.includes(resourceType)) {
      return NextResponse.json({ error: 'Unsupported upload destination or file type.' }, { status: 400 });
    }

    if (!policy.public) {
      const session = await getSession();
      if (!session || session.role !== policy.role) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      process.env.CLOUDINARY_API_SECRET
    );
    return NextResponse.json({
      timestamp,
      signature,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    console.error('Cloudinary signature error:', error);
    return NextResponse.json({ error: 'Unable to create upload signature.' }, { status: 500 });
  }
}
