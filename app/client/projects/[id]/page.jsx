'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, StickyNote, Send, Images, Download, Check, Square, Video, FolderOpen, Sparkles, ExternalLink } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';

function formatTime(d) { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmtBytes(value) { if (!value) return ''; const units=['B','KB','MB','GB']; let n=Number(value),i=0; while(n>=1024&&i<units.length-1){n/=1024;i++;} return `${n.toFixed(i?1:0)} ${units[i]}`; }

export default function ClientProjectDetailPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [media, setMedia] = useState([]);
  const [album, setAlbum] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [notFound, setNotFound] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function load() {
    const [projectRes, mediaRes] = await Promise.all([fetch(`/api/projects/${id}`), fetch(`/api/projects/${id}/media`)]);
    if (!projectRes.ok) { setNotFound(true); return; }
    setProject((await projectRes.json()).project);
    if (mediaRes.ok) setMedia((await mediaRes.json()).media || []);
  }
  useEffect(() => { load(); }, [id]);

  async function sendNote() {
    if (!noteText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: noteText.trim() }) });
      if (res.ok) { showToast('Sent — our team will see this.', 'success'); setNoteText(''); load(); }
      else showToast('Something went wrong — please try again.', 'error');
    } finally { setSending(false); }
  }

  const albums = useMemo(() => ['All', ...Array.from(new Set(media.map((m) => m.album || 'Unsorted')))], [media]);
  const visible = media.filter((m) => album === 'All' || (m.album || 'Unsorted') === album);

  function toggle(id) { setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function selectVisible() { setSelected((prev) => new Set([...prev, ...visible.map((m) => m._id)])); }
  function clearVisible() { setSelected((prev) => { const n = new Set(prev); visible.forEach((m) => n.delete(m._id)); return n; }); }

  async function downloadOne(item) {
    const a = document.createElement('a');
    a.href = `/api/project-media/${item._id}/download`;
    a.download = item.name;
    a.target = '_blank';
    a.rel = 'noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  async function downloadSelected() {
    const items = media.filter((m) => selected.has(m._id));
    if (!items.length || downloading) return;
    setDownloading(true);
    try {
      for (const item of items) await downloadOne(item);
      showToast(`${items.length} ${items.length === 1 ? 'file' : 'files'} downloaded.`, 'success');
      setSelected(new Set());
    } catch { showToast('One or more files could not be downloaded.', 'error'); }
    finally { setDownloading(false); }
  }

  if (notFound) return <p className="text-secondary">Project not found.</p>;
  if (!project) return <div className="text-secondary">Loading...</div>;
  const t = statusToneMap(project.status);
  const notes = [...(project.notes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-7">
      <Link href="/client/dashboard" className="text-sm text-secondary flex items-center gap-1.5"><ArrowLeft size={14} /> Back to My Projects</Link>

      <div className="rounded-[26px] overflow-hidden bg-primary text-white p-7 sm:p-10 relative">
        <div className="absolute -right-20 -top-24 w-80 h-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative flex items-end justify-between gap-6 flex-wrap">
          <div><span className="text-gold text-[11px] uppercase tracking-[.22em] font-semibold">Your private gallery</span><h1 className="font-head text-3xl sm:text-5xl mt-2">{project.eventType || 'Event'}</h1><p className="text-white/60 text-sm mt-2">{project.eventDate ? new Date(project.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Date TBD'} · {project.location}</p><p className="text-white/45 text-xs mt-1">{project.projectCode}</p></div>
          <StatusPill tone={t.tone}>{t.label}</StatusPill>
        </div>
      </div>

      <section className="rounded-[26px] bg-white border border-border overflow-hidden shadow-soft">
        <div className="p-6 sm:p-7 border-b border-border"><div className="flex items-center justify-between gap-4 flex-wrap"><div><div className="flex items-center gap-2"><Images size={18} className="text-gold" /><h2 className="font-head text-2xl">Your Memories</h2></div><p className="text-xs text-secondary mt-1">The images selected by our team are ready for you. Open the clean gallery in a new tab to browse, select and download.</p></div><div className="flex gap-2 flex-wrap"><Link href={`/client/projects/${id}/gallery`} target="_blank" className="btn btn-primary btn-sm"><ExternalLink size={13} /> Open Gallery</Link><button onClick={selectVisible} className="btn btn-outline btn-sm">Select view</button><button onClick={clearVisible} className="btn btn-outline btn-sm">Clear view</button><button onClick={downloadSelected} disabled={!selected.size || downloading} className="btn btn-gold btn-sm disabled:opacity-50"><Download size={13} /> {downloading ? 'Preparing…' : `Download${selected.size ? ` (${selected.size})` : ''}`}</button></div></div></div>
        {media.length ? <>
          <div className="px-6 sm:px-7 pt-5 flex gap-2 overflow-x-auto">{albums.map((a) => <button key={a} onClick={() => setAlbum(a)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold border ${album === a ? 'bg-primary text-white border-primary' : 'border-border text-secondary hover:border-gold'}`}><FolderOpen size={12} className="inline mr-1.5" />{a}</button>)}</div>
          <div className="p-6 sm:p-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visible.map((item) => <div key={item._id} className={`group rounded-2xl overflow-hidden border transition-all ${selected.has(item._id) ? 'border-gold shadow-soft' : 'border-border'}`}>
              <div className="aspect-[4/3] bg-primary relative overflow-hidden">
                <button type="button" onClick={() => window.open(`/client/projects/${id}/gallery#media=${item._id}`, '_blank', 'noopener,noreferrer')} className="absolute inset-0 z-0">
                  {item.type === 'video' ? <div className="w-full h-full flex flex-col items-center justify-center text-white"><Video size={42} className="text-gold mb-2" /><span className="text-xs text-white/60">Video</span></div> : <img loading="lazy" src={`/api/project-media/${item._id}/preview`} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/55 backdrop-blur text-white px-3 py-2 text-[10px] opacity-0 group-hover:opacity-100">Open in gallery</span>
                </button>
                <button onClick={() => toggle(item._id)} className={`absolute z-10 top-3 right-3 rounded-full px-3 py-2 backdrop-blur text-[10px] font-semibold flex items-center gap-1.5 ${selected.has(item._id) ? 'bg-gold text-primary' : 'bg-black/55 text-white'}`}>{selected.has(item._id) ? <Check size={12} /> : <Square size={12} />}{selected.has(item._id) ? 'Selected' : 'Select'}</button>
              </div>
              <div className="p-4 flex items-center justify-between text-[11px] text-secondary"><span>{fmtBytes(item.size)}</span><button onClick={() => downloadOne(item).catch(() => showToast('Download unavailable.', 'error'))} className="text-primary font-semibold hover:text-gold flex items-center gap-1"><Download size={12} /> Download</button></div>
            </div>)}
          </div>
        </> : <div className="py-20 text-center px-6"><Sparkles size={30} className="text-gold mx-auto mb-3" /><h3 className="font-head text-xl">Your gallery is being prepared</h3><p className="text-sm text-secondary mt-1">Our team will make the best photographs available here once your event media is ready.</p></div>}
      </section>

      <div className="panel"><h3 className="text-lg font-head mb-4">Charges</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"><div className="bg-bglight rounded-xl p-4"><span className="text-xs text-secondary block mb-1">Total</span><b className="text-lg">₹{project.amountTotal?.toLocaleString('en-IN')}</b></div><div className="bg-bglight rounded-xl p-4"><span className="text-xs text-secondary block mb-1">Paid</span><b className="text-lg text-success">₹{project.amountPaidByClient?.toLocaleString('en-IN')}</b></div><div className="bg-bglight rounded-xl p-4"><span className="text-xs text-secondary block mb-1">Pending</span><b className="text-lg text-warning">₹{project.amountPendingClient?.toLocaleString('en-IN')}</b></div></div></div>

      <div className="panel"><h3 className="text-lg font-head mb-1 flex items-center gap-2"><StickyNote size={17} className="text-gold" /> Updates &amp; Notes</h3><p className="text-xs text-secondary mb-4">Message our team about this project — they'll see it right away.</p><div className="flex gap-2 mb-6"><input className="input flex-1" placeholder="Write a note for Pikture Factory..." value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendNote()} /><button onClick={sendNote} disabled={sending} className="btn btn-primary btn-sm shrink-0"><Send size={14} /> {sending ? 'Sending...' : 'Send'}</button></div><div className="grid gap-3">{notes.map((n, i) => <div key={n._id || i} className="bg-bglight rounded-xl p-4 text-sm">{n.field && <div className="text-xs text-gold font-semibold mb-1">{n.field.replace('amountTotal','Total').replace('amountPaidByClient','Amount Paid').replace('amountPendingClient','Amount Pending')}: ₹{n.oldValue} → ₹{n.newValue}</div>}<p>{n.text}</p><div className="flex justify-between mt-2 text-xs text-secondary"><span>{n.author}</span><span>{formatTime(n.createdAt)}</span></div></div>)}{!notes.length && <p className="text-sm text-secondary">No updates yet.</p>}</div></div>
    </div>
  );
}
