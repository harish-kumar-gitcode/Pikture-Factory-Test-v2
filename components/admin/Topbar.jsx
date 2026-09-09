'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Command, Search, X, ArrowUpRight, UserRound, Camera, FolderKanban, Inbox } from 'lucide-react';

const TYPES = {
  clients: { label: 'Clients', icon: UserRound, href: (item) => `/admin/clients/${item._id}` },
  vendors: { label: 'Vendors', icon: Camera, href: (item) => `/admin/vendors/${item._id}` },
  projects: { label: 'Projects', icon: FolderKanban, href: (item) => `/admin/projects/${item._id}` },
  enquiries: { label: 'Enquiries', icon: Inbox, href: (item) => `/admin/enquiries/${item._id}` },
};

export default function AdminTopbar({ title, subtitle, hasNotification = false }) {
  const [downloadCount, setDownloadCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ clients: [], vendors: [], projects: [], enquiries: [] });
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch('/api/admin/media-downloads')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setDownloadCount(d?.downloads?.length || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || !query.trim()) {
      setResults({ clients: [], vendors: [], projects: [], enquiries: [] });
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(query.trim());
        const [clients, vendors, projects, enquiries] = await Promise.all([
          fetch(`/api/clients?search=${q}`, { signal: controller.signal }).then((r) => r.ok ? r.json() : { clients: [] }),
          fetch(`/api/vendors?status=approved&search=${q}`, { signal: controller.signal }).then((r) => r.ok ? r.json() : { vendors: [] }),
          fetch(`/api/projects`, { signal: controller.signal }).then((r) => r.ok ? r.json() : { projects: [] }),
          fetch(`/api/enquiries`, { signal: controller.signal }).then((r) => r.ok ? r.json() : { enquiries: [] }),
        ]);

        const lower = query.trim().toLowerCase();
        const projectMatches = (projects.projects || []).filter((p) =>
          `${p.projectCode || ''} ${p.eventType || ''} ${p.location || ''} ${p.client?.name || ''} ${p.vendor?.vendorCode || ''}`.toLowerCase().includes(lower)
        ).slice(0, 6);
        const enquiryMatches = (enquiries.enquiries || []).filter((e) =>
          `${e.name || ''} ${e.phone || ''} ${e.vendorCode || ''} ${e.vendorSelected || ''}`.toLowerCase().includes(lower)
        ).slice(0, 6);

        setResults({
          clients: (clients.clients || []).slice(0, 6),
          vendors: (vendors.vendors || []).slice(0, 6),
          projects: projectMatches,
          enquiries: enquiryMatches,
        });
      } catch (error) {
        if (error.name !== 'AbortError') setResults({ clients: [], vendors: [], projects: [], enquiries: [] });
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searchOpen]);

  const notified = hasNotification || downloadCount > 0;
  const totalResults = Object.values(results).reduce((sum, items) => sum + items.length, 0);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="eyebrow text-gold mb-2">Pikture Factory · Admin</div>
          <h1 className="font-head text-3xl sm:text-[34px] tracking-[-.03em]">{title}</h1>
          {subtitle && <p className="text-sm text-secondary mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 bg-white border border-border rounded-xl px-3 h-10 text-xs text-secondary hover:border-gold transition-colors min-w-[210px]"
          >
            <Search size={15} />
            <span className="flex-1 text-left">Search workspace</span>
            <span className="inline-flex items-center gap-1 text-[10px] border border-border rounded-md px-1.5 py-0.5">
              <Command size={9} /> K
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center"
            aria-label="Search workspace"
          >
            <Search size={17} />
          </button>

          <Link
            href="/admin/media"
            title={downloadCount ? `${downloadCount} client download${downloadCount === 1 ? '' : 's'}` : 'Media activity'}
            className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center relative hover:bg-primary hover:text-white transition-colors"
          >
            <Bell size={17} />
            {notified && <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-white" />}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[200] bg-primary/55 backdrop-blur-sm p-3 sm:p-6" onClick={() => setSearchOpen(false)}>
          <div
            className="max-w-3xl mx-auto mt-8 sm:mt-16 bg-white rounded-[24px] shadow-2xl overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <Search size={19} className="text-gold" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search clients, vendors, projects or enquiries..."
                className="flex-1 outline-none text-sm bg-transparent"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="w-8 h-8 rounded-full hover:bg-bglight flex items-center justify-center" aria-label="Close search">
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3">
              {!query.trim() ? (
                <div className="py-14 text-center text-secondary">
                  <Search size={26} className="mx-auto mb-3 text-gold" />
                  <p className="text-sm font-semibold text-primary">Search your workspace</p>
                  <p className="text-xs mt-1">Find clients, vendors, projects and enquiries instantly.</p>
                </div>
              ) : searching ? (
                <div className="py-14 text-center text-sm text-secondary">Searching workspace...</div>
              ) : totalResults === 0 ? (
                <div className="py-14 text-center text-sm text-secondary">No workspace records match “{query}”.</div>
              ) : (
                Object.entries(results).map(([key, items]) => {
                  if (!items.length) return null;
                  const config = TYPES[key];
                  const Icon = config.icon;
                  return (
                    <div key={key} className="mb-4 last:mb-0">
                      <div className="px-3 py-2 text-[10px] uppercase tracking-[.18em] text-secondary font-semibold">{config.label}</div>
                      <div className="grid gap-1">
                        {items.map((item) => (
                          <Link
                            key={item._id}
                            href={config.href(item)}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-bglight transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0"><Icon size={16} /></div>
                            <div className="min-w-0 flex-1">
                              <b className="block text-sm truncate">
                                {key === 'vendors' ? `${item.firstName || ''} ${item.lastName || ''}`.trim() : key === 'projects' ? `${item.projectCode || 'Project'} · ${item.eventType || 'Event'}` : item.name || item.projectCode || 'Record'}
                              </b>
                              <span className="block text-[10px] text-secondary truncate">
                                {key === 'vendors' ? `${item.vendorCode || ''} · ${item.businessName || ''}` : key === 'projects' ? `${item.client?.name || 'Client'} · ${item.location || 'Location pending'}` : key === 'enquiries' ? `${item.phone || ''} · ${item.vendorCode || 'No vendor code'}` : `${item.clientCode || ''} · ${item.phone || ''}`}
                              </span>
                            </div>
                            <ArrowUpRight size={14} className="text-secondary" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
