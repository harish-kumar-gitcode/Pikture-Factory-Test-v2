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


export default function ClientGalleryPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [media, setMedia] = useState([]);
  const [album, setAlbum] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [delivery, setDelivery] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [mediaRes, deliveryRes] = await Promise.all([
          fetch(`/api/projects/${id}/media`),
          fetch(`/api/projects/${id}/delivery`),
        ]);
        const data = await mediaRes.json();
        const deliveryData = await deliveryRes.json();
        if (!mediaRes.ok) throw new Error(data.error || 'Unable to load gallery.');
        if (!deliveryRes.ok) throw new Error(deliveryData.error || 'Unable to load delivery status.');
        setProject(data.project || null);
        setMedia(data.media || []);
        setDelivery(deliveryData);
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

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


  async function submitSelection() {
    if (!selected.size || submitting) return;
    if (!window.confirm(`Submit ${selected.size} selected ${selected.size === 1 ? 'photo' : 'photos'} for editing? RAW access will be removed after submission.`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${id}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit-selection', mediaIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit your selection.');
      setSelected(new Set());
      setDelivery(data);
      setMedia([]);
      showToast('Selection submitted. RAW access has been closed while the images are edited.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to submit your selection.', 'error');
    } finally {
      setSubmitting(false);
    }
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
    const items = delivery?.stage === 'edited_delivery' ? media : media.filter((item) => selected.has(item._id));
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
            {delivery?.stage === 'raw_selection' && <div className="rounded-full bg-primary text-white px-4 py-2 text-xs"><b>{selected.size}</b> selected</div>}
            {delivery?.stage === 'raw_selection' && <button onClick={submitSelection} disabled={!selected.size || submitting} className="btn btn-gold btn-sm disabled:opacity-50"><Check size={13} /> {submitting ? 'Submitting…' : 'Submit selection'}</button>}
            {delivery?.stage === 'edited_delivery' && <button onClick={downloadSelected} disabled={!media.length || downloading} className="btn btn-gold btn-sm disabled:opacity-50"><Download size={13} /> {downloading ? 'Preparing…' : 'Download edited photos'}</button>}
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 sm:px-7 py-7">
        <section className="rounded-[28px] bg-primary text-white p-7 sm:p-10 mb-6">
          <span className="text-gold text-[10px] uppercase tracking-[.22em] font-semibold">Private client gallery</span>
          <h2 className="font-head text-3xl sm:text-5xl mt-2">Your memories</h2>
          <p className="text-white/50 text-sm mt-2 max-w-2xl">
            {delivery?.stage === 'raw_selection'
              ? 'Choose the RAW photographs you want our editors to work on. Submit your selection when you are finished.'
              : delivery?.stage === 'editing'
                ? 'Your selection is with our editing team. RAW photos are temporarily unavailable while the selected images are being edited.'
                : 'Your edited photographs are ready. You can view and download the final images from this gallery.'}
          </p>
        </section>

        {delivery?.stage === 'editing' && (
          <section className="panel mb-6 border-gold/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center"><Images size={18} /></div>
              <div>
                <h3 className="font-head text-lg">Editing in progress</h3>
                <p className="text-sm text-secondary mt-1">Your RAW-photo access has been removed. If you want to select additional photos later, the Pikture Factory team can reopen RAW selection for you.</p>
              </div>
            </div>
          </section>
        )}

        {delivery?.stage === 'edited_delivery' && (
          <section className="panel mb-6 border-gold/30">
            <h3 className="font-head text-lg">Edited photos are ready</h3>
            <p className="text-sm text-secondary mt-1">These are the final edited files shared with you. Use the download button on this page to save them.</p>
          </section>
        )}

        {(delivery?.stage === 'raw_selection' || delivery?.stage === 'edited_delivery') && media.length > 0 && <>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {albums.map((name) => <button key={name} onClick={() => setAlbum(name)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${album === name ? 'bg-primary text-white border-primary' : 'bg-white border-border text-secondary hover:border-gold'}`}><Folder size={12} className="inline mr-1.5" />{name}</button>)}
            </div>
            {delivery?.stage === 'raw_selection' && <div className="flex gap-2 shrink-0">
              <button onClick={() => selectVisible(true)} className="btn btn-outline btn-sm"><CheckSquare size={13} /> Select view</button>
              <button onClick={() => selectVisible(false)} className="btn btn-outline btn-sm">Clear view</button>
            </div>}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((item) => <article key={item._id} className={`group rounded-2xl overflow-hidden border bg-white ${selected.has(item._id) ? 'border-gold shadow-soft' : 'border-border'}`}>
              <button type="button" onClick={() => openViewer(item)} className="block w-full aspect-[4/3] bg-primary relative overflow-hidden text-left">
                {item.type === 'video' ? <div className="w-full h-full flex items-center justify-center text-white"><Images size={38} className="text-gold" /></div> : <img loading="lazy" src={`/api/project-media/${item._id}/preview`} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur text-white px-3 py-2 text-[10px] opacity-0 group-hover:opacity-100">Open image</span>
                {delivery?.stage === 'raw_selection' && <span onClick={(e) => { e.stopPropagation(); toggle(item); }} className={`absolute top-3 right-3 rounded-full px-3 py-2 backdrop-blur text-[10px] font-semibold flex items-center gap-1.5 cursor-pointer ${selected.has(item._id) ? 'bg-gold text-primary' : 'bg-black/55 text-white'}`}>
                  {selected.has(item._id) ? <Check size={12} /> : <Square size={12} />}{selected.has(item._id) ? 'Selected' : 'Select'}
                </span>}
              </button>
            </article>)}
          </div>
        </>}

        {loading && <div className="panel py-20 text-center text-secondary">Loading gallery…</div>}
        {!loading && !media.length && delivery?.stage === 'edited_delivery' && <div className="panel py-24 text-center"><Sparkles size={30} className="text-gold mx-auto mb-3" /><h3 className="font-head text-2xl">No edited files yet</h3><p className="text-sm text-secondary mt-1">Your final files are being prepared. Please check back after the team uploads them.</p></div>}
        {!loading && !media.length && delivery?.stage === 'raw_selection' && <div className="panel py-24 text-center"><Sparkles size={30} className="text-gold mx-auto mb-3" /><h3 className="font-head text-2xl">Your RAW gallery is being prepared</h3><p className="text-sm text-secondary mt-1">The team has not opened RAW selection yet.</p></div>}
      </main>

      {viewer && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={closeViewer}>
        <button onClick={closeViewer} className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><X size={22} /></button>
        <button onClick={(e) => { e.stopPropagation(); previous(); }} className="absolute left-3 sm:left-7 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft size={26} /></button>
        <div className="max-w-7xl w-full max-h-[92vh] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
          {viewer.type === 'video' ? <div className="h-[65vh] w-full flex items-center justify-center text-white/70">Video preview is not available in this viewer.</div> : <img src={`/api/project-media/${viewer._id}/preview`} alt="" className="max-h-[78vh] max-w-full object-contain rounded-xl" />}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {delivery?.stage === 'raw_selection' && <button onClick={() => toggle(viewer)} className={`btn btn-sm ${selected.has(viewer._id) ? 'btn-gold' : 'btn-outline !border-white/25 !text-white'}`}>{selected.has(viewer._id) ? <Check size={14} /> : <Square size={14} />}{selected.has(viewer._id) ? 'Selected' : 'Select image'}</button>}
            {delivery?.stage === 'edited_delivery' && <button onClick={() => downloadOne(viewer)} className="btn btn-outline btn-sm !border-white/25 !text-white"><Download size={14} /> Download</button>}
            <span className="text-xs text-white/40">{viewerIndex + 1} / {visible.length}</span>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 sm:right-7 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight size={26} /></button>
      </div>}
    </div>
  );
}
