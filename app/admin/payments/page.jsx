'use client';
import { useEffect, useState } from 'react';
import AdminTopbar from '@/components/admin/Topbar';

export default function PaymentsPage() {
  const [tab, setTab] = useState('all');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/payments').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-secondary">Loading...</div>;
  const { clientPayments, vendorPayments, totals } = data;

  return (
    <>
      <AdminTopbar title="Payments" subtitle="Money in from clients, money out to vendors." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: 'Collected from Clients', value: totals.clientCollected },
          { label: 'Pending from Clients', value: totals.clientPending },
          { label: 'Paid to Vendors', value: totals.vendorPaid },
          { label: 'Pending to Vendors', value: totals.vendorPending },
        ].map((c) => (
          <div key={c.label} className="bg-white border border-border rounded-pf p-6 min-w-0">
            <b className="font-head text-lg sm:text-2xl block truncate">₹{c.value.toLocaleString('en-IN')}</b>
            <span className="text-sm text-secondary">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-6">
        {['all', 'clients', 'vendors'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 rounded-full text-sm font-semibold border capitalize transition-colors ${tab === t ? 'bg-primary text-white border-primary' : 'border-border'}`}>{t}</button>
        ))}
      </div>

      {(tab === 'all' || tab === 'clients') && (
        <div className="panel">
          <h3 className="text-lg font-head mb-4">Client Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-secondary border-b border-border"><th className="py-3">Project</th><th>Client</th><th>Total</th><th>Paid</th><th>Pending</th></tr></thead>
              <tbody>
                {clientPayments.map((p) => (
                  <tr key={p.projectId} className="border-b border-border hover:bg-bglight">
                    <td className="py-3">{p.projectCode}</td>
                    <td>{p.client?.name} <span className="text-xs text-secondary">({p.client?.clientCode})</span></td>
                    <td>₹{p.total.toLocaleString('en-IN')}</td>
                    <td className="text-success font-medium">₹{p.paid.toLocaleString('en-IN')}</td>
                    <td className="text-warning font-medium">₹{p.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tab === 'all' || tab === 'vendors') && (
        <div className="panel">
          <h3 className="text-lg font-head mb-4">Vendor Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-secondary border-b border-border"><th className="py-3">Project</th><th>Vendor</th><th>Paid</th><th>Pending</th></tr></thead>
              <tbody>
                {vendorPayments.map((p) => (
                  <tr key={p.projectId} className="border-b border-border hover:bg-bglight">
                    <td className="py-3">{p.projectCode}</td>
                    <td>{p.vendor?.firstName} {p.vendor?.lastName} <span className="text-xs text-secondary">({p.vendor?.vendorCode})</span></td>
                    <td className="text-success font-medium">₹{p.paid.toLocaleString('en-IN')}</td>
                    <td className="text-warning font-medium">₹{p.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
