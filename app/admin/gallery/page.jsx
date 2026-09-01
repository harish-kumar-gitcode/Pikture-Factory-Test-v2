'use client';
import { useEffect, useState } from 'react';
import AdminTopbar from '@/components/admin/Topbar';
import { SERVICES } from '@/lib/servicesData';
import { useToast } from '@/components/ui/Toast';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function GalleryApprovalPage() {
  const [items, setItems] = useState([]);
  const [categoryChoice, setCategoryChoice] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const showToast = useToast();

  function load() {
    fetch('/api/gallery/pending').then((r) => r.json()).then((d) => setItems(d.items || []));
  }
  useEffect(load, []);

  async function approve(id) {
    if (processingId) return;
    setProcessingId(id);
    try {
      const category = categoryChoice[id] || SERVICES[0].title;
      const res = await fetch(`/api/gallery/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', category }) });
      if (res.ok) {
        showToast('Approved — now live on the public gallery.', 'success');
        setItems((prev) => prev.filter((i) => i._id !== id));
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function reject(id) {
    if (processingId) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) });
      if (res.ok) {
        showToast('Upload rejected.', 'error');
        setItems((prev) => prev.filter((i) => i._id !== id));
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <AdminTopbar title="Gallery Approval Queue" subtitle="Vendor uploads are held here until approved for the public gallery." />

      <div className="panel">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const busy = processingId === item._id;
            return (
              <div key={item._id} className="border border-border rounded-pf overflow-hidden bg-white">
                <div className="aspect-[4/3] bg-bglight">
                  {item.type === 'video'
                    ? <video src={item.url} className="w-full h-full object-cover" controls />
                    : <img src={item.url} alt="Pending upload" className="w-full h-full object-cover" />}
                </div>
                <div className="p-4">
                  <p className="text-xs text-secondary mb-3 leading-relaxed">
                    Project: {item.project?.projectCode || '—'}<br />
                    Vendor ID: <b className="text-primary">{item.vendorCode}</b> <span className="text-[10px] bg-bglight px-1.5 py-0.5 rounded">Admin only</span>
                  </p>
                  <select disabled={busy} className="input !py-2 !text-xs mb-3 disabled:opacity-60" value={categoryChoice[item._id] || ''} onChange={(e) => setCategoryChoice({ ...categoryChoice, [item._id]: e.target.value })}>
                    <option value="">Choose category...</option>
                    {SERVICES.map((s) => <option key={s.slug} value={s.title}>{s.title}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => approve(item._id)} disabled={busy} className="btn btn-sm disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: '#dcfce7', color: '#22C55E' }}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} {busy ? 'Wait...' : 'Approve'}
                    </button>
                    <button onClick={() => reject(item._id)} disabled={busy} className="btn btn-sm disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: '#fee2e2', color: '#EF4444' }}>
                      {busy ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />} {busy ? 'Wait...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!items.length && <p className="text-secondary text-sm py-16 text-center col-span-3">Queue is empty — nothing waiting for review.</p>}
        </div>
      </div>
    </>
  );
}
