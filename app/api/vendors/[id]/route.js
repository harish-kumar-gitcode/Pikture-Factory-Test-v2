import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import Project from '@/models/Project';
import GalleryItem from '@/models/GalleryItem';
import { getSession } from '@/lib/auth';
import { generateVendorCode, generateTempPassword } from '@/lib/codes';
import { sendVendorApprovalEmail, sendVendorRejectionEmail } from '@/lib/mailer';

async function requireAdmin() {
  const session = await getSession();
  return session && session.role === 'admin' ? session : null;
}

// GET vendor detail + assigned projects (events, status, amounts)
export async function GET(req, { params }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const vendor = await Vendor.findById(id);
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const projects = await Project.find({ vendor: vendor._id }).populate('client', 'name clientCode phone').sort({ createdAt: -1 });
  return NextResponse.json({ vendor, projects });
}

// PATCH — approve / reject / edit vendor fields (logs a note per edit) / add note
export async function PATCH(req, { params }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const vendor = await Vendor.findById(id);
  if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // ---- approve ----
  if (body.action === 'approve') {
    // Atomic guard: only one concurrent request can flip a non-approved vendor to
    // approved. If the vendor is already approved (e.g. a double-click or a slow
    // network causing a resend), every extra request lands here and is a no-op —
    // it will never re-hash a password, re-create gallery items, or re-send email.
    if (vendor.status === 'approved') {
      return NextResponse.json({ success: true, vendor, alreadyProcessed: true });
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const vendorCode = vendor.vendorCode || generateVendorCode();

    const updated = await Vendor.findOneAndUpdate(
      { _id: id, status: { $ne: 'approved' } },
      {
        $set: { password: hashedPassword, status: 'approved', vendorCode },
        $push: { notes: { text: 'Vendor application approved and onboarded.', author: session.name || 'Admin' } },
      },
      { new: true }
    );

    if (!updated) {
      // Another concurrent request won the race and already approved this vendor.
      const current = await Vendor.findById(id);
      return NextResponse.json({ success: true, vendor: current, alreadyProcessed: true });
    }

    // The samples submitted at application time only ever lived on the vendor's own
    // record — turn them into real GalleryItem entries now so they enter the same
    // approval queue / public gallery pipeline as everything else the vendor uploads.
    if (updated.portfolioSamples?.length) {
      const existing = await GalleryItem.find({ vendor: updated._id, publicId: { $in: updated.portfolioSamples.map((s) => s.publicId) } }).select('publicId');
      const already = new Set(existing.map((e) => e.publicId));
      const toCreate = updated.portfolioSamples
        .filter((s) => s.publicId && !already.has(s.publicId))
        .map((s) => ({
          url: s.url,
          publicId: s.publicId,
          type: s.type || 'image',
          vendor: updated._id,
          vendorCode: updated.vendorCode,
          project: null,
          status: 'pending',
        }));
      if (toCreate.length) await GalleryItem.insertMany(toCreate);
    }

    await sendVendorApprovalEmail({ to: updated.email, name: updated.firstName, username: updated.email, password: tempPassword });
    return NextResponse.json({ success: true, vendor: updated });
  }

  // ---- reject / waitlist ----
  if (body.action === 'reject') {
    if (vendor.status === 'rejected') {
      return NextResponse.json({ success: true, vendor, alreadyProcessed: true });
    }

    const updated = await Vendor.findOneAndUpdate(
      { _id: id, status: { $ne: 'rejected' } },
      {
        $set: { status: 'rejected' },
        $push: { notes: { text: body.reason || 'Application moved to waitlist.', author: session.name || 'Admin' } },
      },
      { new: true }
    );

    if (!updated) {
      const current = await Vendor.findById(id);
      return NextResponse.json({ success: true, vendor: current, alreadyProcessed: true });
    }

    await sendVendorRejectionEmail({ to: updated.email, name: updated.firstName });
    return NextResponse.json({ success: true, vendor: updated });
  }

  // ---- generic field edit with audit note ----
  const editableFields = [
    'firstName', 'lastName', 'businessName', 'location', 'yearsOfExperience',
    'phone', 'servicesProvided',
  ];
  editableFields.forEach((f) => {
    if (body[f] !== undefined) vendor[f] = body[f];
  });

  if (body.field && body.newValue !== undefined) {
    vendor.notes.push({
      text: body.note || `Updated ${body.field}`,
      author: session.name || 'Admin',
      field: body.field,
      oldValue: String(body.oldValue ?? ''),
      newValue: String(body.newValue ?? ''),
    });
  } else if (body.note && body.note.trim()) {
    vendor.notes.push({ text: body.note.trim(), author: session.name || 'Admin' });
  }

  await vendor.save();
  return NextResponse.json({ success: true, vendor });
}
