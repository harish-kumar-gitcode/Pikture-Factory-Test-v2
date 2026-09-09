'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Star, ExternalLink, CheckCircle2, XCircle, Loader2, MessageCircle, StickyNote, ListChecks, Images, Cloud } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import NotesTimeline from '@/components/ui/NotesTimeline';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

const STATUS_FLOW = [
  'requested', 'vendor_assigned', 'shoot_scheduled', 'shoot_completed',
  'editing', 'preview', 'client_approved', 'delivered', 'closed',
];

export default function AdminProjectDetailPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [editField, setEditField] = useState(null); // { field, label, currentValue, visibleToClient }
  const [editValue, setEditValue] = useState('');
  const [editNote, setEditNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [processingItemId, setProcessingItemId] = useState(null);

  function load() {
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => setProject(d.project));
    fetch(`/api/gallery?admin=1&project=${id}`).then((r) => r.json()).then((d) => setGallery(d.items || []));
  }
  useEffect(load, [id]);

  function openEdit(field, label, currentValue, visibleToClient) {
    setEditField({ field, label, visibleToClient });
    setEditValue(currentValue);
    setEditNote('');
  }

  async function saveEdit() {
    if (savingEdit) return;
    setSavingEdit(true);
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editField.field]: Number(editValue), note: editNote || `Updated ${editField.label}`, visibleToClient: editField.visibleToClient }),
      });
      showToast(editField.visibleToClient ? 'Updated — the client will see this on their dashboard.' : 'Updated.', 'success');
      setEditField(null);
      load();
    } finally {
      setSavingEdit(false);
    }
  }

  async function updateStatus(status) {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      showToast('Project status updated.', 'success');
      load();
    } finally {
      setStatusBusy(false);
    }
  }

  async function addVendorChat(text) {
    await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: text, chatTarget: 'vendor' }) });
    load();
  }

  async function addClientNote(text) {
    await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: text, chatTarget: 'client' }) });
    load();
  }

  async function toggleFeatured(item) {
    if (processingItemId) return;
    setProcessingItemId(item._id);
    try {
      await fetch(`/api/gallery/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: item.featuredHome ? 'unfeature' : 'feature' }),
      });
      load();
    } finally {
      setProcessingItemId(null);
    }
  }

  async function decide(item, action) {
    if (processingItemId) return;
    setProcessingItemId(item._id);
    try {
      await fetch(`/api/gallery/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, category: item.category || 'Uncategorised' }),
      });
      load();
    } finally {
      setProcessingItemId(null);
    }
  }

  if (!project) return <div className="text-secondary">Loading...</div>;
  const t = statusToneMap(project.status);
  const vendorChat = (project.notes || []).filter((n) => n.visibleToVendor);
  const clientNotes = (project.notes || []).filter((n) => n.visibleToClient);

  return (
    <>
      <Link href={project.vendor ? `/admin/vendors/${project.vendor._id}` : `/admin/clients/${project.client._id}`} className="text-sm text-secondary flex items-center gap-1.5 mb-3">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">{project.projectCode} — {project.eventType}</h1>
          <span className="text-sm text-secondary">{project.eventDate ? new Date(project.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · {project.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/admin-gallery/${project._id}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Images size={13} /> Media Gallery</a>
          {project.drive?.projectFolderUrl && <a href={project.drive.projectFolderUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Cloud size={13} /> Workspace</a>}
          <select disabled={statusBusy} className="bg-white border border-border rounded-full px-4 py-2 text-sm disabled:opacity-60" value={project.status} onChange={(e) => updateStatus(e.target.value)}>
          {STATUS_FLOW.map((s) => <option key={s} value={s}>{statusToneMap(s).label}</option>)}
          </select>
        </div>
      </div>

      {project.drive?.status === 'ready' && (
        <div className="panel mb-6 bg-primary text-white border-primary"><div className="flex items-center justify-between gap-4 flex-wrap"><div><span className="text-[10px] uppercase tracking-[.18em] text-gold font-semibold">Private delivery workspace</span><h3 className="font-head text-xl mt-1">{project.drive.folderName}</h3><p className="text-xs text-white/55 mt-1">RAW and EDITED upload folders are ready for the vendor.</p></div><div className="flex gap-2"><a href={project.drive.rawFolderUrl} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">RAW Folder</a><a href={project.drive.editedFolderUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm !border-white/25 !text-white hover:!bg-white hover:!text-primary">EDITED Folder</a></div></div></div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-4">Client</h3>
          <div className="grid gap-2.5 text-sm">
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Name</span><b className="text-right">{project.client?.name || '—'}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Phone</span><b className="text-right">{project.client?.phone || '—'}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Email</span><b className="text-right truncate ml-2">{project.client?.email || '—'}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Client Code</span><b className="text-right">{project.client?.clientCode || '—'}</b></div>
          </div>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-4">Vendor</h3>
          {project.vendor ? (
            <div className="grid gap-2.5 text-sm">
              <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Name</span><b className="text-right">{project.vendor.firstName} {project.vendor.lastName}</b></div>
              <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Business</span><b className="text-right truncate ml-2">{project.vendor.businessName}</b></div>
              <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Vendor Code</span><b className="text-right">{project.vendor.vendorCode}</b></div>
            </div>
          ) : <p className="text-sm text-secondary">No vendor assigned yet.</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-1">Client Charges</h3>
          <p className="text-xs text-secondary mb-4">Edits here are logged with a note the client can see on their dashboard.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              ['amountTotal', 'Total', project.amountTotal],
              ['amountPaidByClient', 'Paid', project.amountPaidByClient],
              ['amountPendingClient', 'Pending', project.amountPendingClient],
            ].map(([field, label, value]) => (
              <div key={field} className="bg-bglight rounded-lg p-3 flex items-center justify-between">
                <div className="min-w-0"><span className="text-xs text-secondary block">{label}</span><b className="truncate block">₹{value?.toLocaleString('en-IN')}</b></div>
                <button onClick={() => openEdit(field, `${label} (Client)`, value, true)} className="text-gold shrink-0 ml-2"><Pencil size={13} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-1">Vendor Payout</h3>
          <p className="text-xs text-secondary mb-4">Never shown to the client — the vendor doesn't see client billing either.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              ['amountPaidToVendor', 'Paid', project.amountPaidToVendor],
              ['amountPendingVendor', 'Pending', project.amountPendingVendor],
            ].map(([field, label, value]) => (
              <div key={field} className="bg-bglight rounded-lg p-3 flex items-center justify-between">
                <div className="min-w-0"><span className="text-xs text-secondary block">{label}</span><b className="truncate block">₹{value?.toLocaleString('en-IN')}</b></div>
                <button onClick={() => openEdit(field, `${label} (Vendor)`, value, false)} className="text-gold shrink-0 ml-2"><Pencil size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel mb-6">
        <h3 className="text-lg font-head mb-1">Files for This Project</h3>
        <p className="text-xs text-secondary mb-5">Only media submitted specifically for {project.projectCode} — not the vendor's general portfolio.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gallery.map((item) => {
            const busy = processingItemId === item._id;
            return (
              <div key={item._id} className="border border-border rounded-xl overflow-hidden bg-white">
                <div className="aspect-[4/3] bg-bglight relative">
                  {item.type === 'video'
                    ? <video src={item.url} className="w-full h-full object-cover" controls />
                    : <img src={item.url} alt="" className="w-full h-full object-cover" />}
                  {item.deletedByVendor && (
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-danger text-white px-2 py-1 rounded-full">Deleted by vendor</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <StatusPill tone={statusToneMap(item.status).tone}>{statusToneMap(item.status).label}</StatusPill>
                    {item.featuredHome && <span className="text-[10px] font-bold text-gold flex items-center gap-1"><Star size={11} fill="currentColor" /> On Homepage</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm !text-xs col-span-2"><ExternalLink size={12} /> View in New Tab</a>
                    {item.status === 'pending' && (
                      <>
                        <button onClick={() => decide(item, 'approve')} disabled={busy} className="btn btn-sm !text-xs disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: '#dcfce7', color: '#22C55E' }}>
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Approve
                        </button>
                        <button onClick={() => decide(item, 'reject')} disabled={busy} className="btn btn-sm !text-xs disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: '#fee2e2', color: '#EF4444' }}>
                          {busy ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Reject
                        </button>
                      </>
                    )}
                    {item.status === 'approved' && !item.deletedByVendor && (
                      <button onClick={() => toggleFeatured(item)} disabled={busy} className="btn btn-sm !text-xs col-span-2 disabled:opacity-60 disabled:cursor-not-allowed" style={item.featuredHome ? { background: '#fee2e2', color: '#EF4444' } : { background: '#FEF3C7', color: '#B45309' }}>
                        {busy ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />} {item.featuredHome ? 'Unfeature' : 'Feature'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!gallery.length && <p className="text-sm text-secondary col-span-full text-center py-8">No files submitted for this project yet.</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-1 flex items-center gap-2"><MessageCircle size={16} className="text-gold" /> Vendor Chat</h3>
          <p className="text-xs text-secondary mb-4">Just between you and the vendor, about this project only.</p>
          <NotesTimeline notes={vendorChat} onAdd={addVendorChat} placeholder="Message the vendor about this project..." emptyLabel="No messages yet." />
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-1 flex items-center gap-2"><StickyNote size={16} className="text-gold" /> Client Notes</h3>
          <p className="text-xs text-secondary mb-4">Visible on the client's own dashboard for this project.</p>
          <NotesTimeline notes={clientNotes} onAdd={addClientNote} placeholder="Message the client about this project..." emptyLabel="No notes yet." />
        </div>
      </div>

      <div className="panel">
        <h3 className="text-lg font-head mb-1 flex items-center gap-2"><ListChecks size={16} className="text-gold" /> Internal Activity Log</h3>
        <p className="text-xs text-secondary mb-4">Everything that's happened on this project — charge edits, status changes, and both chat threads, for your reference only.</p>
        <NotesTimeline notes={project.notes} readOnly emptyLabel="No activity yet." />
      </div>

      <Modal open={!!editField} onClose={() => setEditField(null)} title={editField?.label} maxWidth="max-w-sm">
        <div className="grid gap-4">
          <div><label className="label">New Amount (₹)</label><input type="number" className="input" value={editValue} onChange={(e) => setEditValue(e.target.value)} /></div>
          <div>
            <label className="label">Note {editField?.visibleToClient ? '(the client will see this)' : '(internal only)'}</label>
            <textarea className="input" rows={3} value={editNote} onChange={(e) => setEditNote(e.target.value)} placeholder="Why is this changing?" />
          </div>
          <button onClick={saveEdit} disabled={savingEdit} className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed">{savingEdit ? 'Saving...' : 'Save Change'}</button>
        </div>
      </Modal>
    </>
  );
}
