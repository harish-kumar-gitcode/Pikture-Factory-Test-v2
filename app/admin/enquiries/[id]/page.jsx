'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import NotesTimeline from '@/components/ui/NotesTimeline';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, UserPlus } from 'lucide-react';

const TAGS = [
  { value: 'new', label: 'New', tone: 'info' },
  { value: 'follow_up', label: 'Follow-up', tone: 'warning' },
  { value: 'converted', label: 'Converted', tone: 'success' },
  { value: 'lost', label: 'Lost', tone: 'danger' },
];

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const showToast = useToast();
  const [enquiry, setEnquiry] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`/api/enquiries/${id}`).then((r) => r.json()).then((d) => { setEnquiry(d.enquiry); setForm(d.enquiry); });
  }
  useEffect(load, [id]);

  async function saveDetails() {
    setSaving(true);
    const res = await fetch(`/api/enquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, email: form.email, phone: form.phone, eventDate: form.eventDate,
        eventPlace: form.eventPlace, vendorSelected: form.vendorSelected, vendorCode: form.vendorCode, pricing: form.pricing,
      }),
    });
    setSaving(false);
    if (res.ok) { showToast('Enquiry updated.', 'success'); load(); }
  }

  async function setTag(tag) {
    await fetch(`/api/enquiries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tag }) });
    showToast(`Tagged as ${TAGS.find((t) => t.value === tag)?.label}`, 'success');
    load();
  }

  async function addNote(text) {
    await fetch(`/api/enquiries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: text }) });
    load();
  }

  if (!enquiry || !form) return <div className="text-secondary">Loading...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <Link href="/admin/enquiries" className="text-sm text-secondary flex items-center gap-1.5 mb-2"><ArrowLeft size={14} /> Back to Enquiries</Link>
          <h1 className="text-2xl">{enquiry.name}</h1>
        </div>
        <Link href={{ pathname: '/admin/clients', query: { convertFrom: id } }} className="btn btn-primary btn-sm"><UserPlus size={15} /> Convert to Client</Link>
      </div>

      {/* tag selector */}
      <div className="flex gap-2 mb-6">
        {TAGS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTag(t.value)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              enquiry.tag === t.value ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-5">Lead Information</h3>
          <div className="grid gap-4">
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Date of Event</label><input type="date" className="input" value={form.eventDate ? form.eventDate.substring(0, 10) : ''} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} /></div>
              <div><label className="label">Place of Event</label><input className="input" value={form.eventPlace} onChange={(e) => setForm({ ...form, eventPlace: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="label">Vendor Selected</label><input className="input" value={form.vendorSelected} onChange={(e) => setForm({ ...form, vendorSelected: e.target.value })} placeholder="Vendor name" /></div>
              <div><label className="label">Vendor Code</label><input className="input" value={form.vendorCode} onChange={(e) => setForm({ ...form, vendorCode: e.target.value })} placeholder="VN-021" /></div>
            </div>
            <div><label className="label">Pricing Discussed (₹)</label><input type="number" className="input" value={form.pricing} onChange={(e) => setForm({ ...form, pricing: e.target.value })} /></div>
            <button onClick={saveDetails} disabled={saving} className="btn btn-primary w-fit">{saving ? 'Saving...' : 'Save & Update'}</button>
          </div>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-5">Call Notes &amp; Follow-ups</h3>
          <NotesTimeline notes={enquiry.notes} onAdd={addNote} placeholder="e.g. Gave a follow-up call today, client said..." />
        </div>
      </div>
    </>
  );
}
