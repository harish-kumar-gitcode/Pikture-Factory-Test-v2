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
  Download,
  Folder,
  Images,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Date TBD';
}

function readSaved(id) {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(`pf-client-gallery-${id}`);
    return new Set(JSON.parse(raw || '[]'));
  } catch {
    return new Set();
  }
}

export default function ClientGalleryPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [media, setMedia] = useState([]);
  const [album, setAlbum] = useState('All');
  const [selected, setSelected] = useState(() => readSaved(id));
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${id}/media`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load gallery.');
        setProject(data.project || null);
        setMedia(data.media || []);
      })
      .catch((error) => showToast(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(`pf-client-gallery-${id}`, JSON.stringify([...selected]));
    } catch {}
  }, [id, selected]);

  const albums = useMemo(() => ['All', ...Array.from(new Set(media.map((m) => m.album || 'Unsorted')))], [media]);
  const visible = useMemo(() => media.filter((m) => album === 'All' || (m.album || 'Unsorted') === album), [media, album]);
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

  function previous() {
    setViewerIndex((i) => i <= 0 ? visible.length - 1 : i - 1);
  }

  function next() {
    setViewerIndex((i) => i >= visible.length - 1 ? 0 : i + 1);
  }

  function toggle(item) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(item._id)) nextSet.delete(item._id);
      else nextSet.add(item._id);
      return nextSet;
    });
  }

  function selectVisible(value) {
    setSelected((prev) => {
      const nextSet = new Set(prev);
      visible.forEach((item) => value ? nextSet.add(item._id) : nextSet.delete(item._id));
      return nextSet;
    });
  }

  async function downloadOne(item) {
    const a = document.createElement('a');
    a.href = `/api/project-media/${item._id}/download`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function downloadSelected() {
    const items = media.filter((item) => selected.has(item._id));
    if (!items.length || downloading) return;
    setDownloading(true);
    try {
      for (const item of items) await downloadOne(item);
      showToast(`${items.length} ${items.length === 1 ? 'image' : 'images'} sent to download.`, 'success');
    } catch {
      showToast('One or more downloads could not be started.', 'error');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bglight pb-12">
      <header className="sticky top-0 z-30 bg-bglight/95 backdrop-blur border-b border-border">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-7 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link href={`/client/projects/${id}`} className="text-xs text-secondary inline-flex items-center gap-1.5 mb-1"><ArrowLeft size={13} /> Event details</Link>
            <h1 className="font-head text-2xl sm:text-3xl truncate">{project?.eventType || 'Event'} · {project?.client?.name || 'Your Gallery'}</h1>
            <p className="text-xs text-secondary mt-1">{fmtDate(project?.eventDate)} · {project?.projectCode || ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="rounded-full bg-primary text-white px-4 py-2 text-xs"><b>{selected.size}</b> selected</div>
            <button onClick={downloadSelected} disabled={!selected.size || downloading} className="btn btn-gold btn-sm disabled:opacity-50"><Download size={13} /> {downloading ? 'Preparing…' : 'Download selected'}</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-7 py-7">
        <section className="rounded-[28px] bg-primary text-white p-7 sm:p-10 mb-6">
          <span className="text-gold text-[10px] uppercase tracking-[.22em] font-semibold">Private client gallery</span>
          <h2 className="font-head text-3xl sm:text-5xl mt-2">Your memories</h2>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">A clean private gallery of the photographs selected by your Pikture Factory team. Your selections stay saved while you browse.</p>
        </section>

        {media.length > 0 && <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {albums.map((name) => <button key={name} onClick={() => setAlbum(name)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${album === name ? 'bg-primary text-white border-primary' : 'bg-white border-border text-secondary hover:border-gold'}`}><Folder size={12} className="inline mr-1.5" />{name}</button>)}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => selectVisible(true)} className="btn btn-outline btn-sm"><CheckSquare size={13} /> Select view</button>
              <button onClick={() => selectVisible(false)} className="btn btn-outline btn-sm">Clear view</button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((item) => <article key={item._id} className={`group rounded-2xl overflow-hidden border bg-white ${selected.has(item._id) ? 'border-gold shadow-soft' : 'border-border'}`}>
              <button type="button" onClick={() => openViewer(item)} className="block w-full aspect-[4/3] bg-primary relative overflow-hidden text-left">
                {item.type === 'video' ? <div className="w-full h-full flex items-center justify-center text-white"><Images size={38} className="text-gold" /></div> : <img loading="lazy" src={`/api/project-media/${item._id}/preview`} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur text-white px-3 py-2 text-[10px] opacity-0 group-hover:opacity-100">Open image</span>
                <span onClick={(e) => { e.stopPropagation(); toggle(item); }} className={`absolute top-3 right-3 rounded-full px-3 py-2 backdrop-blur text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer ${selected.has(item._id) ? 'bg-gold text-primary' : 'bg-black/55 text-white'}`}>
                  {selected.has(item._id) ? <Check size={12} /> : <Square size={12} />}{selected.has(item._id) ? 'Selected' : 'Select'}
                </span>
              </button>
            </article>)}
          </div>
        </>}

        {loading && <div className="panel py-20 text-center text-secondary">Loading gallery…</div>}
        {!loading && !media.length && <div className="panel py-24 text-center"><Sparkles size={30} className="text-gold mx-auto mb-3" /><h3 className="font-head text-2xl">Your gallery is being prepared</h3><p className="text-sm text-secondary mt-1">Our team will make the best photographs available here once your event media is ready.</p></div>}
      </main>

      {viewer && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={closeViewer}>
        <button onClick={closeViewer} className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><X size={22} /></button>
        <button onClick={(e) => { e.stopPropagation(); previous(); }} className="absolute left-3 sm:left-7 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft size={26} /></button>
        <div className="max-w-7xl w-full max-h-[92vh] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {viewer.type === 'video' ? <div className="h-[65vh] w-full flex items-center justify-center text-white/70">Video preview is not available in this viewer.</div> : <img src={`/api/project-media/${viewer._id}/preview`} alt="" className="max-h-[78vh] max-w-full object-contain rounded-xl" />}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button onClick={() => toggle(viewer)} className={`btn btn-sm ${selected.has(viewer._id) ? 'btn-gold' : 'btn-outline !border-white/25 !text-white'}`}>{selected.has(viewer._id) ? <Check size={14} /> : <Square size={14} />}{selected.has(viewer._id) ? 'Selected' : 'Select image'}</button>
            <button onClick={() => downloadOne(viewer)} className="btn btn-outline btn-sm !border-white/25 !text-white"><Download size={14} /> Download</button>
            <span className="text-xs text-white/40">{viewerIndex + 1} / {visible.length}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 sm:right-7 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight size={26} /></button>
      </div>}
    </div>
  );
}
