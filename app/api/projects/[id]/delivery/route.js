import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import Project from '@/models/Project';
import ProjectMedia from '@/models/ProjectMedia';
import {
  ensureProjectDriveFolders,
  createDriveFolder,
  copyDriveFile,
  listDriveTree,
  shareDriveFolderWithUser,
  removeDriveFolderAccess,
} from '@/lib/googleDrive';

async function getProject(id, session) {
  await connectDB();
  const project = await Project.findById(id)
    .populate('client', 'name email clientCode')
    .populate('vendor', 'email firstName lastName vendorCode businessName');
  if (!project) return { error: NextResponse.json({ error: 'Project not found.' }, { status: 404 }) };
  if (session.role === 'admin') return { project };
  if (session.role === 'client' && project.client?._id?.toString() === session.id) return { project };
  return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) };
}

function cleanName(name) {
  return String(name || 'image').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 150);
}

async function ensureDrive(project) {
  const drive = await ensureProjectDriveFolders(project, project.vendor?.email || '');
  project.drive = {
    ...project.drive?.toObject?.(),
    ...drive,
    status: 'ready',
    createdAt: project.drive?.createdAt || new Date(),
    error: '',
  };
  return project.drive;
}

async function syncEditedFiles(project) {
  const drive = project.drive?.toObject?.() || project.drive || {};
  if (!drive.projectFolderId) return 0;
  const files = await listDriveTree(drive.projectFolderId);
  let count = 0;
  for (const file of files) {
    const path = String(file.folderPath || '');
    const isEdited = path === 'EDITED' || path.startsWith('EDITED/');
    if (!isEdited) continue;
    await ProjectMedia.findOneAndUpdate(
      { project: project._id, driveFileId: file.id },
      {
        $set: {
          name: file.name,
          mimeType: file.mimeType || '',
          size: Number(file.size || 0),
          modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : null,
          webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          thumbnailLink: file.thumbnailLink || '',
          parentFolderId: file.parents?.[0] || '',
          folderPath: path,
          album: path === 'EDITED' ? 'Edited' : path.split('/').slice(-1)[0] || 'Edited',
          workflowStage: 'edited',
          clientVisible: true,
          isAvailable: true,
        },
        $setOnInsert: { downloadCount: 0 },
      },
      { upsert: true, new: true }
    );
    count += 1;
  }
  return count;
}

export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || !['admin', 'client'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const auth = await getProject(id, session);
  if (auth.error) return auth.error;
  const { project } = auth;
  if (!project.drive) project.drive = {};

  if (session.role === 'client') {
    const stage = project.drive.deliveryStage || 'raw_selection';
    return NextResponse.json({
      stage,
      rawAccess: !!project.drive.clientRawAccess && stage === 'raw_selection',
      editedAccess: !!project.drive.clientEditedAccess && stage === 'edited_delivery',
      selectionRound: project.drive.selectionRound || 0,
      selectedDriveFileIds: project.drive.selectedDriveFileIds || [],
    });
  }

  return NextResponse.json({
    stage: project.drive.deliveryStage || 'raw_selection',
    rawAccess: !!project.drive.clientRawAccess,
    editedAccess: !!project.drive.clientEditedAccess,
    selectionRound: project.drive.selectionRound || 0,
    selectedCount: (project.drive.selectedDriveFileIds || []).length,
    selectedFolders: project.drive.selectedFolders || [],
    clientEmail: project.client?.email || '',
    drive: project.drive || {},
  });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');

  const auth = await getProject(id, session);
  if (auth.error) return auth.error;
  const { project } = auth;
  if (!project.drive) project.drive = {};

  try {
    // Client submits the current raw-photo selection.
    if (action === 'submit-selection') {
      if (session.role !== 'client') return NextResponse.json({ error: 'Only the client can submit a selection.' }, { status: 403 });
      if (project.drive.deliveryStage !== 'raw_selection' || !project.drive.clientRawAccess) {
        return NextResponse.json({ error: 'Raw-photo selection is not currently open.' }, { status: 409 });
      }

      const ids = Array.isArray(body.mediaIds) ? [...new Set(body.mediaIds.map(String))] : [];
      if (!ids.length) return NextResponse.json({ error: 'Select at least one photo before submitting.' }, { status: 400 });

      const raw = await ProjectMedia.find({
        _id: { $in: ids },
        project: project._id,
        isAvailable: { $ne: false },
        workflowStage: 'raw',
      });
      if (raw.length !== ids.length) return NextResponse.json({ error: 'One or more selected photos are no longer available.' }, { status: 400 });

      const alreadySelected = new Set(project.drive.selectedDriveFileIds || []);
      const duplicates = raw.filter((m) => alreadySelected.has(m.driveFileId));
      if (duplicates.length) {
        return NextResponse.json({ error: 'One or more selected photos were already submitted in an earlier round. Please select different photos.' }, { status: 409 });
      }

      const drive = await ensureDrive(project);
      const nextRound = (project.drive.selectionRound || 0) + 1;
      const folder = await createDriveFolder(`SELECTED_FOR_EDITING_${String(nextRound).padStart(2, '0')}`, drive.projectFolderId);

      const copied = [];
      for (const item of raw) {
        const copy = await copyDriveFile(item.driveFileId, cleanName(item.name), folder.id);
        copied.push(copy);
        await ProjectMedia.findOneAndUpdate(
          { project: project._id, driveFileId: copy.id },
          {
            $set: {
              name: copy.name || item.name,
              mimeType: copy.mimeType || item.mimeType,
              size: Number(copy.size || item.size || 0),
              modifiedTime: copy.modifiedTime ? new Date(copy.modifiedTime) : new Date(),
              webViewLink: copy.webViewLink || '',
              thumbnailLink: copy.thumbnailLink || '',
              parentFolderId: folder.id,
              folderPath: `SELECTED_FOR_EDITING_${String(nextRound).padStart(2, '0')}`,
              album: `Selected Round ${nextRound}`,
              workflowStage: 'selected',
              selectionRound: nextRound,
              sourceDriveFileId: item.driveFileId,
              clientVisible: false,
              isAvailable: true,
            },
            $setOnInsert: { downloadCount: 0 },
          },
          { upsert: true, new: true }
        );
      }

      project.drive.selectionRound = nextRound;
      project.drive.selectedDriveFileIds = [...new Set([...(project.drive.selectedDriveFileIds || []), ...raw.map((m) => m.driveFileId)])];
      project.drive.selectedFolders = [
        ...(project.drive.selectedFolders || []),
        { folderId: folder.id, folderName: folder.name, round: nextRound, createdAt: new Date() },
      ];
      project.drive.deliveryStage = 'editing';
      project.drive.clientRawAccess = false;
      project.drive.clientEditedAccess = false;

      // The app access is revoked immediately; Drive permission is also removed.
      await removeDriveFolderAccess(drive.rawFolderId, project.client.email);
      await project.save();

      return NextResponse.json({
        success: true,
        stage: project.drive.deliveryStage,
        selectionRound: nextRound,
        selectedCount: raw.length,
        folder: { id: folder.id, name: folder.name, url: `https://drive.google.com/drive/folders/${folder.id}` },
      });
    }

    // Admin opens RAW access for the first time or for another selection round.
    if (action === 'grant-raw-access') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      const drive = await ensureDrive(project);
      await shareDriveFolderWithUser(drive.rawFolderId, project.client.email, 'reader');
      await removeDriveFolderAccess(drive.editedFolderId, project.client.email);
      project.drive.clientRawAccess = true;
      project.drive.clientEditedAccess = false;
      project.drive.deliveryStage = 'raw_selection';
      await project.save();
      return NextResponse.json({ success: true, stage: project.drive.deliveryStage, rawAccess: true });
    }

    // Admin closes RAW access after a manual/extra selection window.
    if (action === 'revoke-raw-access') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      const drive = await ensureDrive(project);
      await removeDriveFolderAccess(drive.rawFolderId, project.client.email);
      project.drive.clientRawAccess = false;
      if (project.drive.deliveryStage === 'raw_selection') project.drive.deliveryStage = 'editing';
      await project.save();
      return NextResponse.json({ success: true, stage: project.drive.deliveryStage, rawAccess: false });
    }

    // Admin grants final EDITED access. Existing files in EDITED are synced and made
    // visible in the client portal at the same time.
    if (action === 'grant-edited-access') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      if ((project.drive.selectionRound || 0) < 1) return NextResponse.json({ error: 'The client has not submitted a RAW selection yet.' }, { status: 409 });
      const drive = await ensureDrive(project);
      const editedCount = await syncEditedFiles(project);
      if (!editedCount) return NextResponse.json({ error: 'No edited files were found in the EDITED folder yet. Upload the finished images and sync again.' }, { status: 409 });
      await shareDriveFolderWithUser(drive.editedFolderId, project.client.email, 'reader');
      await removeDriveFolderAccess(drive.rawFolderId, project.client.email);
      project.drive.clientRawAccess = false;
      project.drive.clientEditedAccess = true;
      project.drive.deliveryStage = 'edited_delivery';
      await project.save();
      return NextResponse.json({ success: true, stage: project.drive.deliveryStage, editedAccess: true, editedCount });
    }

    // Admin can close final access without deleting anything from Drive.
    if (action === 'revoke-edited-access') {
      if (session.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      const drive = await ensureDrive(project);
      await removeDriveFolderAccess(drive.editedFolderId, project.client.email);
      project.drive.clientEditedAccess = false;
      await project.save();
      return NextResponse.json({ success: true, editedAccess: false });
    }

    return NextResponse.json({ error: 'Unknown delivery action.' }, { status: 400 });
  } catch (error) {
    console.error('Delivery workflow error:', error);
    return NextResponse.json({ error: error.message || 'Unable to update delivery workflow.' }, { status: 500 });
  }
}
