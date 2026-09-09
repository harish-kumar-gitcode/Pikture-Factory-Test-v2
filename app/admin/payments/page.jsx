'use client';
import { useEffect, useState } from 'react';
import AdminTopbar from '@/components/admin/Topbar';

export default function FinancePage() {
  const [tab, setTab] = useState('all');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/payments').then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-secondary">Loading...</div>;
  const { clientPayments, vendorPayments, totals } = data;

  return (
    <>
      <AdminTopbar title="Finance" subtitle="Money in from clients, money out to vendors — tracked in one control centre." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { label: 'Collected from Clients', value: totals.clientCollected },
          { label: 'Pending from Clients', value: totals.clientPending },
          { label: 'Paid to Vendors', value: totals.vendorPaid },
          { label: 'Pending to Vendors', value: totals.vendorPending },
        ].map((c) => (
          <div key={c.label} className="metric-card min-w-0">
            <b className="font-head text-lg sm:text-2xl block truncate">₹{c.value.toLocaleString('en-IN')}</b>
            <span className="text-sm text-secondary">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 bg-white border border-border rounded-2xl p-1 w-fit">
        {['all', 'clients', 'vendors'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${tab === t ? 'bg-primary text-white' : 'text-secondary hover:text-primary'}`}>{t}</button>
        ))}
      </div>

      {(tab === 'all' || tab === 'clients') && (
        <div className="panel">
          <span className="section-kicker">Money in</span><h3 className="text-2xl font-head mt-1 mb-4">Client finance</h3>
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
          <span className="section-kicker">Money out</span><h3 className="text-2xl font-head mt-1 mb-4">Vendor finance</h3>
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
