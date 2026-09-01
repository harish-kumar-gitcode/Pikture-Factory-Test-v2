'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { FolderOpen, IndianRupee, CheckCircle2 } from 'lucide-react';

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [client, setClient] = useState(null);

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then((d) => setProjects(d.projects || []));
    fetch('/api/client/profile').then((r) => r.json()).then((d) => setClient(d.client));
  }, []);

  const totalDue = projects.reduce((s, p) => s + (p.amountPendingClient || 0), 0);
  const totalPaid = projects.reduce((s, p) => s + (p.amountPaidByClient || 0), 0);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl">Welcome back{client ? `, ${client.name.split(' ')[0]}` : ''}</h1>
        <p className="text-sm text-secondary mt-0.5">Track every project you've booked with Pikture Factory.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-border rounded-pf p-6">
          <FolderOpen size={19} className="text-gold mb-3" />
          <b className="font-head text-2xl block">{projects.length}</b><span className="text-sm text-secondary">Total Projects</span>
        </div>
        <div className="bg-white border border-border rounded-pf p-6">
          <CheckCircle2 size={19} className="text-gold mb-3" />
          <b className="font-head text-2xl block">₹{totalPaid.toLocaleString('en-IN')}</b><span className="text-sm text-secondary">Paid So Far</span>
        </div>
        <div className="bg-white border border-border rounded-pf p-6">
          <IndianRupee size={19} className="text-gold mb-3" />
          <b className="font-head text-2xl block">₹{totalDue.toLocaleString('en-IN')}</b><span className="text-sm text-secondary">Amount Due</span>
        </div>
      </div>

      <div className="panel">
        <h3 className="text-lg font-head mb-5">Your Projects</h3>
        <div className="grid gap-3">
          {projects.map((p) => {
            const t = statusToneMap(p.status);
            return (
              <Link key={p._id} href={`/client/projects/${p._id}`} className="flex items-center justify-between border border-border rounded-xl p-4 hover:border-gold transition-colors">
                <div>
                  <b className="block text-sm">{p.projectCode} — {p.eventType}</b>
                  <span className="text-xs text-secondary">{p.eventDate ? new Date(p.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · {p.location}</span>
                  {p.vendor?.businessName && <span className="text-xs text-secondary block">Photographer: {p.vendor.businessName}</span>}
                </div>
                <StatusPill tone={t.tone}>{t.label}</StatusPill>
              </Link>
            );
          })}
          {!projects.length && <p className="text-sm text-secondary text-center py-10">No projects yet — reach out to us to get started.</p>}
        </div>
      </div>
    </>
  );
}
