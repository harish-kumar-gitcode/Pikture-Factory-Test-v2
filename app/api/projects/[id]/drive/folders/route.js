import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Project from '@/models/Project';
import { createDriveFolder, listDriveFolders, ensureProjectDriveFolders } from '@/lib/googleDrive';

async function getAuthorizedProject(id) {
  const session = await getSession();
  if (!session) return { session: null, project: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  await connectDB();
  const project = await Project.findById(id).populate('client', 'name').populate('vendor', 'email firstName lastName vendorCode businessName');
  if (!project) return { session, project: null, response: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };

  if (session.role === 'admin') return { session, project, response: null };
  if (session.role === 'vendor' && project.vendor?._id?.toString() === session.id) return { session, project, response: null };
  if (session.role === 'client' && project.client?._id?.toString() === session.id) return { session, project, response: null };

  return { session, project: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) };
}

export async function GET(req, { params }) {
  const { id } = await params;
  const auth = await getAuthorizedProject(id);
  if (auth.response) return auth.response;
  if (auth.session.role === 'client') return NextResponse.json({ error: 'Drive folders are private.' }, { status: 403 });

  try {
    let drive = auth.project.drive?.toObject?.() || auth.project.drive || {};
    if (!drive.projectFolderId) {
      const populated = await Project.findById(id).populate('client', 'name').populate('vendor', 'email firstName lastName vendorCode businessName');
      const ensured = await ensureProjectDriveFolders(populated, populated.vendor?.email || '');
      auth.project.drive = { ...drive, ...ensured, status: 'ready' };
      await auth.project.save();
      drive = auth.project.drive.toObject?.() || auth.project.drive;
    }

    const folders = await listDriveFolders(drive.projectFolderId);
    return NextResponse.json({
      projectFolder: {
        id: drive.projectFolderId,
        name: drive.folderName,
        url: drive.projectFolderUrl,
      },
      folders,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to load Drive folders.' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  const auth = await getAuthorizedProject(id);
  if (auth.response) return auth.response;
  if (auth.session.role === 'client') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const body = await req.json();
    const name = String(body?.name || '').trim();
    const parentId = String(body?.parentId || '').trim();
    if (!name || !parentId) return NextResponse.json({ error: 'Folder name and parent folder are required.' }, { status: 400 });

    let drive = auth.project.drive?.toObject?.() || auth.project.drive || {};
    if (!drive.projectFolderId) {
      const populated = await Project.findById(id).populate('client', 'name').populate('vendor', 'email firstName lastName vendorCode businessName');
      const ensured = await ensureProjectDriveFolders(populated, populated.vendor?.email || '');
      auth.project.drive = { ...drive, ...ensured, status: 'ready' };
      await auth.project.save();
      drive = auth.project.drive.toObject?.() || auth.project.drive;
    }

    const folders = await listDriveFolders(drive.projectFolderId);
    const allowedParents = new Set([drive.projectFolderId, ...folders.map((folder) => folder.id)]);
    if (!allowedParents.has(parentId)) {
      return NextResponse.json({ error: 'That folder does not belong to this project workspace.' }, { status: 403 });
    }

    const existing = folders.find((folder) => folder.parentId === parentId && folder.name.toLowerCase() === name.toLowerCase());
    if (existing) return NextResponse.json({ folder: existing, alreadyExists: true });

    const folder = await createDriveFolder(name, parentId);
    const parent = parentId === drive.projectFolderId
      ? drive.folderName
      : folders.find((item) => item.id === parentId)?.path || 'Project';

    return NextResponse.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        parentId,
        path: `${parent}/${folder.name}`,
        webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to create Drive folder.' }, { status: 500 });
  }
}
