import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Project from '@/models/Project';
import { getSession } from '@/lib/auth';
import { ensureProjectDriveFolders, ensureVendorDriveAccess } from '@/lib/googleDrive';
import { sendVendorDriveLinksEmail } from '@/lib/mailer';

// GET single project.
// - admin: full detail, everything.
// - vendor: only their assigned project, client identity withheld. Notes are filtered
//   down to the project-specific chat thread with the admin (visibleToVendor: true) —
//   the vendor never sees client-facing notes or internal money-edit audit entries.
// - client: only their own project, vendor's personal contact withheld, notes filtered
//   to the project-specific thread visible to them (visibleToClient: true).
export async function GET(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const project = await Project.findById(id)
    .populate('client', 'name clientCode phone email eventPlace')
    .populate('vendor', 'firstName lastName vendorCode businessName');
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role === 'vendor') {
    if (project.vendor?._id?.toString() !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const safe = project.toObject();
    if (safe.drive?.projectFolderId) {
      try {
        const vendor = await Project.findById(project._id).populate('vendor', 'email');
        if (vendor?.vendor?.email) await ensureVendorDriveAccess(safe.drive.projectFolderId, vendor.vendor.email);
      } catch (driveError) {
        console.warn('Vendor Drive access refresh warning:', driveError.message);
      }
    }
    safe.client = { clientCode: safe.client?.clientCode || '' }; // vendors must never see client identity
    safe.notes = (safe.notes || []).filter((n) => n.visibleToVendor); // just this project's chat with admin
    delete safe.vendorUpdate;
    delete safe.vendorUpdateAt;
    return NextResponse.json({ project: safe });
  }

  if (session.role === 'client') {
    if (project.client?._id?.toString() !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const safe = project.toObject();
    safe.vendor = safe.vendor ? { businessName: safe.vendor.businessName, vendorCode: safe.vendor.vendorCode } : null; // withhold vendor's personal contact
    safe.notes = (safe.notes || []).filter((n) => n.visibleToClient);
    delete safe.vendorUpdate;
    delete safe.vendorUpdateAt;
    delete safe.amountPaidToVendor;
    delete safe.amountPendingVendor;
    return NextResponse.json({ project: safe });
  }

  if (session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ project });
}

// PATCH — update status / amounts (admin) or shoot status + project chat (vendor / client)
export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const project = await Project.findById(id);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();

  if (session.role === 'vendor') {
    // vendors may only progress their own project's shoot status and chat about it
    if (project.vendor?.toString() !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    let didSomething = false;

    if (['shoot_scheduled', 'shoot_completed'].includes(body.status)) {
      project.status = body.status;
      project.notes.push({
        text: `Vendor marked project as "${body.status.replace('_', ' ')}"`,
        author: session.name,
        visibleToVendor: true,
      });
      didSomething = true;

      // The shoot-completed step is the hand-off point for the private delivery workspace.
      // If Drive is connected, create the event folder + RAW/EDITED upload links now and
      // send those links to the vendor. If it is not connected yet, the admin can create
      // the workspace later from the project media screen without losing the status update.
      if (body.status === 'shoot_completed' && !project.drive?.projectFolderId) {
        try {
          const populated = await Project.findById(project._id)
            .populate('client', 'name')
            .populate('vendor', 'vendorCode email firstName lastName businessName');
          const drive = await ensureProjectDriveFolders(populated, populated.vendor?.email || '');
          project.drive = {
            ...project.drive?.toObject?.(),
            ...drive,
            status: 'ready',
            createdAt: new Date(),
            error: '',
          };
          project.drive.lastSyncedAt = null;
          await sendVendorDriveLinksEmail({
            to: populated.vendor?.email,
            vendorName: populated.vendor ? `${populated.vendor.firstName} ${populated.vendor.lastName}` : 'Vendor',
            projectCode: populated.projectCode,
            eventType: populated.eventType,
            eventDate: populated.eventDate,
            rawUrl: drive.rawFolderUrl,
            editedUrl: drive.editedFolderUrl,
          });
          project.notes.push({
            text: 'Private Drive workspace created with RAW and EDITED upload links.',
            author: 'System',
            visibleToVendor: true,
          });
        } catch (driveError) {
          project.drive = { ...project.drive?.toObject?.(), status: 'error', error: driveError.message };
          project.notes.push({
            text: `Drive workspace could not be created automatically: ${driveError.message}`,
            author: 'System',
            visibleToVendor: false,
          });
        }
      }
    }

    // A message in this project's chat thread with the admin — scoped entirely to this
    // project, never shown on any other project or on the vendor's dashboard generally.
    if (typeof body.note === 'string' && body.note.trim()) {
      project.notes.push({ text: body.note.trim(), author: session.name || 'Vendor', visibleToVendor: true });
      didSomething = true;
    }

    if (!didSomething) return NextResponse.json({ error: 'Invalid update for vendor.' }, { status: 400 });

    await project.save();
    return NextResponse.json({ success: true, project });
  }

  if (session.role === 'client') {
    // clients may only leave a note for the admin on their own project — nothing else.
    if (project.client?.toString() !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (!body.note || !body.note.trim()) {
      return NextResponse.json({ error: 'A note is required.' }, { status: 400 });
    }
    project.notes.push({ text: body.note.trim(), author: session.name || 'Client', visibleToClient: true });
    await project.save();
    return NextResponse.json({ success: true, project });
  }

  if (session.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // admin — full edit rights, with an audit note per money/status edit
  const editableFields = ['status', 'eventType', 'eventDate', 'location'];
  editableFields.forEach((f) => { if (body[f] !== undefined) project[f] = body[f]; });

  const clientMoneyFields = ['amountTotal', 'amountPaidByClient', 'amountPendingClient'];
  const vendorMoneyFields = ['amountPaidToVendor', 'amountPendingVendor'];
  const moneyFields = [...clientMoneyFields, ...vendorMoneyFields];

  moneyFields.forEach((f) => {
    if (body[f] !== undefined && Number(body[f]) !== project[f]) {
      project.notes.push({
        text: body.note || `Updated ${f}`,
        author: session.name || 'Admin',
        field: f,
        oldValue: String(project[f]),
        newValue: String(body[f]),
        // Charge changes on the client-facing amounts are surfaced on the client's own
        // dashboard by default; vendor-facing amounts never are. Admin can override via
        // body.visibleToClient if they explicitly want different behaviour.
        visibleToClient: body.visibleToClient !== undefined ? !!body.visibleToClient : clientMoneyFields.includes(f),
      });
      project[f] = Number(body[f]);
    }
  });

  // Admin messaging into the project-specific chat threads. `chatTarget` picks which
  // thread this message belongs to: 'vendor' (chat with the vendor on this project) or
  // 'client' (note visible to the client on this project). Plain internal notes (no
  // chatTarget) stay admin-only, in the full activity log.
  if (body.note && !moneyFields.some((f) => body[f] !== undefined) && body.note.trim()) {
    project.notes.push({
      text: body.note.trim(),
      author: session.name || 'Admin',
      visibleToClient: body.chatTarget === 'client',
      visibleToVendor: body.chatTarget === 'vendor',
    });
  }

  await project.save();
  return NextResponse.json({ success: true, project });
}
