'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { ArrowUpRight, CalendarDays, FolderKanban, MapPin, Search } from 'lucide-react';

export default function VendorProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []));
  }, []);

  const filtered = useMemo(
    () =>
      projects.filter((p) =>
        `${p.projectCode} ${p.eventType} ${p.location}`
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [projects, q]
  );

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="section-kicker">Work queue</span>
          <h1 className="font-head text-3xl sm:text-4xl mt-1">Projects</h1>
          <p className="text-sm text-secondary mt-2">
            Every assigned shoot, its status and the next action in one place.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-4 top-3.5 text-secondary" />
          <input
            className="input pl-10 bg-white"
            placeholder="Search projects..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <FolderKanban size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">{projects.length}</b>
          <span className="text-xs">All projects</span>
        </div>

        <div className="metric-card">
          <CalendarDays size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">
            {projects.filter((p) => p.status === 'shoot_scheduled').length}
          </b>
          <span className="text-xs">Scheduled</span>
        </div>

        <div className="metric-card">
          <FolderKanban size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">
            {projects.filter((p) => ['editing', 'preview'].includes(p.status)).length}
          </b>
          <span className="text-xs">Post-production</span>
        </div>

        <div className="metric-card">
          <ArrowUpRight size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">
            {projects.filter((p) => ['delivered', 'closed'].includes(p.status)).length}
          </b>
          <span className="text-xs">Delivered</span>
        </div>
      </div>

      <div className="panel !p-0 overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((p) => {
            const t = statusToneMap(p.status);

            return (
              <Link
                key={p._id}
                href={`/vendor/projects/${p._id}`}
                className="block p-5 sm:p-6 hover:bg-bglight transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary text-gold flex items-center justify-center shrink-0">
                    <FolderKanban size={17} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest text-gold">
                        {p.projectCode}
                      </span>
                      <StatusPill tone={t.tone}>{t.label}</StatusPill>
                    </div>

                    <h3 className="font-head text-xl mt-1 truncate">
                      {p.eventType || 'Event'}
                    </h3>

                    <div className="flex flex-wrap gap-3 text-xs text-secondary mt-1">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={12} />
                        {p.eventDate
                          ? new Date(p.eventDate).toLocaleDateString('en-IN')
                          : 'Date TBD'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {p.location || 'Location pending'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-secondary block">Vendor payout</span>
                    <b>₹{(p.amountPaidToVendor || 0).toLocaleString('en-IN')}</b>
                    {p.amountPendingVendor > 0 ? (
                      <span className="block text-warning mt-1">
                        ₹{p.amountPendingVendor.toLocaleString('en-IN')} pending
                      </span>
                    ) : null}
                  </div>

                  <ArrowUpRight size={16} className="text-secondary" />
                </div>
              </Link>
            );
          })}

          {!filtered.length ? (
            <div className="py-16 text-center text-sm text-secondary">
              No projects match your search.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
