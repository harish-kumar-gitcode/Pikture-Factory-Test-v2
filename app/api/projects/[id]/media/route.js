import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Project from '@/models/Project';
import ProjectMedia from '@/models/ProjectMedia';
import { ensureProjectDriveFolders, listDriveTree } from '@/lib/googleDrive';
import { sendVendorDriveLinksEmail } from '@/lib/mailer';

function mediaPayload(item) {
  const obj = item.toObject ? item.toObject() : { ...item };
  obj.type = obj.mimeType?.startsWith('video/') ? 'video' : 'image';
  return obj;
}

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const project = await Project.findById(id).populate('client', 'name clientCode').populate('vendor', 'firstName lastName vendorCode email businessName');
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  if (session.role === 'vendor' && project.vendor?._id?.toString() !== session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  if (session.role === 'client' && project.client?._id?.toString() !== session.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  if (!['admin', 'vendor', 'client'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const query = { project: id, isAvailable: { $ne: false } };
  if (session.role === 'client') query.clientVisible = true;
  const media = await ProjectMedia.find(query).sort({ album: 1, name: 1 });
  const safeProject = project.toObject();
  if (session.role === 'client') {
    delete safeProject.drive;
    safeProject.vendor = safeProject.vendor ? { businessName: safeProject.vendor.businessName, vendorCode: safeProject.vendor.vendorCode } : null;
  }
  if (session.role === 'vendor') {
    safeProject.client = { clientCode: safeProject.client?.clientCode || '' };
    delete safeProject.amountTotal;
    delete safeProject.amountPaidByClient;
    delete safeProject.amountPendingClient;
  }
  return NextResponse.json({ project: safeProject, media: media.map(mediaPayload) });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const project = await Project.findById(id).populate('client', 'name').populate('vendor', 'vendorCode email firstName lastName businessName');
  if (!project) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  try {
    const needsFolderCreation = !project.drive?.projectFolderId;
    const drive = needsFolderCreation
      ? await ensureProjectDriveFolders(project, project.vendor?.email || '')
      : project.drive.toObject?.() || project.drive;
    project.drive = {
      ...project.drive?.toObject?.(),
      ...drive,
      status: 'ready',
      createdAt: project.drive?.createdAt || new Date(),
      error: '',
    };

    const files = await listDriveTree(drive.projectFolderId);
    await ProjectMedia.updateMany({ project: id }, { $set: { isAvailable: false } });

    for (const file of files) {
      const parts = (file.folderPath || '').split('/').filter(Boolean);
      const album = parts.length > 1 ? parts[parts.length - 1] : (parts[0] || 'Unsorted');
      await ProjectMedia.findOneAndUpdate(
        { project: id, driveFileId: file.id },
        {
          $set: {
            name: file.name,
            mimeType: file.mimeType || '',
            size: Number(file.size || 0),
            modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
            webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
            thumbnailLink: file.thumbnailLink || '',
            parentFolderId: file.parents?.[0] || '',
            folderPath: file.folderPath || '',
            album,
            isAvailable: true,
          },
          $setOnInsert: { clientVisible: false, downloadCount: 0 },
        },
        { upsert: true, new: true }
      );
    }

    project.drive.lastSyncedAt = new Date();
    await project.save();
    if (needsFolderCreation && project.vendor?.email) {
      await sendVendorDriveLinksEmail({
        to: project.vendor.email,
        vendorName: `${project.vendor.firstName || ''} ${project.vendor.lastName || ''}`.trim() || 'Vendor',
        projectCode: project.projectCode,
        eventType: project.eventType,
        eventDate: project.eventDate,
        rawUrl: project.drive.rawFolderUrl,
        editedUrl: project.drive.editedFolderUrl,
      });
    }
    const media = await ProjectMedia.find({ project: id, isAvailable: { $ne: false } }).sort({ album: 1, name: 1 });
    return NextResponse.json({ success: true, project, media: media.map(mediaPayload), synced: files.length });
  } catch (err) {
    console.error('Drive sync error:', err);
    project.drive = { ...project.drive?.toObject?.(), status: 'error', error: err.message };
    await project.save().catch(() => {});
    return NextResponse.json({ error: err.message || 'Unable to sync Google Drive.' }, { status: 500 });
  }
}
