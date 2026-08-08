'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function RejectedVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const showToast = useToast();

  function load() {
    fetch('/api/vendors?status=rejected').then((r) => r.json()).then((d) => setVendors(d.vendors || []));
  }
  useEffect(load, []);

  async function reconsider(id) {
    if (processingId) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(data.alreadyProcessed ? 'Already handled — no duplicate email was sent.' : 'Vendor approved & onboarded — email sent.', 'success');
        setVendors((prev) => prev.filter((v) => v._id !== id));
      } else {
        showToast(data.error || 'Something went wrong — please try again.', 'error');
      }
    } catch {
      showToast('Network error — please try again.', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <Link href="/admin/vendors" className="text-sm text-secondary flex items-center gap-1.5 mb-3"><ArrowLeft size={14} /> Back to Vendors</Link>
      <h1 className="text-2xl mb-1">Rejected / Waitlist</h1>
      <p className="text-sm text-secondary mb-8">Vendors who didn't make the initial cut — reconsider any time.</p>

      <div className="panel">
        <div className="grid gap-3">
          {vendors.map((v) => (
            <div key={v._id} className="flex items-center justify-between border border-border rounded-xl p-4 flex-wrap gap-3">
              <div>
                <b className="block">{v.firstName} {v.lastName}</b>
                <span className="text-xs text-secondary">{v.businessName} · {v.location} · {v.email}</span>
              </div>
              <button onClick={() => reconsider(v._id)} disabled={processingId === v._id} className="btn btn-outline btn-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {processingId === v._id && <Loader2 size={14} className="animate-spin" />}
                {processingId === v._id ? 'Processing...' : 'Move to Roster'}
              </button>
            </div>
          ))}
          {!vendors.length && <p className="text-sm text-secondary text-center py-10">No rejected applications.</p>}
        </div>
      </div>
    </>
  );
}
