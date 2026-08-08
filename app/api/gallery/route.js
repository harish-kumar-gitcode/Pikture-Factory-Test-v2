import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import GalleryItem from '@/models/GalleryItem';
import Vendor from '@/models/Vendor';
import { getSession } from '@/lib/auth';

// GET /api/gallery?category=&featured=  — PUBLIC: only approved (and not vendor-deleted) items,
// for the homepage + gallery page. Pass featured=1 for the curated homepage showcase.
//
// GET /api/gallery?admin=1&status=&vendor=&search=  — ADMIN: "View Vendor Gallery" screen.
// Returns every status (including vendor-deleted, marked so the admin can still see it) for
// browsing/searching a vendor's uploads and toggling which ones are featured on the homepage.
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || '';
  const isAdminRequest = searchParams.get('admin') === '1';

  if (isAdminRequest) {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const status = searchParams.get('status') || '';
    const vendorId = searchParams.get('vendor') || '';
    const projectId = searchParams.get('project') || '';
    const search = searchParams.get('search') || '';

    const query = {};
    if (status) query.status = status;
    if (vendorId) query.vendor = vendorId;
    if (projectId === 'none') query.project = null;
    else if (projectId) query.project = projectId;
    if (category) query.category = category;
    if (search) {
      const matchingVendors = await Vendor.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { businessName: { $regex: search, $options: 'i' } },
          { vendorCode: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.$or = [
        { vendorCode: { $regex: search, $options: 'i' } },
        { vendor: { $in: matchingVendors.map((v) => v._id) } },
      ];
    }

    const items = await GalleryItem.find(query)
      .populate('vendor', 'firstName lastName vendorCode businessName')
      .populate('project', 'projectCode')
      .sort({ createdAt: -1 })
      .limit(400);
    return NextResponse.json({ items });
  }

  const featured = searchParams.get('featured') === '1';
  const query = { status: 'approved', deletedByVendor: { $ne: true } };
  if (category) query.category = category;
  if (featured) query.featuredHome = true;

  const items = await GalleryItem.find(query).sort({ createdAt: -1 }).limit(200);
  return NextResponse.json({ items });
}

// POST /api/gallery — vendor submits a photo/video (already uploaded to Cloudinary) for admin approval
export async function POST(req) {
  const session = await getSession();
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    await connectDB();
    const item = await GalleryItem.create({
      url: body.url,
      publicId: body.publicId,
      type: body.type || 'image',
      vendor: session.id,
      vendorCode: session.vendorCode,
      project: body.projectId || null,
    });
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to submit upload.' }, { status: 500 });
  }
}
