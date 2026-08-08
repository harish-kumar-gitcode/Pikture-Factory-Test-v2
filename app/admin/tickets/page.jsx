'use client';
import { useEffect, useState } from 'react';
import AdminTopbar from '@/components/admin/Topbar';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

const STATUSES = ['open', 'in_progress', 'follow_up', 'closed'];

export default function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  function load() {
    fetch('/api/tickets').then((r) => r.json()).then((d) => setTickets(d.tickets || []));
  }
  useEffect(load, []);

  async function submitReply(status) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch(`/api/tickets/${active._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply, status: status || active.status }),
      });
      showToast('Reply sent to client.', 'success');
      setReply('');
      setActive(null);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  const hasOpen = tickets.some((t) => t.status === 'open');

  return (
    <>
      <AdminTopbar title="Support Tickets" subtitle="Client requests and issues." hasNotification={hasOpen} />

      <div className="panel">
        <div className="grid gap-3">
          {tickets.map((t) => {
            const st = statusToneMap(t.status);
            return (
              <button key={t._id} onClick={() => setActive(t)} className="text-left border border-border rounded-xl p-4 flex items-center justify-between gap-3 hover:border-gold transition-colors relative">
                {t.status === 'open' && <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-danger rounded-full" />}
                <div className="pl-3 min-w-0">
                  <b className="block text-sm truncate">{t.subject}</b>
                  <span className="text-xs text-secondary block truncate">{t.client?.name} ({t.client?.clientCode}) · {t.message.slice(0, 60)}...</span>
                </div>
                <StatusPill tone={st.tone}>{st.label}</StatusPill>
              </button>
            );
          })}
          {!tickets.length && <p className="text-sm text-secondary text-center py-10">No support tickets.</p>}
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.subject}>
        {active && (
          <div className="grid gap-4">
            <div className="bg-bglight rounded-xl p-4 text-sm"><b>{active.client?.name}:</b> {active.message}</div>

            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {active.replies?.map((r, i) => (
                <div key={i} className="bg-primary/5 rounded-xl p-3 text-sm"><b>{r.author}:</b> {r.message}</div>
              ))}
            </div>

            <div>
              <label className="label">Reply</label>
              <textarea className="input" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." />
            </div>

            <div>
              <label className="label">Update Status</label>
              <div className="flex gap-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button key={s} disabled={submitting} onClick={() => submitReply(s)} className={`px-4 py-2 rounded-full text-xs font-semibold border disabled:opacity-60 disabled:cursor-not-allowed ${active.status === s ? 'bg-primary text-white border-primary' : 'border-border'}`}>
                    {statusToneMap(s).label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => submitReply()} disabled={submitting} className="btn btn-primary disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Sending...' : 'Send Reply'}</button>
          </div>
        )}
      </Modal>
    </>
  );
}
