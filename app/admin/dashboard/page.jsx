'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { FolderKanban, Users, ImageIcon, IndianRupee } from 'lucide-react';

const CARDS = [
  { key: 'activeProjects', label: 'Active Projects', icon: FolderKanban, format: (v) => v },
  { key: 'totalClients', label: 'Total Clients', icon: Users, format: (v) => v },
  { key: 'pendingGallery', label: 'Pending Approvals', icon: ImageIcon, format: (v) => v },
  { key: 'revenue', label: 'Revenue Collected', icon: IndianRupee, format: (v) => `₹${Number(v).toLocaleString('en-IN')}` },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setData);
  }, []);

  const stats = data?.stats || {};
  const enquiries = data?.recentEnquiries || [];

  return (
    <>
      <AdminTopbar title="Welcome back, Admin" subtitle="Here's what's happening across Pikture Factory today." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {CARDS.map(({ key, label, icon: Icon, format }) => (
          <div key={key} className="bg-white border border-border rounded-pf p-6 transition-all hover:-translate-y-1 hover:shadow-soft">
            <div className="w-11 h-11 rounded-xl bg-bglight text-gold flex items-center justify-center mb-4"><Icon size={19} /></div>
            <b className="font-head text-xl sm:text-[28px] block truncate">{data ? format(stats[key] || 0) : '—'}</b>
            <span className="text-sm text-secondary">{label}</span>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-head">Recent Enquiries</h3>
          <Link href="/admin/enquiries" className="text-sm text-gold font-semibold">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-secondary border-b border-border">
                <th className="py-3">Name</th><th>Phone</th><th>Event Place</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => {
                const t = statusToneMap(e.tag);
                return (
                  <tr key={e._id} className="border-b border-border hover:bg-bglight">
                    <td className="py-4">{e.name}</td>
                    <td>{e.phone}</td>
                    <td>{e.eventPlace || '—'}</td>
                    <td><StatusPill tone={t.tone}>{t.label}</StatusPill></td>
                    <td><Link href={`/admin/enquiries/${e._id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                );
              })}
              {!enquiries.length && (
                <tr><td colSpan={5} className="py-8 text-center text-secondary">No enquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
