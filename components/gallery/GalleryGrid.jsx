'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function GalleryGrid({
  category = '',
  limit = null,
  featured = false,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const popupTimer = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    const params = new URLSearchParams();

    if (category) {
      params.set('category', category);
    }

    if (featured) {
      params.set('featured', '1');
    }

    const qs = params.toString() ? `?${params.toString()}` : '';

    setLoading(true);

    fetch(`/api/gallery${qs}`)
      .then((r) => r.json())
      .then((d) => {
        const result = d.items || [];
        setItems(limit ? result.slice(0, limit) : result);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category, limit, featured]);

  function openLightbox(i) {
    setLightboxIndex(i);
    setShowQuotePopup(false);

    clearTimeout(popupTimer.current);

    popupTimer.current = setTimeout(() => {
      setShowQuotePopup(true);
    }, 2800);
  }

  function closeLightbox() {
    setLightboxIndex(null);
    setShowQuotePopup(false);
    clearTimeout(popupTimer.current);
  }

  useEffect(() => {
    if (lightboxIndex === null) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    }

    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex]);

  function navigate(dir) {
    if (!items.length) return;

    setShowQuotePopup(false);
    clearTimeout(popupTimer.current);

    setLightboxIndex((i) => {
      const next = (i + dir + items.length) % items.length;

      popupTimer.current = setTimeout(() => {
        setShowQuotePopup(true);
      }, 2800);

      return next;
    });
  }

  async function submitQuote(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const current = items[lightboxIndex];

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quoteForm,
          galleryItemId: current._id,
        }),
      });

      if (!res.ok) throw new Error();

      showToast(
        'Thanks! Our team will reach out with a quote shortly.',
        'success'
      );

      setShowQuotePopup(false);
      setQuoteForm({
        name: '',
        phone: '',
      });
    } catch {
      showToast(
        'Something went wrong — please try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-xl bg-bglight animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-20 text-secondary">
        <p>
          {featured
            ? 'No featured work selected yet — check back soon.'
            : 'No approved work in this category yet — check back soon.'}
        </p>
      </div>
    );
  }

  const current =
    lightboxIndex !== null ? items[lightboxIndex] : null;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px]">
        {items.map((item, i) => (
          <div
            key={item._id}
            onClick={() => openLightbox(i)}
            className={`relative rounded-xl overflow-hidden cursor-pointer group ${
              i % 5 === 0 ? 'row-span-2' : ''
            }`}
          >
            {item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <img
                src={item.url}
                alt={item.category}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 text-white text-sm font-medium">
              {item.category}
            </div>
          </div>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 bg-primary/95 z-[1100] flex items-center justify-center p-6 md:p-10"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-8 right-8 text-white"
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(-1);
            }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white p-3"
            aria-label="Previous"
          >
            <ChevronLeft size={32} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(1);
            }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white p-3"
            aria-label="Next"
          >
            <ChevronRight size={32} />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-[90vw] max-h-[85vh]"
          >
            {current.type === 'video' ? (
              <video
                src={current.url}
                controls
                autoPlay
                className="max-w-[90vw] max-h-[85vh] rounded-xl"
              />
            ) : (
              <img
                src={current.url}
                alt={current.category}
                className="max-w-[90vw] max-h-[85vh] rounded-xl"
              />
            )}

            {showQuotePopup && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] sm:w-[380px] bg-white rounded-pf shadow-lift p-5 animate-fadeUp">
                <button
                  onClick={() => setShowQuotePopup(false)}
                  className="absolute top-3 right-3 text-secondary"
                >
                  <X size={16} />
                </button>

                <div className="flex items-center gap-2 text-gold text-xs font-semibold mb-2">
                  <Sparkles size={14} />
                  LIKE WHAT YOU SEE?
                </div>

                <h4 className="text-base font-head mb-3">
                  Get a free quote for a shoot like this
                </h4>

                <form
                  onSubmit={submitQuote}
                  className="grid gap-2.5"
                >
                  <input
                    required
                    placeholder="Your Name"
                    className="input !py-2.5 !text-sm"
                    value={quoteForm.name}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        name: e.target.value,
                      })
                    }
                  />

                  <input
                    required
                    placeholder="Phone Number"
                    className="input !py-2.5 !text-sm"
                    value={quoteForm.phone}
                    onChange={(e) =>
                      setQuoteForm({
                        ...quoteForm,
                        phone: e.target.value,
                      })
                    }
                  />

                  <button
                    disabled={submitting}
                    className="btn btn-gold btn-sm w-full"
                  >
                    {submitting
                      ? 'Sending...'
                      : 'Get Free Quote'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}