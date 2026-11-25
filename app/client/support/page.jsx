'use client';
import { useEffect, useState } from 'react';
import { LifeBuoy, Send, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', follow_up: 'Follow-up', closed: 'Closed' };
const STATUS_TONE = { open: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', follow_up: 'bg-purple-100 text-purple-700', closed: 'bg-green-100 text-green-700' };

export default function ClientSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', message: '', priority: 'Low' });
  const [submitting, setSubmitting] = useState(false);
  const showToast = useToast();

  function load() {
    fetch('/api/tickets').then((r) => r.json()).then((d) => setTickets(d.tickets || [])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function submitTicket(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast('Ticket raised — our team will get back to you.', 'success');
        setForm({ subject: '', message: '', priority: 'Low' });
        setFormOpen(false);
        load();
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl flex items-center gap-2"><LifeBuoy size={22} className="text-gold" /> Support</h1>
          <p className="text-sm text-secondary mt-0.5">Raise a ticket and we'll get back to you here.</p>
        </div>
        <button onClick={() => setFormOpen((o) => !o)} className="btn btn-primary btn-sm">
          {formOpen ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Raise a Ticket</>}
        </button>
      </div>

      {formOpen && (
        <div className="panel mb-6">
          <h3 className="text-lg font-head mb-4">New Support Ticket</h3>
          <form onSubmit={submitTicket} className="grid gap-4">
            <div><label className="label">Subject</label><input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" /></div>
            <div><label className="label">Message</label><textarea required className="input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us more..." /></div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <button disabled={submitting} className="btn btn-primary w-fit disabled:opacity-60 disabled:cursor-not-allowed">
              <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </form>
        </div>
      )}

      <div className="panel">
        <h3 className="text-lg font-head mb-5">Your Tickets</h3>
        {loading && <p className="text-sm text-secondary text-center py-8">Loading...</p>}
        <div className="grid gap-4">
          {tickets.map((t) => (
            <div key={t._id} className="border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <div>
                  <b className="block text-sm">{t.subject}</b>
                  <span className="text-xs text-secondary">{formatTime(t.createdAt)} · Priority: {t.priority}</span>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_TONE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
              </div>
              <p className="text-sm text-secondary mb-3">{t.message}</p>
              {t.replies?.length > 0 && (
                <div className="grid gap-2 mt-3 pt-3 border-t border-border">
                  {t.replies.map((r, i) => (
                    <div key={r._id || i} className="bg-bglight rounded-lg p-3 text-sm">
                      <p>{r.message}</p>
                      <div className="flex justify-between mt-1.5 text-xs text-secondary">
                        <span>{r.author}</span>
                        <span>{formatTime(r.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!loading && !tickets.length && <p className="text-sm text-secondary text-center py-10">No tickets yet — raise one if you need help.</p>}
        </div>
      </div>
    </>
  );
}
