'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { ArrowUpRight, CheckCircle2, ChevronRight, FolderHeart, Images, IndianRupee, Sparkles } from 'lucide-react';

const FLOW = ['requested', 'vendor_assigned', 'shoot_scheduled', 'shoot_completed', 'editing', 'preview', 'client_approved', 'delivered', 'closed'];
const LABELS = {
  requested: 'Request received',
  vendor_assigned: 'Team assigned',
  shoot_scheduled: 'Shoot scheduled',
  shoot_completed: 'Shoot complete',
  editing: 'Editing in progress',
  preview: 'Preview ready',
  client_approved: 'Approved',
  delivered: 'Delivered',
  closed: 'Complete',
};

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [client, setClient] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then((response) => response.json()),
      fetch('/api/client/profile').then((response) => response.json()),
    ])
      .then(([projectsData, clientData]) => {
        setProjects(projectsData.projects || []);
        setClient(clientData.client || null);
      })
      .catch(() => {});
  }, []);

  const due = projects.reduce((sum, project) => sum + (project.amountPendingClient || 0), 0);
  const paid = projects.reduce((sum, project) => sum + (project.amountPaidByClient || 0), 0);
  const ready = projects.filter((project) => ['preview', 'client_approved', 'delivered', 'closed'].includes(project.status)).length;
  const latest = projects[0];
  const firstName = client?.name?.split(' ')[0] || '';

  const latestIndex = latest ? Math.max(0, FLOW.indexOf(latest.status)) : 0;
  const progress = latest ? Math.round((latestIndex / (FLOW.length - 1)) * 100) : 0;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] bg-primary text-white p-7 sm:p-10">
        <div className="absolute -right-16 -top-24 w-96 h-96 rounded-full bg-gold/15 blur-3xl" />

        <div className="relative grid xl:grid-cols-[1fr_340px] gap-8 items-center">
          <div>
            <span className="section-kicker">Private client space</span>
            <h1 className="font-head text-3xl sm:text-5xl mt-2">
              Welcome{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-white/55 text-sm mt-3 max-w-xl leading-6">
              Your events, memories and delivery updates — curated by Pikture Factory in one private workspace.
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              <Link href="#events" className="btn btn-gold btn-sm">
                View my events <ArrowUpRight size={14} />
              </Link>
              <Link href="/client/support" className="btn btn-sm border border-white/15 text-white hover:bg-white/10">
                Need help?
              </Link>
            </div>
          </div>

          {latest ? (
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
              <span className="text-[10px] uppercase tracking-widest text-white/35">Latest event</span>
              <h2 className="font-head text-2xl mt-2">{latest.eventType || 'Event'}</h2>
              <p className="text-xs text-white/45 mt-1">
                {latest.eventDate
                  ? new Date(latest.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                  : 'Date TBD'}
              </p>
              <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/35 mt-2">
                <span>{LABELS[latest.status] || latest.status}</span>
                <b>{progress}%</b>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-5">
              <Sparkles size={20} className="text-gold" />
              <h2 className="font-head text-xl mt-3">Your first event is on its way.</h2>
              <p className="text-xs text-white/45 mt-1">We'll keep everything here once a project is created.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <FolderHeart size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">{projects.length}</b>
          <span className="text-xs font-semibold">My events</span>
        </div>
        <div className="metric-card">
          <Images size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">{ready}</b>
          <span className="text-xs font-semibold">Galleries ready</span>
        </div>
        <div className="metric-card">
          <CheckCircle2 size={17} className="text-success" />
          <b className="font-head text-2xl block mt-4">₹{paid.toLocaleString('en-IN')}</b>
          <span className="text-xs font-semibold">Paid so far</span>
        </div>
        <div className="metric-card">
          <IndianRupee size={17} className="text-warning" />
          <b className="font-head text-2xl block mt-4">₹{due.toLocaleString('en-IN')}</b>
          <span className="text-xs font-semibold">Amount due</span>
        </div>
      </div>

      <section id="events">
        <div className="flex items-end justify-between mb-4">
          <div>
            <span className="section-kicker">My events</span>
            <h2 className="font-head text-3xl mt-1">Your memories</h2>
            <p className="text-xs text-secondary mt-1">Private event spaces curated by your Pikture Factory team.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => {
            const tone = statusToneMap[project.status] || { tone: 'neutral', label: project.status || 'Pending' };
            const index = Math.max(0, FLOW.indexOf(project.status));
            const percentage = Math.round((index / (FLOW.length - 1)) * 100);

            return (
              <Link
                key={project._id}
                href={`/client/projects/${project._id}`}
                className="group bg-white border border-border rounded-[24px] overflow-hidden hover:border-gold/60 hover:shadow-lift transition-all"
              >
                <div className="h-48 bg-primary relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold/25 via-transparent to-black/70" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-white text-[10px]">{project.projectCode}</span>
                      <FolderHeart size={19} className="text-gold" />
                    </div>
                    <div>
                      <h3 className="font-head text-3xl text-white">{project.eventType || 'Event'}</h3>
                      <p className="text-xs text-white/50 mt-1">
                        {project.eventDate
                          ? new Date(project.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Date TBD'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold truncate max-w-[200px]">{project.location || 'Event location'}</p>
                      <div className="mt-2"><StatusPill tone={tone.tone}>{tone.label}</StatusPill></div>
                    </div>
                    <span className="w-9 h-9 rounded-full border border-border flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition">
                      <ChevronRight size={15} />
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex justify-between text-[10px] text-secondary mb-2">
                      <span>Delivery progress</span>
                      <b>{percentage}%</b>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-gold" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {!projects.length && (
            <div className="col-span-full panel py-20 text-center">
              <Sparkles size={31} className="text-gold mx-auto mb-4" />
              <h3 className="font-head text-2xl">Your gallery will appear here</h3>
              <p className="text-sm text-secondary mt-1">Once your project is ready, your private event space will be available here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
