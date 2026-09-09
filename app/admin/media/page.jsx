'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Images, FolderOpen, RefreshCw, ExternalLink, Check, CheckSquare, Square,
  Download, Video, Image as ImageIcon, Cloud, ArrowLeft, Sparkles,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD';
}
function fmtBytes(value) {
  if (!value) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = Number(value), i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

function AdminMediaPageInner() {
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('project') || '');
  const [media, setMedia] = useState([]);
  const [project, setProject] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState([]);
  const [albumFilter, setAlbumFilter] = useState('All');

  async function loadProjects() {
    const res = await fetch('/api/projects');
    const data = await res.json();
    const list = data.projects || [];
    setProjects(list);
    if (!selectedId && list[0]?._id) setSelectedId(list[0]._id);
  }
  async function loadProject(id = selectedId) {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/media`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load media.');
      setProject(data.project);
      setMedia(data.media || []);
      setAlbumFilter('All');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  }
  async function loadDownloads() {
    const res = await fetch('/api/admin/media-downloads');
    if (res.ok) setDownloads((await res.json()).downloads || []);
  }
  useEffect(() => { loadProjects(); loadDownloads(); }, []);
  useEffect(() => { if (selectedId) loadProject(selectedId); }, [selectedId]);

  async function syncDrive() {
    if (!selectedId || syncing) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${selectedId}/media`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drive sync failed.');
      setProject(data.project); setMedia(data.media || []);
      showToast(`${data.synced || 0} files synced.`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSyncing(false); }
  }

  async function toggleClient(mediaItem) {
    const next = !mediaItem.clientVisible;
    setMedia((prev) => prev.map((m) => m._id === mediaItem._id ? { ...m, clientVisible: next } : m));
    const res = await fetch(`/api/project-media/${mediaItem._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientVisible: next }),
    });
    if (!res.ok) setMedia((prev) => prev.map((m) => m._id === mediaItem._id ? { ...m, clientVisible: !next } : m));
  }

  async function setAlbum(mediaItem, album) {
    if (!album.trim()) return;
    const res = await fetch(`/api/project-media/${mediaItem._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ album }),
    });
    if (res.ok) setMedia((prev) => prev.map((m) => m._id === mediaItem._id ? { ...m, album } : m));
  }

  async function selectAlbum(album, visible) {
    const targets = media.filter((m) => (album === 'All' || m.album === album) && m.clientVisible !== visible);
    if (!targets.length) return;
    setMedia((prev) => prev.map((m) => targets.some((t) => t._id === m._id) ? { ...m, clientVisible: visible } : m));
    await Promise.all(targets.map((m) => fetch(`/api/project-media/${m._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientVisible: visible }),
    })));
    showToast(visible ? 'Selected media is now ready for the client.' : 'Media removed from the client gallery.', 'success');
  }

  const albums = useMemo(() => ['All', ...Array.from(new Set(media.map((m) => m.album || 'Unsorted')))], [media]);
  const filtered = media.filter((m) => albumFilter === 'All' || (m.album || 'Unsorted') === albumFilter);
  const selectedCount = media.filter((m) => m.clientVisible).length;
  const currentProject = project || projects.find((p) => p._id === selectedId);

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/dashboard" className="text-xs text-secondary flex items-center gap-1.5 mb-3"><ArrowLeft size={13} /> Dashboard</Link>
          <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-primary text-gold flex items-center justify-center"><Images size={21} /></div><div><h1 className="text-3xl">Media Library</h1><p className="text-sm text-secondary">Curate final memories without exposing the storage layer.</p></div></div>
        </div>
        {currentProject && <div className="flex gap-2"><button onClick={syncDrive} disabled={syncing} className="btn btn-primary btn-sm disabled:opacity-60"><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync Drive'}</button>{currentProject.drive?.projectFolderUrl && <a href={currentProject.drive.projectFolderUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Cloud size={14} /> Open Workspace</a>}</div>}
      </div>

      <div className="grid lg:grid-cols-[290px_1fr] gap-6 items-start">
        <aside className="panel !p-3 lg:sticky lg:top-5">
          <div className="px-3 py-2 text-[10px] uppercase tracking-[.18em] font-semibold text-secondary">Events</div>
          <div className="grid gap-1">
            {projects.map((p) => (
              <div key={p._id} className={`rounded-xl px-3 py-3 transition-all ${selectedId === p._id ? 'bg-primary text-white shadow-soft' : 'hover:bg-bglight'}`}><button onClick={() => setSelectedId(p._id)} className="text-left w-full">
                <div className="flex items-start gap-2.5"><FolderOpen size={16} className={selectedId === p._id ? 'text-gold mt-0.5' : 'text-gold mt-0.5'} /><span className="min-w-0"><b className="text-sm block truncate">{p.eventType || 'Event'}</b><span className={`text-[11px] block truncate ${selectedId === p._id ? 'text-white/60' : 'text-secondary'}`}>{fmtDate(p.eventDate)} · {p.projectCode}</span></span></div>
              </button><button onClick={() => window.open(`/admin-gallery/${p._id}`, '_blank', 'noopener,noreferrer')} className={`w-full mt-2 rounded-lg px-3 py-2 text-[10px] font-semibold border ${selectedId === p._id ? 'border-white/15 text-white/80 hover:bg-white/10' : 'border-border text-secondary hover:border-gold'}`}><ExternalLink size={11} className="inline mr-1"/> Open gallery</button></div>
            ))}
            {!projects.length && <p className="text-xs text-secondary p-4">No projects yet.</p>}
          </div>
        </aside>

        <section className="min-w-0">
          {currentProject && (
            <div className="rounded-[24px] overflow-hidden bg-primary text-white p-6 sm:p-8 mb-6 relative">
              <div className="absolute -right-16 -top-20 w-64 h-64 rounded-full bg-gold/10 blur-3xl" />
              <div className="relative flex items-end justify-between gap-5 flex-wrap">
                <div><span className="text-gold text-[11px] uppercase tracking-[.2em] font-semibold">Private Event Gallery</span><h2 className="font-head text-3xl sm:text-4xl mt-2">{currentProject.eventType || 'Event'} <span className="text-white/40">·</span> {currentProject.client?.name || 'Client'}</h2><p className="text-white/55 text-sm mt-2">{fmtDate(currentProject.eventDate)} · {currentProject.projectCode}</p></div>
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs"><Sparkles size={13} className="text-gold" /> {selectedCount} selected for client</div>
              </div>
            </div>
          )}

          {!currentProject ? <div className="panel text-center py-20 text-secondary">Select an event to manage its gallery.</div> : (
            <>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
                {albums.map((album) => <button key={album} onClick={() => setAlbumFilter(album)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border transition ${albumFilter === album ? 'bg-primary text-white border-primary' : 'bg-white border-border text-secondary hover:border-gold'}`}><FolderOpen size={13} className="inline mr-1.5" />{album}</button>)}
              </div>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap"><p className="text-xs text-secondary">{filtered.length} media in this view · <b className="text-primary">{selectedCount} visible to client</b></p><div className="flex gap-2"><button onClick={() => selectAlbum(albumFilter, true)} className="btn btn-outline btn-sm"><CheckSquare size={13} /> Select view</button><button onClick={() => selectAlbum(albumFilter, false)} className="btn btn-outline btn-sm">Clear view</button></div></div>

              {loading ? <div className="panel py-20 text-center text-secondary">Loading gallery…</div> : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((item) => {
                    const isVideo = item.type === 'video';
                    return <div key={item._id} className={`group rounded-2xl overflow-hidden border bg-white transition-all ${item.clientVisible ? 'border-gold shadow-soft' : 'border-border'}`}>
                      <button onClick={() => window.open(`/admin-gallery/${selectedId}?media=${item._id}`, '_blank', 'noopener,noreferrer')} className="aspect-[4/3] bg-[#f0f0f0] relative overflow-hidden block w-full text-left">
                        {isVideo ? <div className="w-full h-full flex items-center justify-center bg-primary text-white"><Video size={38} className="text-gold" /></div> : <img loading="lazy" src={`/api/project-media/${item._id}/preview`} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                        <div className="absolute top-3 left-3 rounded-full px-2.5 py-1 bg-black/55 backdrop-blur text-white text-[10px] flex items-center gap-1.5">{isVideo ? <Video size={11} /> : <ImageIcon size={11} />}{isVideo ? 'Video' : 'Photo'}</div>
                        <span onClick={(e) => { e.stopPropagation(); toggleClient(item); }} className={`absolute top-3 right-3 rounded-full px-3 py-2 backdrop-blur text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer ${item.clientVisible ? 'bg-gold text-primary' : 'bg-black/55 text-white'}`}>{item.clientVisible ? <Check size={12} /> : <Square size={12} />}{item.clientVisible ? 'Client' : 'Select'}</span>
                      </button>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-secondary">{fmtBytes(item.size)} · {fmtDate(item.modifiedTime)}</span><a href={item.webViewLink} target="_blank" rel="noreferrer" className="text-secondary hover:text-gold" title="Open original"><ExternalLink size={15} /></a></div>
                        <div className="mt-3 flex items-center gap-2"><input value={item.album || ''} onChange={(e) => setMedia((prev) => prev.map((m) => m._id === item._id ? { ...m, album: e.target.value } : m))} onBlur={(e) => setAlbum(item, e.target.value)} className="input !py-2 !text-xs" placeholder="Album / folder name" /><span className="text-[10px] text-secondary shrink-0">{item.downloadCount || 0} downloads</span></div>
                      </div>
                    </div>;
                  })}
                  {!filtered.length && <div className="panel col-span-full py-20 text-center"><Cloud size={32} className="text-gold mx-auto mb-3" /><h3 className="font-head text-lg">No media synced yet</h3><p className="text-xs text-secondary mt-1">Ask the vendor to upload to the project workspace, then sync this event.</p></div>}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="flex items-center justify-between mb-5"><div><h3 className="font-head text-xl">Client download activity</h3><p className="text-xs text-secondary mt-1">Every client download is recorded here.</p></div><Download size={18} className="text-gold" /></div>
        <div className="grid gap-2">
          {downloads.slice(0, 8).map((d, i) => <div key={d._id || i} className="flex items-center justify-between gap-4 rounded-xl bg-bglight px-4 py-3 text-xs"><div className="min-w-0"><b className="block truncate">{d.fileName || d.media?.name}</b><span className="text-secondary">{d.client?.name || 'Client'} · {d.project?.eventType || 'Event'} · {d.project?.projectCode}</span></div><span className="text-secondary shrink-0">{d.downloadedAt ? new Date(d.downloadedAt).toLocaleString('en-IN') : '—'}</span></div>)}
          {!downloads.length && <p className="text-sm text-secondary py-6 text-center">No client downloads yet.</p>}
        </div>
      </section>
    </div>
  );
}

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<div className="panel py-20 text-center text-secondary">Loading media library…</div>}>
      <AdminMediaPageInner />
    </Suspense>
  );
}
