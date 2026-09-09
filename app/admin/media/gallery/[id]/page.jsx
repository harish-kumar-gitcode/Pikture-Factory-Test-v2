'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  ExternalLink,
  Folder,
  FolderPlus,
  Images,
  RefreshCw,
  Square,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date TBD';
}

function fmtBytes(value) {
  if (!value) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = Number(value);
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

export default function AdminMediaGalleryPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [media, setMedia] = useState([]);
  const [folders, setFolders] = useState([]);
  const [album, setAlbum] = useState('All');
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [folderBusy, setFolderBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [mediaRes, folderRes] = await Promise.all([
        fetch(`/api/projects/${id}/media`),
        fetch(`/api/projects/${id}/drive/folders`),
      ]);
      const mediaData = await mediaRes.json();
      if (!mediaRes.ok) throw new Error(mediaData.error || 'Unable to load gallery.');
      setProject(mediaData.project || null);
      setMedia(mediaData.media || []);
      if (folderRes.ok) {
        const folderData = await folderRes.json();
        setFolders(folderData.folders || []);
      }
    } catch (error) {
      showToast(error.message || 'Unable to load gallery.', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function syncDrive() {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/projects/${id}/media`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Drive sync failed.');
      setProject(data.project || null);
      setMedia(data.media || []);
      await load();
      showToast(`${data.synced || 0} files synced.`, 'success');
    } catch (error) {
      showToast(error.message || 'Drive sync failed.', 'error');
    } finally {
      setSyncing(false);
    }
  }

  async function createFolder(parentId) {
    const name = window.prompt('Folder name');
    if (!name?.trim() || folderBusy) return;
    setFolderBusy(true);
    try {
      const res = await fetch(`/api/projects/${id}/drive/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to create folder.');
      await load();
      showToast(`Folder “${data.folder.name}” created.`, 'success');
    } catch (error) {
      showToast(error.message || 'Unable to create folder.', 'error');
    } finally {
      setFolderBusy(false);
    }
  }

  async function toggleClient(item) {
    const next = !item.clientVisible;
    setMedia((prev) => prev.map((m) => m._id === item._id ? { ...m, clientVisible: next } : m));
    try {
      const res = await fetch(`/api/project-media/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientVisible: next }),
      });
      if (!res.ok) throw new Error('Unable to update client selection.');
    } catch (error) {
      setMedia((prev) => prev.map((m) => m._id === item._id ? { ...m, clientVisible: !next } : m));
      showToast(error.message || 'Unable to update client selection.', 'error');
    }
  }

  const albums = useMemo(() => ['All', ...Array.from(new Set(media.map((m) => m.album || 'Unsorted')))], [media]);
  const visible = useMemo(() => media.filter((m) => album === 'All' || (m.album || 'Unsorted') === album), [media, album]);
  const selectedCount = media.filter((m) => m.clientVisible).length;
  const viewer = viewerIndex >= 0 ? visible[viewerIndex] : null;

  useEffect(() => {
    if (!visible.length || typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#media=', '');
    if (!hash) return;
    const index = visible.findIndex((item) => item._id === hash);
    if (index >= 0) setViewerIndex(index);
  }, [visible]);

  function openViewer(item) {
    const index = visible.findIndex((m) => m._id === item._id);
    if (index >= 0) {
      setViewerIndex(index);
      window.history.replaceState(null, '', `#media=${item._id}`);
    }
  }

  function closeViewer() {
    setViewerIndex(-1);
    window.history.replaceState(null, '', window.location.pathname);
  }
  function previous() { setViewerIndex((i) => i <= 0 ? visible.length - 1 : i - 1); }
  function next() { setViewerIndex((i) => i >= visible.length - 1 ? 0 : i + 1); }

  async function download(item) {
    const a = document.createElement('a');
    a.href = `/api/project-media/${item._id}/download`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function selectVisible(value) {
    const targets = visible.filter((item) => item.clientVisible !== value);
    targets.forEach((item) => toggleClient(item));
  }

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-30 bg-bglight/95 backdrop-blur border-b border-border">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-7 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link href="/admin/media" className="text-xs text-secondary inline-flex items-center gap-1.5 mb-1">
              <ArrowLeft size={13} /> Media Library
            </Link>
            <h1 className="font-head text-2xl sm:text-3xl truncate">{project?.eventType || 'Event'} · {project?.client?.name || 'Client'}</h1>
            <p className="text-xs text-secondary mt-1">{fmtDate(project?.eventDate)} · {project?.projectCode || id}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={syncDrive} disabled={syncing} className="btn btn-primary btn-sm"><RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Sync Drive'}</button>
            {project?.drive?.projectFolderUrl && <a href={project.drive.projectFolderUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><Cloud size={13} /> Drive</a>}
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-7 py-6">
        <section className="rounded-[26px] bg-primary text-white p-6 sm:p-8 mb-6">
          <div className="flex items-end justify-between gap-5 flex-wrap">
            <div>
              <span className="text-gold text-[10px] uppercase tracking-[.2em] font-semibold">Private media curation</span>
              <h2 className="font-head text-3xl sm:text-4xl mt-2">Client delivery gallery</h2>
              <p className="text-white/50 text-sm mt-2">Select only the photographs and videos the client should receive.</p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs"><b>{selectedCount}</b> selected for client</div>
          </div>
        </section>

        <section className="panel mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <h3 className="font-head text-xl">Drive folders</h3>
              <p className="text-xs text-secondary mt-1">Create subfolders inside RAW, EDITED and any other folder.</p>
            </div>
            {project?.drive?.projectFolderId && <button onClick={() => createFolder(project.drive.projectFolderId)} disabled={folderBusy} className="btn btn-outline btn-sm"><FolderPlus size={13} /> New folder</button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {project?.drive?.rawFolderId && <button onClick={() => createFolder(project.drive.rawFolderId)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-gold"><Folder size={13} className="inline mr-1.5 text-gold" /> RAW <span className="text-secondary">· + subfolder</span></button>}
            {project?.drive?.editedFolderId && <button onClick={() => createFolder(project.drive.editedFolderId)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-gold"><Folder size={13} className="inline mr-1.5 text-gold" /> EDITED <span className="text-secondary">· + subfolder</span></button>}
            {folders.map((folder) => <button key={folder.id} onClick={() => createFolder(folder.id)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:border-gold"><Folder size={13} className="inline mr-1.5 text-gold" /> {folder.path} <span className="text-secondary">· +</span></button>)}
          </div>
        </section>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {albums.map((name) => <button key={name} onClick={() => setAlbum(name)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${album === name ? 'bg-primary text-white border-primary' : 'bg-white border-border text-secondary hover:border-gold'}`}><Folder size={12} className="inline mr-1.5" />{name}</button>)}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <p className="text-xs text-secondary">{visible.length} media · <b>{selectedCount} selected</b></p>
          <div className="flex gap-2">
            <button onClick={() => selectVisible(true)} className="btn btn-outline btn-sm"><CheckSquare size={13} /> Select view</button>
            <button onClick={() => selectVisible(false)} className="btn btn-outline btn-sm">Clear view</button>
          </div>
        </div>

        {loading ? <div className="panel py-20 text-center text-secondary">Loading gallery…</div> : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {visible.map((item) => {
              const video = item.type === 'video';
              return <article key={item._id} className={`rounded-2xl overflow-hidden border bg-white ${item.clientVisible ? 'border-gold shadow-soft' : 'border-border'}`}>
                <button type="button" onClick={() => openViewer(item)} className="block w-full aspect-[4/3] bg-primary relative overflow-hidden group">
                  {video ? <div className="w-full h-full flex items-center justify-center text-white"><Images size={38} className="text-gold" /></div> : <img src={`/api/project-media/${item._id}/preview`} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />}
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur text-white px-3 py-2 text-[10px] opacity-0 group-hover:opacity-100">Open viewer</span>
                  <span onClick={(e) => { e.stopPropagation(); toggleClient(item); }} className={`absolute top-3 right-3 rounded-full px-3 py-2 backdrop-blur text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer ${item.clientVisible ? 'bg-gold text-primary' : 'bg-black/55 text-white'}`}>
                    {item.clientVisible ? <Check size={12} /> : <Square size={12} />}{item.clientVisible ? 'Selected' : 'Select'}
                  </span>
                </button>
                <div className="p-4 flex items-center justify-between gap-3 text-xs">
                  <span className="text-secondary">{fmtBytes(item.size)}</span>
                  <button onClick={() => download(item)} className="font-semibold flex items-center gap-1 hover:text-gold"><Download size={12} /> Download</button>
                </div>
              </article>;
            })}
            {!visible.length && <div className="panel col-span-full py-20 text-center text-secondary">No media in this category.</div>}
          </div>
        )}
      </main>

      {viewer && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={closeViewer}>
        <button onClick={closeViewer} className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><X size={22} /></button>
        <button onClick={(e) => { e.stopPropagation(); previous(); }} className="absolute left-3 sm:left-7 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft size={26} /></button>
        <div className="max-w-7xl w-full max-h-[92vh] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {viewer.type === 'video' ? <div className="h-[65vh] w-full flex items-center justify-center text-white/70">Video preview is not available in the private viewer.</div> : <img src={`/api/project-media/${viewer._id}/preview`} alt="" className="max-h-[78vh] max-w-full object-contain rounded-xl" />}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={() => toggleClient(viewer)} className={`btn btn-sm ${viewer.clientVisible ? 'btn-gold' : 'btn-outline !border-white/25 !text-white'}`}>{viewer.clientVisible ? <Check size={14} /> : <Square size={14} />}{viewer.clientVisible ? 'Selected for client' : 'Select for client'}</button>
            <button onClick={() => download(viewer)} className="btn btn-outline btn-sm !border-white/25 !text-white"><Download size={14} /> Download</button>
            {viewer.webViewLink && <a href={viewer.webViewLink} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm !border-white/25 !text-white"><ExternalLink size={14} /> Drive</a>}
            <span className="text-xs text-white/40">{viewerIndex + 1} / {visible.length}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 sm:right-7 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight size={26} /></button>
      </div>}
    </div>
  );
}
