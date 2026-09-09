import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Project from '@/models/Project';
import { createDriveFolder, ensureVendorDriveAccess, isFolderInsideRoot, listDriveFolders } from '@/lib/googleDrive';

async function getProjectForSession(id, session) {
  const project = await Project.findById(id).populate('vendor', 'email vendorCode firstName lastName businessName').populate('client', 'name clientCode');
  if (!project) return { error: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
  if (session.role === 'admin') return { project };
  if (session.role === 'vendor' && project.vendor?._id?.toString() === session.id) return { project };
  if (session.role === 'client' && project.client?._id?.toString() === session.id) return { project };
  return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) };
}

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !['admin', 'vendor'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { project, error } = await getProjectForSession(id, session);
  if (error) return error;
  if (!project.drive?.projectFolderId) return NextResponse.json({ error: 'Drive workspace has not been created yet.' }, { status: 400 });
  try {
    if (session.role === 'vendor' && project.vendor?.email) { try { await ensureVendorDriveAccess(project.drive.projectFolderId, project.vendor.email); } catch (shareError) { console.warn('Vendor Drive access refresh warning:', shareError.message); } }
    const folders = await listDriveFolders(project.drive.projectFolderId);
    return NextResponse.json({ folders, roots: { project: project.drive.projectFolderId, raw: project.drive.rawFolderId, edited: project.drive.editedFolderId } });
  } catch (err) { return NextResponse.json({ error: err.message || 'Unable to load Drive folders.' }, { status: 500 }); }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !['admin', 'vendor'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const { project, error } = await getProjectForSession(id, session);
  if (error) return error;
  if (!project.drive?.projectFolderId) return NextResponse.json({ error: 'Drive workspace has not been created yet.' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const parentId = String(body.parentId || project.drive.projectFolderId).trim();
  if (!name) return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
  try {
    if (!(await isFolderInsideRoot(parentId, project.drive.projectFolderId))) return NextResponse.json({ error: 'That folder is outside this project workspace.' }, { status: 400 });
    if (session.role === 'vendor' && project.vendor?.email) await ensureVendorDriveAccess(project.drive.projectFolderId, project.vendor.email);
    const folder = await createDriveFolder(name, parentId);
    return NextResponse.json({ success: true, folder });
  } catch (err) { return NextResponse.json({ error: err.message || 'Unable to create Drive folder.' }, { status: 500 }); }
}
