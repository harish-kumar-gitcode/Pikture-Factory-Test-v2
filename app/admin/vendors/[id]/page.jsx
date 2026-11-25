'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, ChevronRight, KeyRound, MailCheck } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import GalleryItemCard from '@/components/admin/GalleryItemCard';
import NotesTimeline from '@/components/ui/NotesTimeline';
import Modal from '@/components/ui/Modal';
import SearchPicker from '@/components/ui/SearchPicker';
import { useToast } from '@/components/ui/Toast';

export default function VendorDetailPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [vendor, setVendor] = useState(null);
  const [projects, setProjects] = useState([]);
  const [showcase, setShowcase] = useState([]); // the vendor's own portfolio submissions — NOT tied to any project

  const [assignOpen, setAssignOpen] = useState(false);
  const [pickedClient, setPickedClient] = useState(null);
  const [assignForm, setAssignForm] = useState({ eventType: 'Wedding', eventDate: '', location: '', amountTotal: '' });
  const [assigning, setAssigning] = useState(false);
  const [busy, setBusy] = useState(null); // { id, action }
  const [resettingPassword, setResettingPassword] = useState(false);

  function load() {
    fetch(`/api/vendors/${id}`).then((r) => r.json()).then((d) => { setVendor(d.vendor); setProjects(d.projects || []); });
    fetch(`/api/gallery?admin=1&vendor=${id}&project=none`).then((r) => r.json()).then((d) => setShowcase(d.items || []));
  }
  useEffect(load, [id]);

  async function resetVendorPassword() {
    if (resettingPassword) return;
    const confirmed = window.confirm(`Generate a new password for ${vendor?.businessName || 'this vendor'} and email it to ${vendor?.email || 'their registered address'}? The current password will stop working immediately.`);
    if (!confirmed) return;
    setResettingPassword(true);
    try {
      const res = await fetch(`/api/admin/vendors/${id}/password-reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to reset the password.');
      showToast(data.message || 'New password emailed successfully.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to reset the password.', 'error');
    } finally {
      setResettingPassword(false);
    }
  }

  async function addVendorNote(text) {
    await fetch(`/api/vendors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: text }) });
    load();
  }

  async function searchClients(query) {
    const qs = new URLSearchParams({ search: query });
    const res = await fetch(`/api/clients?${qs}`);
    const data = await res.json();
    return data.clients || [];
  }

  async function assignProject() {
    if (!pickedClient) return showToast('Search and pick a client first.', 'error');
    setAssigning(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: pickedClient._id,
        vendorId: id,
        eventType: assignForm.eventType,
        eventDate: assignForm.eventDate || null,
        location: assignForm.location || pickedClient.eventPlace || '',
        amountTotal: assignForm.amountTotal ? Number(assignForm.amountTotal) : 0,
      }),
    });
    setAssigning(false);
    if (res.ok) {
      showToast('Project assigned to this vendor.', 'success');
      setAssignOpen(false);
      setPickedClient(null);
      setAssignForm({ eventType: 'Wedding', eventDate: '', location: '', amountTotal: '' });
      load();
    } else {
      showToast('Could not assign project.', 'error');
    }
  }

  async function toggle(item, field, action) {
    if (busy) return;
    setBusy({ id: item._id, action });
    try {
      const res = await fetch(`/api/gallery/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        showToast(item[field] ? 'Removed.' : 'Updated.', 'success');
        load();
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setBusy(null);
    }
  }

  const toggleHome = (item) => toggle(item, 'featuredHome', item.featuredHome ? 'unfeature' : 'feature');
  const toggleGallery = (item) => toggle(item, 'featuredGallery', item.featuredGallery ? 'unfeatureGallery' : 'featureGallery');

  if (!vendor) return <div className="text-secondary">Loading...</div>;

  return (
    <>
      <Link href="/admin/vendors" className="text-sm text-secondary flex items-center gap-1.5 mb-3"><ArrowLeft size={14} /> Back to Vendors</Link>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">{vendor.firstName} {vendor.lastName}</h1>
          <span className="text-sm text-secondary">{vendor.vendorCode} · {vendor.businessName} · {vendor.email} · {vendor.phone}</span>
        </div>
        <button onClick={() => setAssignOpen(true)} className="btn btn-primary btn-sm"><Plus size={14} /> Assign New Project</button>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="grid gap-6">
          <div className="panel border-gold/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-head mb-1">Vendor Portal Access</h3>
                <p className="text-xs text-secondary leading-5">Generate a fresh portal password and send it to the vendor&apos;s registered email. This action is available only to admins.</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0"><KeyRound size={18} /></div>
            </div>
            <div className="mt-4 rounded-xl bg-bglight border border-border px-3.5 py-3 flex items-center gap-2 text-xs text-secondary">
              <MailCheck size={14} className="text-gold shrink-0" />
              <span>New password will be sent to <b className="text-primary">{vendor.email}</b></span>
            </div>
            <button type="button" onClick={resetVendorPassword} disabled={resettingPassword || vendor.status !== 'approved'} className="btn btn-outline mt-4 disabled:opacity-60">
              <KeyRound size={14} /> {resettingPassword ? 'Generating & emailing…' : 'Reset Password & Email Vendor'}
            </button>
            {vendor.status !== 'approved' && <p className="text-xs text-secondary mt-2">Only approved vendors can access the vendor portal.</p>}
          </div>

          <div className="panel">
            <h3 className="text-lg font-head mb-1">Assigned Events</h3>
            <p className="text-xs text-secondary mb-5">Open a project to see its client info, charges, files, and notes — scoped to that project only.</p>
            <div className="grid gap-3">
              {projects.map((p) => {
                const t = statusToneMap(p.status);
                return (
                  <Link key={p._id} href={`/admin/projects/${p._id}`} className="flex items-center justify-between border border-border rounded-xl p-4 hover:border-gold transition-colors">
                    <div>
                      <b className="block text-sm">{p.projectCode} — {p.eventType}</b>
                      <span className="text-xs text-secondary">{p.eventDate ? new Date(p.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · {p.location}</span>
                      {p.client && <span className="text-xs text-secondary block">Client: {p.client.name} {p.client.clientCode ? `(${p.client.clientCode})` : ''}</span>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusPill tone={t.tone}>{t.label}</StatusPill>
                      <ChevronRight size={16} className="text-secondary" />
                    </div>
                  </Link>
                );
              })}
              {!projects.length && <p className="text-sm text-secondary">No events assigned yet.</p>}
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-head mb-1">Vendor's Uploaded Work</h3>
            <p className="text-xs text-secondary mb-5">Showcase pieces this vendor submitted for their own portfolio (not tied to a client project). View any piece before deciding, and once it's approved, feature it on the homepage and/or the public gallery page. Project-specific files are on each project's own page.</p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {showcase.map((item) => (
                <GalleryItemCard
                  key={item._id}
                  item={item}
                  showVendor={false}
                  showStatus
                  busyAction={busy?.id === item._id ? (busy.action.includes('Gallery') ? 'gallery' : 'home') : null}
                  onToggleHome={toggleHome}
                  onToggleGallery={toggleGallery}
                />
              ))}
              {!showcase.length && <p className="text-sm text-secondary col-span-3 text-center py-8">No portfolio submissions from this vendor yet.</p>}
            </div>
          </div>
        </div>

        <div className="panel h-fit">
          <h3 className="text-lg font-head mb-1">Notes</h3>
          <p className="text-xs text-secondary mb-4">About this vendor generally — not tied to any one project.</p>
          <NotesTimeline notes={vendor.notes} onAdd={addVendorNote} placeholder="Leave a note for this vendor..." />
        </div>
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign New Project to This Vendor" maxWidth="max-w-md">
        <div className="grid gap-4">
          <div>
            <label className="label">Client</label>
            <SearchPicker
              selected={pickedClient}
              onSelect={setPickedClient}
              fetchResults={searchClients}
              placeholder="Search client by name or phone..."
              renderLabel={(c) => `${c.name} · ${c.clientCode}`}
              renderSub={(c) => c.phone}
            />
          </div>
          <div><label className="label">Event Type</label><input className="input" value={assignForm.eventType} onChange={(e) => setAssignForm({ ...assignForm, eventType: e.target.value })} /></div>
          <div><label className="label">Event Date</label><input type="date" className="input" value={assignForm.eventDate} onChange={(e) => setAssignForm({ ...assignForm, eventDate: e.target.value })} /></div>
          <div><label className="label">Location</label><input className="input" value={assignForm.location} onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })} placeholder="Defaults to client's event place" /></div>
          <div><label className="label">Total Amount (₹)</label><input type="number" className="input" value={assignForm.amountTotal} onChange={(e) => setAssignForm({ ...assignForm, amountTotal: e.target.value })} /></div>
          <button onClick={assignProject} disabled={assigning} className="btn btn-primary">{assigning ? 'Assigning...' : 'Assign Project'}</button>
        </div>
      </Modal>
    </>
  );
}
