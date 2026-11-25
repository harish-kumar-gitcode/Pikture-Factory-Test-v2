'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Send, X, PhoneCall, ArrowUpRight } from 'lucide-react';

const WHATSAPP_NUMBER = '917204339503';

export default function SupportWidget({ role = 'vendor', name = '', code = '' }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const openSupport = () => setOpen(true);
    window.addEventListener('pf-open-support', openSupport);
    return () => window.removeEventListener('pf-open-support', openSupport);
  }, []);

  function sendWhatsApp(event) {
    event.preventDefault();
    const clean = message.trim();
    if (!clean) return;

    const context = name ? `Hi Pikture Factory, this is ${name}.` : 'Hi Pikture Factory,';
    const identifier = code ? `\nVendor ID: ${code}` : '';
    const roleLabel = role === 'admin' ? 'Admin' : role === 'client' ? 'Client' : 'Vendor';
    const text = `${context}${identifier}\nI need help with my ${roleLabel.toLowerCase()} workspace.\n\n${clean}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setMessage('');
    setOpen(false);
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/20 lg:bg-transparent" onClick={() => setOpen(false)} />
      )}

      <div className="fixed right-3 sm:right-5 bottom-3 sm:bottom-5 z-[100] w-[calc(100vw-1.5rem)] sm:w-[min(380px,calc(100vw-2rem))]">
        {open && (
          <div className="mb-3 rounded-[24px] border border-border bg-white shadow-2xl overflow-hidden">
            <div className="bg-primary text-white px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-[.22em] text-gold font-semibold">Pikture Factory Support</span>
                <h3 className="font-head text-xl mt-1">How can we help?</h3>
                <p className="text-[11px] text-white/50 mt-1">Send a message directly to our team on WhatsApp.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0" aria-label="Close help">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={sendWhatsApp} className="p-4 sm:p-5">
              <div className="rounded-2xl bg-bglight border border-border p-3 mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <MessageCircle size={15} className="text-gold" />
                  WhatsApp support
                </div>
                <p className="text-[10px] text-secondary mt-1">Tell us what you need and we'll take it from there.</p>
              </div>

              <textarea
                autoFocus
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="input min-h-[115px] resize-none"
                placeholder="Type your message here..."
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                <a href="tel:+917204339503" className="text-xs font-semibold text-secondary hover:text-primary inline-flex items-center gap-1.5">
                  <PhoneCall size={13} /> Call support
                </a>
                <button type="submit" className="btn btn-gold btn-sm">
                  <Send size={13} /> Send on WhatsApp
                </button>
              </div>
            </form>

            <div className="px-5 pb-4">
              {role === 'client' && (
                <a href="/client/support" className="text-[10px] text-secondary hover:text-primary inline-flex items-center gap-1">
                  Prefer a support ticket? Open support <ArrowUpRight size={11} />
                </a>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`ml-auto flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-lift transition-all ${open ? 'bg-primary text-white' : 'bg-[#25D366] text-white hover:-translate-y-0.5'}`}
          aria-label={open ? 'Close help' : 'Get help'}
        >
          {open ? <X size={16} /> : <MessageCircle size={17} />}
          {open ? 'Close' : 'Need help?'}
        </button>
      </div>
    </>
  );
}
