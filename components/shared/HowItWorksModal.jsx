'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Headphones, X } from 'lucide-react';

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function keyForDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function displayDate(value) {
  if (!value) return 'Select a date';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function calendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days = Array(first.getDay()).fill(null);
  for (let day = 1; day <= total; day += 1) days.push(new Date(month.getFullYear(), month.getMonth(), day));
  return days;
}

const TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

function timeLabel(value) {
  if (!value) return 'Select a time';
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, '0')} ${suffix}`;
}

export default function HowItWorksModal({ open, onClose, role = 'vendor', name = '' }) {
  const today = useMemo(() => startOfToday(), []);
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [form, setForm] = useState({ date: '', time: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setForm({ date: '', time: '', notes: '' });
    setSaving(false);
    setDone(false);
    setError('');
  }, [open, today]);

  const days = useMemo(() => calendarDays(month), [month]);
  const canPrevious = month.getTime() > new Date(today.getFullYear(), today.getMonth(), 1).getTime();

  if (!open) return null;

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.date || !form.time) {
      setError('Please select your preferred date and time.');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit your request.');
      setDone(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] bg-primary/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div className="w-full max-w-4xl h-[92vh] max-h-[92vh] min-h-0 sm:h-[76vh] sm:max-h-[760px] sm:min-h-[560px] rounded-[28px] bg-white shadow-2xl overflow-hidden flex flex-col" onClick={(event) => event.stopPropagation()}>
        <header className="bg-primary text-white px-6 sm:px-9 py-6 relative shrink-0">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          <button type="button" onClick={onClose} className="absolute right-5 top-5 w-10 h-10 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Close">
            <X size={18} />
          </button>
          <div className="relative pr-12">
            <span className="text-[9px] uppercase tracking-[.25em] text-gold font-semibold">Pikture Factory · Partner onboarding</span>
            <h2 className="font-head text-3xl sm:text-4xl mt-2">How it works</h2>
            <p className="text-white/50 text-xs sm:text-sm mt-2 max-w-2xl">A clear workflow from your first assignment through uploads, approvals, finance and delivery.</p>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {done ? (
            <div className="min-h-full flex items-center justify-center p-8">
              <div className="text-center max-w-lg">
                <div className="w-16 h-16 rounded-full bg-green-50 text-success flex items-center justify-center mx-auto mb-5"><CheckCircle2 size={31} /></div>
                <span className="section-kicker">Request received</span>
                <h3 className="font-head text-3xl mt-2">We'll take it from here.</h3>
                <p className="text-sm text-secondary mt-3 leading-6">Thanks{name ? `, ${name}` : ''}. Our team will contact you within <b>6–8 hours</b> around your preferred slot and help you get fully onboarded.</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-6 text-left">
                  <div className="rounded-2xl border border-border bg-bglight p-4"><span className="text-[9px] uppercase tracking-widest text-secondary">Preferred date</span><p className="text-sm font-semibold mt-1">{displayDate(form.date)}</p></div>
                  <div className="rounded-2xl border border-border bg-bglight p-4"><span className="text-[9px] uppercase tracking-widest text-secondary">Preferred time</span><p className="text-sm font-semibold mt-1">{timeLabel(form.time)}</p></div>
                </div>
                <button type="button" onClick={onClose} className="btn btn-primary mt-7">Done</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="p-4 sm:p-7 lg:p-8">
              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                {[
                  ['01', 'Get assigned', 'Receive projects that match your profile.'],
                  ['02', 'Upload & update', 'Keep status, RAW and EDITED work organised.'],
                  ['03', 'Get paid', 'Track project finance and delivery clearly.'],
                ].map(([number, title, text]) => (
                  <div key={number} className="rounded-2xl border border-border bg-bglight p-4">
                    <span className="text-[9px] text-gold font-bold tracking-widest">{number}</span>
                    <b className="block text-sm mt-2">{title}</b>
                    <p className="text-[11px] text-secondary mt-1 leading-5">{text}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-border overflow-hidden">
                <div className="p-5 sm:p-6 bg-bglight border-b border-border flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center shrink-0"><Headphones size={18} /></div>
                  <div><h3 className="font-head text-xl">Book your onboarding call</h3><p className="text-xs text-secondary mt-1">Choose a preferred day and time. Our team will contact you within 6–8 hours.</p></div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid lg:grid-cols-[1.12fr_.88fr] gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div><label className="label mb-1">Preferred date</label><p className="text-[10px] text-secondary">Select a convenient day</p></div>
                        <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center"><CalendarDays size={17} /></div>
                      </div>

                      <div className="rounded-2xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                          <button type="button" disabled={!canPrevious} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="w-8 h-8 rounded-lg hover:bg-bglight disabled:opacity-25 flex items-center justify-center"><ChevronLeft size={16} /></button>
                          <span className="text-sm font-semibold">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="w-8 h-8 rounded-lg hover:bg-bglight flex items-center justify-center"><ChevronRight size={16} /></button>
                        </div>
                        <div className="grid grid-cols-7 px-3 pt-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="text-center text-[8px] uppercase tracking-wider text-secondary font-semibold py-2">{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 px-3 pb-4">
                          {days.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="h-9" />;
                            const key = keyForDate(date);
                            const past = date < today;
                            const selected = form.date === key;
                            const isToday = key === keyForDate(today);
                            return <button key={key} type="button" disabled={past} onClick={() => { setForm({ ...form, date: key }); setError(''); }} className={`h-9 rounded-xl text-xs font-medium transition-all ${past ? 'text-border cursor-not-allowed' : 'hover:bg-gold/10 hover:text-gold'} ${selected ? 'bg-primary text-white hover:bg-primary hover:text-white shadow-sm' : ''} ${isToday && !selected ? 'ring-1 ring-gold/50 text-gold' : ''}`}>{date.getDate()}</button>;
                          })}
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl bg-bglight border border-border px-4 py-3"><span className="text-[9px] uppercase tracking-widest text-secondary">Selected date</span><p className="text-sm font-semibold mt-1">{displayDate(form.date)}</p></div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div><label className="label mb-1">Preferred time</label><p className="text-[10px] text-secondary">Choose an available slot</p></div>
                        <div className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center"><Clock3 size={17} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {TIMES.map((time) => <button key={time} type="button" onClick={() => { setForm({ ...form, time }); setError(''); }} className={`rounded-xl border px-3 py-3 text-xs font-medium text-left transition-all ${form.time === time ? 'border-primary bg-primary text-white shadow-sm' : 'border-border hover:border-gold/50 hover:bg-gold/5'}`}><span>{timeLabel(time)}</span>{form.time === time && <span className="block text-[9px] text-white/50 mt-1">Selected</span>}</button>)}
                      </div>
                      <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3"><span className="text-[9px] uppercase tracking-widest text-gold font-semibold">Your preferred slot</span><p className="text-sm font-semibold mt-1">{form.date ? displayDate(form.date) : 'Date not selected'}</p><p className="text-xs text-secondary mt-1">{form.time ? timeLabel(form.time) : 'Time not selected'}</p></div>
                    </div>
                  </div>

                  <div className="mt-6"><label className="label">Anything you want us to know? <span className="font-normal text-secondary">Optional</span></label><textarea className="input min-h-[75px] resize-y" placeholder="Tell us what you'd like help with..." value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
                  {error && <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5 pt-5 border-t border-border">
                    <p className="text-[10px] text-secondary">We'll contact you within 6–8 hours around your preferred slot.</p>
                    <div className="flex gap-2"><button type="button" onClick={onClose} className="btn btn-outline btn-sm">Cancel</button><button disabled={saving} className="btn btn-gold btn-sm disabled:opacity-60">{saving ? 'Sending...' : 'Request onboarding'}</button></div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
