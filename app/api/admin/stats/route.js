import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import Vendor from '@/models/Vendor';
import Enquiry from '@/models/Enquiry';
import Project from '@/models/Project';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const [activeProjects, totalClients, pendingGallery, projects, recentEnquiries] = await Promise.all([
    Project.countDocuments({ status: { $nin: ['closed', 'delivered'] } }),
    Client.countDocuments(),
    GalleryItem.countDocuments({ status: 'pending' }),
    Project.find(),
    Enquiry.find().sort({ createdAt: -1 }).limit(5),
  ]);

  const revenue = projects.reduce((s, p) => s + (p.amountPaidByClient || 0), 0);

  return NextResponse.json({
    stats: { activeProjects, totalClients, pendingGallery, revenue },
    recentEnquiries,
  });
}
