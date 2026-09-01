'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { FolderOpen, CheckCircle2, IndianRupee, MapPin, Briefcase, StickyNote, MessageCircle } from 'lucide-react';

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VendorDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [vendor, setVendor] = useState(null);

  function load() {
    fetch('/api/projects').then((r) => r.json()).then((d) => setProjects(d.projects || []));
    fetch('/api/vendor/profile').then((r) => r.json()).then((d) => setVendor(d.vendor));
  }
  useEffect(load, []);

  const activeCount = projects.filter((p) => !['delivered', 'closed'].includes(p.status)).length;
  const completedCount = projects.filter((p) => p.status === 'shoot_completed' || p.status === 'delivered').length;
  const pendingAmount = projects.reduce((s, p) => s + (p.amountPendingVendor || 0), 0);
  const recentNotes = [...(vendor?.notes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  return (
    <>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl">Welcome back{vendor ? `, ${vendor.firstName}` : ''}</h1>
          <p className="text-sm text-secondary mt-0.5">Track and update the status of every shoot assigned to you.</p>
        </div>
        {vendor && (
          <div className="bg-white border border-border rounded-pf px-5 py-3 flex items-center gap-5 text-xs flex-wrap">
            <div><span className="text-secondary block mb-0.5">Vendor Code</span><b className="text-sm">{vendor.vendorCode}</b></div>
            <div><span className="text-secondary flex items-center gap-1 mb-0.5"><Briefcase size={11} /> Business</span><b className="text-sm">{vendor.businessName}</b></div>
            <div><span className="text-secondary flex items-center gap-1 mb-0.5"><MapPin size={11} /> Serviceable Area</span><b className="text-sm">{vendor.location}</b></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white border border-border rounded-pf p-6">
          <FolderOpen size={19} className="text-gold mb-3" />
          <b className="font-head text-2xl block">{activeCount}</b><span className="text-sm text-secondary">Active Projects</span>
        </div>
        <div className="bg-white border border-border rounded-pf p-6">
          <CheckCircle2 size={19} className="text-gold mb-3" />
          <b className="font-head text-2xl block">{completedCount}</b><span className="text-sm text-secondary">Completed</span>
        </div>
        <div className="bg-white border border-border rounded-pf p-6">
          <IndianRupee size={19} className="text-gold mb-3" />
          <b className="font-head text-2xl block">₹{pendingAmount.toLocaleString('en-IN')}</b><span className="text-sm text-secondary">Payment Due</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-1">All Assigned Events</h3>
          <p className="text-xs text-secondary mb-5 flex items-center gap-1.5"><MessageCircle size={13} className="text-gold" /> Open a project to chat with the admin about it specifically.</p>
          <div className="grid gap-3">
            {projects.map((p) => {
              const t = statusToneMap(p.status);
              return (
                <Link key={p._id} href={`/vendor/projects/${p._id}`} className="flex items-center justify-between border border-border rounded-xl p-4 hover:border-gold transition-colors">
                  <div>
                    <b className="block text-sm">{p.projectCode} — {p.eventType}</b>
                    <span className="text-xs text-secondary">{p.eventDate ? new Date(p.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · {p.location}</span>
                  </div>
                  <StatusPill tone={t.tone}>{t.label}</StatusPill>
                </Link>
              );
            })}
            {!projects.length && <p className="text-sm text-secondary text-center py-10">No projects assigned yet.</p>}
          </div>
        </div>

        <div className="panel h-fit">
          <h3 className="text-lg font-head mb-5 flex items-center gap-2"><StickyNote size={17} className="text-gold" /> Updates from Admin</h3>
          <div className="grid gap-3">
            {recentNotes.map((n, i) => (
              <div key={n._id || i} className="bg-bglight rounded-xl p-4 text-sm">
                <p>{n.text}</p>
                <div className="flex justify-between mt-2 text-xs text-secondary">
                  <span>{n.author}</span>
                  <span>{formatTime(n.createdAt)}</span>
                </div>
              </div>
            ))}
            {!recentNotes.length && <p className="text-sm text-secondary">No updates yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
