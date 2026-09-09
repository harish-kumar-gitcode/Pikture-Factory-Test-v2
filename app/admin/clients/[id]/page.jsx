'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import NotesTimeline from '@/components/ui/NotesTimeline';
import SearchPicker from '@/components/ui/SearchPicker';
import { useToast } from '@/components/ui/Toast';

const STATUS_FLOW = [
  'lead', 'booked', 'vendor_assigned', 'shoot_scheduled', 'shoot_completed',
  'editing', 'preview', 'approved', 'delivered', 'closed',
];

export default function ClientDetailPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);

  function load() {
    fetch(`/api/clients/${id}`).then((r) => r.json()).then((d) => { setClient(d.client); setProjects(d.projects || []); });
  }
  useEffect(load, [id]);

  useEffect(() => {
    fetch('/api/tickets').then((r) => r.json()).then((d) => setTickets((d.tickets || []).filter((t) => t.client?._id === id)));
  }, [id]);

  async function searchVendors(query) {
    const qs = new URLSearchParams({ status: 'approved', search: query });
    const res = await fetch(`/api/vendors?${qs}`);
    const data = await res.json();
    return data.vendors || [];
  }

  async function updateStatus(projectStatus) {
    await fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectStatus }) });
    showToast('Project status updated.', 'success');
    load();
  }

  async function reassignVendor(vendorId) {
    await fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vendorId: vendorId || null }) });
    showToast('Vendor updated.', 'success');
    load();
  }

  async function addNote(text) {
    await fetch(`/api/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: text }) });
    load();
  }

  if (!client) return <div className="text-secondary">Loading...</div>;
  const t = statusToneMap(client.projectStatus);

  return (
    <>
      <NextLink href="/admin/clients" className="text-sm text-secondary flex items-center gap-1.5 mb-3"><ArrowLeft size={14} /> Back to Clients</NextLink>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">{client.name}</h1>
          <span className="text-sm text-secondary">{client.clientCode} · {client.email} · {client.phone}</span>
        </div>
        <StatusPill tone={t.tone}>{t.label}</StatusPill>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="grid gap-6">
          <div className="panel">
            <h3 className="text-lg font-head mb-4">Project Status</h3>
            <select className="input" value={client.projectStatus} onChange={(e) => updateStatus(e.target.value)}>
              {STATUS_FLOW.map((s) => <option key={s} value={s}>{statusToneMap(s).label}</option>)}
            </select>
          </div>

          <div className="panel">
            <h3 className="text-lg font-head mb-4">Assigned Vendor</h3>
            <SearchPicker
              key={client.vendor?._id || 'none'}
              selected={client.vendor ? { _id: client.vendor._id, firstName: client.vendor.firstName, lastName: client.vendor.lastName, vendorCode: client.vendor.vendorCode, businessName: client.vendor.businessName } : null}
              onSelect={(v) => reassignVendor(v ? v._id : null)}
              fetchResults={searchVendors}
              placeholder="Search by vendor code, business name, or phone..."
              renderLabel={(v) => `${v.firstName} ${v.lastName} · ${v.vendorCode}`}
              renderSub={(v) => `${v.businessName}${v.phone ? ' · ' + v.phone : ''}`}
            />
            <p className="text-xs text-secondary mt-2">Search by vendor code, business name, or phone — clear the selection to unassign.</p>
          </div>

          <div className="panel">
            <h3 className="text-lg font-head mb-4">Support Tickets</h3>
            {tickets.length === 0 && <p className="text-sm text-secondary">No tickets raised.</p>}
            <div className="grid gap-3">
              {tickets.map((tk) => {
                const tt = statusToneMap(tk.status);
                return (
                  <div key={tk._id} className="bg-bglight rounded-xl p-4 flex items-center justify-between">
                    <div><b className="text-sm block">{tk.subject}</b><span className="text-xs text-secondary">{tk.message}</span></div>
                    <StatusPill tone={tt.tone}>{tt.label}</StatusPill>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h3 className="text-lg font-head mb-1">Projects</h3>
            <p className="text-xs text-secondary mb-5">Open a project to view or edit its charges, files, and notes — scoped to that project only.</p>
            <div className="grid gap-3">
              {projects.map((p) => {
                const pt = statusToneMap(p.status);
                return (
                  <NextLink key={p._id} href={`/admin/projects/${p._id}`} className="flex items-center justify-between border border-border rounded-xl p-4 hover:border-gold transition-colors">
                    <div>
                      <b className="block text-sm">{p.projectCode} — {p.eventType}</b>
                      <span className="text-xs text-secondary">{p.eventDate ? new Date(p.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · ₹{p.amountTotal?.toLocaleString('en-IN')} total</span>
                      {p.vendor && <span className="text-xs text-secondary block">Vendor: {p.vendor.firstName} {p.vendor.lastName} ({p.vendor.vendorCode})</span>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusPill tone={pt.tone}>{pt.label}</StatusPill>
                      <ChevronRight size={16} className="text-secondary" />
                    </div>
                  </NextLink>
                );
              })}
              {!projects.length && <p className="text-sm text-secondary">No projects yet.</p>}
            </div>
          </div>
        </div>

        <div className="panel h-fit">
          <h3 className="text-lg font-head mb-5">Notes</h3>
          <NotesTimeline notes={client.notes} onAdd={addNote} placeholder="Add a note about this client, vendor, or ticket..." />
        </div>
      </div>
    </>
  );
}
