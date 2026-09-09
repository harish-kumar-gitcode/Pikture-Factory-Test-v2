'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AdminTopbar from '@/components/admin/Topbar';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import SearchFilter from '@/components/ui/SearchFilter';
import SearchPicker from '@/components/ui/SearchPicker';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  'lead', 'booked', 'vendor_assigned', 'shoot_scheduled', 'shoot_completed',
  'editing', 'preview', 'approved', 'delivered', 'closed',
].map((v) => ({ value: v, label: statusToneMap(v).label }));

function ClientsPageInner() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', eventDate: '', eventPlace: '', vendorId: '', pricing: '' });
  const [pickedVendor, setPickedVendor] = useState(null);
  const showToast = useToast();
  const searchParams = useSearchParams();
  const convertFrom = searchParams.get('convertFrom');

  function load() {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (status) qs.set('status', status);
    fetch(`/api/clients?${qs}`).then((r) => r.json()).then((d) => setClients(d.clients || []));
  }
  useEffect(load, [search, status]);

  async function searchVendors(query) {
    const qs = new URLSearchParams({ status: 'approved', search: query });
    const res = await fetch(`/api/vendors?${qs}`);
    const data = await res.json();
    return data.vendors || [];
  }

  useEffect(() => {
    if (convertFrom) {
      fetch(`/api/enquiries/${convertFrom}`).then((r) => r.json()).then((d) => {
        if (d.enquiry) {
          setForm({
            name: d.enquiry.name, email: d.enquiry.email, phone: d.enquiry.phone,
            eventDate: d.enquiry.eventDate ? d.enquiry.eventDate.substring(0, 10) : '',
            eventPlace: d.enquiry.eventPlace, vendorId: '', pricing: d.enquiry.pricing || '',
          });
          setPickedVendor(null);
          setModalOpen(true);
        }
      });
    }
  }, [convertFrom]);

  async function createClient(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vendorId: pickedVendor?._id || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (convertFrom) {
        await fetch(`/api/enquiries/${convertFrom}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag: 'converted' }) });
      }

      showToast('Client created — login credentials emailed.', 'success');
      setModalOpen(false);
      setForm({ name: '', email: '', phone: '', eventDate: '', eventPlace: '', vendorId: '', pricing: '' });
      setPickedVendor(null);
      load();
    } catch (err) {
      showToast(err.message || 'Failed to create client.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminTopbar title="Clients" subtitle="Every booked client and their project." />

      <div className="panel">
        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-1">
          <SearchFilter search={search} onSearch={setSearch} status={status} onStatus={setStatus} statusOptions={STATUS_OPTIONS} />
          <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm h-fit shrink-0"><Plus size={15} /> Add Client</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-secondary border-b border-border">
                <th className="py-3">Client</th><th>Vendor</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => {
                const t = statusToneMap(c.projectStatus);
                return (
                  <tr key={c._id} className="border-b border-border hover:bg-bglight">
                    <td className="py-4"><b className="block">{c.name}</b><span className="text-xs text-secondary">{c.clientCode}</span></td>
                    <td>
                      {c.vendor ? (<><b className="block">{c.vendor.firstName} {c.vendor.lastName}</b><span className="text-xs text-secondary">{c.vendor.vendorCode}</span></>) : <span className="text-secondary text-xs">Not assigned</span>}
                    </td>
                    <td><StatusPill tone={t.tone}>{t.label}</StatusPill></td>
                    <td><Link href={`/admin/clients/${c._id}`} className="btn btn-outline btn-sm">Manage</Link></td>
                  </tr>
                );
              })}
              {!clients.length && <tr><td colSpan={4} className="py-10 text-center text-secondary">No clients match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setPickedVendor(null); }} title="Add New Client">
        <form onSubmit={createClient} className="grid gap-4">
          <div><label className="label">Full Name</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Email</label><input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Phone</label><input required className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Date of Event</label><input type="date" className="input" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
            <div><label className="label">Place of Event</label><input className="input" value={form.eventPlace} onChange={(e) => setForm({ ...form, eventPlace: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Assign Vendor (optional)</label>
              <SearchPicker
                selected={pickedVendor}
                onSelect={setPickedVendor}
                fetchResults={searchVendors}
                placeholder="Search by vendor code, business, or phone..."
                renderLabel={(v) => `${v.firstName} ${v.lastName} · ${v.vendorCode}`}
                renderSub={(v) => `${v.businessName}${v.phone ? ' · ' + v.phone : ''}`}
              />
            </div>
            <div><label className="label">Pricing (₹)</label><input type="number" className="input" value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} /></div>
          </div>
          <p className="text-xs text-secondary bg-bglight rounded-lg p-3">A login username &amp; password will be generated automatically and emailed to the client from pikturefactory@gmail.com.</p>
          <button disabled={saving} className="btn btn-primary">{saving ? 'Creating...' : 'Create Client & Send Credentials'}</button>
        </form>
      </Modal>
    </>
  );
}

export default function ClientsPage() {
  return <Suspense fallback={null}><ClientsPageInner /></Suspense>;
}
