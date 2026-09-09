'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import {
  ArrowUpRight,
  CalendarDays,
  FolderKanban,
  MapPin,
  Plus,
  Search,
  Users,
} from 'lucide-react';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []));
  }, []);

  const filtered = useMemo(() => {
    const search = q.toLowerCase().trim();

    return projects.filter((p) => {
      const haystack = [
        p.projectCode,
        p.eventType,
        p.location,
        p.client?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [projects, q]);

  return (
    <div className="space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="section-kicker">Operations</span>
          <h1 className="font-head text-3xl sm:text-4xl mt-1">Projects</h1>
          <p className="text-sm text-secondary mt-2">
            Control assignments, project flow, client delivery and vendor ownership.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/clients" className="btn btn-gold btn-sm">
            <Plus size={14} />
            Create from client
          </Link>

          <div className="relative w-60 hidden lg:block">
            <Search
              size={15}
              className="absolute left-4 top-3.5 text-secondary"
            />
            <input
              className="input pl-10 bg-white"
              placeholder="Search projects..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
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
          <Users size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">
            {projects.filter((p) => p.vendor).length}
          </b>
          <span className="text-xs">Vendor assigned</span>
        </div>

        <div className="metric-card">
          <ArrowUpRight size={17} className="text-success" />
          <b className="font-head text-2xl block mt-4">
            {projects.filter((p) => ['delivered', 'closed'].includes(p.status)).length}
          </b>
          <span className="text-xs">Delivered</span>
        </div>
      </div>

      <div className="lg:hidden relative">
        <Search
          size={15}
          className="absolute left-4 top-3.5 text-secondary"
        />
        <input
          className="input pl-10 bg-white"
          placeholder="Search projects..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="panel !p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.1fr_1fr_.9fr_.8fr_30px] gap-4 px-6 py-3 border-b border-border text-[10px] uppercase tracking-widest text-secondary">
          <span>Project</span>
          <span>Client</span>
          <span>Vendor</span>
          <span>Status</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {filtered.map((p) => {
            const t = statusToneMap(p.status);
            const vendorName = p.vendor
              ? `${p.vendor.firstName || ''} ${p.vendor.lastName || ''}`.trim()
              : 'Unassigned';

            return (
              <Link
                key={p._id}
                href={`/admin/projects/${p._id}`}
                className="block px-5 md:px-6 py-5 hover:bg-bglight transition-colors"
              >
                <div className="grid md:grid-cols-[1.1fr_1fr_.9fr_.8fr_30px] gap-3 md:gap-4 items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest text-gold">
                        {p.projectCode}
                      </span>
                      <span className="md:hidden">
                        <StatusPill tone={t.tone}>{t.label}</StatusPill>
                      </span>
                    </div>

                    <b className="block text-sm mt-1">
                      {p.eventType || 'Event'}
                    </b>

                    <span className="text-xs text-secondary inline-flex items-center gap-1 mt-1">
                      <CalendarDays size={11} />
                      {p.eventDate
                        ? new Date(p.eventDate).toLocaleDateString('en-IN')
                        : 'Date TBD'}
                      <MapPin size={11} className="ml-2" />
                      {p.location || '—'}
                    </span>
                  </div>

                  <div className="text-sm">
                    {p.client?.name || '—'}
                    <span className="block text-[10px] text-secondary">
                      {p.client?.clientCode || ''}
                    </span>
                  </div>

                  <div className="text-sm">
                    {vendorName}
                    <span className="block text-[10px] text-secondary">
                      {p.vendor?.vendorCode || ''}
                    </span>
                  </div>

                  <div className="hidden md:block">
                    <StatusPill tone={t.tone}>{t.label}</StatusPill>
                  </div>

                  <ArrowUpRight size={15} className="text-secondary" />
                </div>
              </Link>
            );
          })}

          {!filtered.length && (
            <div className="py-16 text-center text-sm text-secondary">
              No projects match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
