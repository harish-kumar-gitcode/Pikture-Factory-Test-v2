'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, StickyNote, Send } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ClientProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [sending, setSending] = useState(false);
  const showToast = useToast();

  function load() {
    fetch(`/api/projects/${id}`).then(async (r) => {
      if (!r.ok) { setNotFound(true); return; }
      const d = await r.json();
      setProject(d.project);
    });
  }
  useEffect(load, [id]);

  async function sendNote() {
    if (!noteText.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      if (res.ok) {
        showToast('Sent — our team will see this.', 'success');
        setNoteText('');
        load();
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setSending(false);
    }
  }

  if (notFound) return <p className="text-secondary">Project not found.</p>;
  if (!project) return <div className="text-secondary">Loading...</div>;

  const t = statusToneMap(project.status);
  const notes = [...(project.notes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <>
      <Link href="/client/dashboard" className="text-sm text-secondary flex items-center gap-1.5 mb-3"><ArrowLeft size={14} /> Back to My Projects</Link>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">{project.projectCode} — {project.eventType}</h1>
          <span className="text-sm text-secondary">{project.eventDate ? new Date(project.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · {project.location}</span>
          {project.vendor?.businessName && <span className="text-sm text-secondary block">Photographer: {project.vendor.businessName}</span>}
        </div>
        <StatusPill tone={t.tone}>{t.label}</StatusPill>
      </div>

      <div className="panel mb-6">
        <h3 className="text-lg font-head mb-4">Charges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-bglight rounded-lg p-4"><span className="text-xs text-secondary block mb-1">Total</span><b className="text-lg">₹{project.amountTotal?.toLocaleString('en-IN')}</b></div>
          <div className="bg-bglight rounded-lg p-4"><span className="text-xs text-secondary block mb-1">Paid</span><b className="text-lg text-success">₹{project.amountPaidByClient?.toLocaleString('en-IN')}</b></div>
          <div className="bg-bglight rounded-lg p-4"><span className="text-xs text-secondary block mb-1">Pending</span><b className="text-lg text-warning">₹{project.amountPendingClient?.toLocaleString('en-IN')}</b></div>
        </div>
      </div>

      <div className="panel">
        <h3 className="text-lg font-head mb-1 flex items-center gap-2"><StickyNote size={17} className="text-gold" /> Updates &amp; Notes</h3>
        <p className="text-xs text-secondary mb-4">Message our team about this project — they'll see it right away.</p>
        <div className="flex gap-2 mb-6">
          <input
            className="input flex-1"
            placeholder="Write a note for Pikture Factory..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendNote()}
          />
          <button onClick={sendNote} disabled={sending} className="btn btn-primary btn-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
            <Send size={14} /> {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="grid gap-3">
          {notes.map((n, i) => (
            <div key={n._id || i} className="bg-bglight rounded-xl p-4 text-sm">
              {n.field && (
                <div className="text-xs text-gold font-semibold mb-1">{n.field.replace('amountTotal', 'Total').replace('amountPaidByClient', 'Amount Paid').replace('amountPendingClient', 'Amount Pending')}: ₹{n.oldValue} → ₹{n.newValue}</div>
              )}
              <p>{n.text}</p>
              <div className="flex justify-between mt-2 text-xs text-secondary">
                <span>{n.author}</span>
                <span>{formatTime(n.createdAt)}</span>
              </div>
            </div>
          ))}
          {!notes.length && <p className="text-sm text-secondary">No updates yet.</p>}
        </div>
      </div>
    </>
  );
}

