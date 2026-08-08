'use client';
import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

export default function VendorPaymentsPage() {
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then((d) => setProjects(d.projects || []));
  }, []);

  const totalReceived = projects.reduce((s, p) => s + (p.amountPaidToVendor || 0), 0);
  const totalPending = projects.reduce((s, p) => s + (p.amountPendingVendor || 0), 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl">Payments</h1>
        <p className="text-sm text-secondary mt-0.5">Your earnings across all Pikture Factory projects.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        <div className="bg-white border border-border rounded-pf p-6">
          <b className="font-head text-2xl sm:text-3xl block text-success">₹{totalReceived.toLocaleString('en-IN')}</b>
          <span className="text-sm text-secondary">Total Received</span>
        </div>
        <div className="bg-white border border-border rounded-pf p-6">
          <b className="font-head text-2xl sm:text-3xl block text-warning">₹{totalPending.toLocaleString('en-IN')}</b>
          <span className="text-sm text-secondary">Yet to be Received</span>
        </div>
      </div>

      <div className="panel">
        <h3 className="text-lg font-head mb-4">Per-Project Breakdown</h3>
        <div className="grid gap-3">
          {projects.map((p) => (
            <button key={p._id} onClick={() => setActive(p)} className="flex items-center justify-between border border-border rounded-xl p-4 text-left hover:border-gold transition-colors">
              <div><b className="block text-sm">{p.projectCode} — {p.eventType}</b><span className="text-xs text-secondary">{p.eventDate ? new Date(p.eventDate).toLocaleDateString('en-IN') : 'Date TBD'}</span></div>
              <div className="text-right text-sm">
                <span className="text-success font-semibold">₹{p.amountPaidToVendor?.toLocaleString('en-IN')} paid</span>
                {p.amountPendingVendor > 0 && <span className="text-warning block text-xs">₹{p.amountPendingVendor.toLocaleString('en-IN')} pending</span>}
              </div>
            </button>
          ))}
          {!projects.length && <p className="text-sm text-secondary text-center py-10">No payment records yet.</p>}
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.projectCode} maxWidth="max-w-sm">
        {active && (
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between bg-bglight rounded-lg p-3"><span>Event Type</span><b>{active.eventType}</b></div>
            <div className="flex justify-between bg-bglight rounded-lg p-3"><span>Amount Paid</span><b className="text-success">₹{active.amountPaidToVendor?.toLocaleString('en-IN')}</b></div>
            <div className="flex justify-between bg-bglight rounded-lg p-3"><span>Amount Pending</span><b className="text-warning">₹{active.amountPendingVendor?.toLocaleString('en-IN')}</b></div>
          </div>
        )}
      </Modal>
    </>
  );
}
