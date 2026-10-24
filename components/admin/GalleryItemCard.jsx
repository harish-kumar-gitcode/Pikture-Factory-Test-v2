'use client';
import Link from 'next/link';
import { Star, Images, ExternalLink, Loader2 } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';

/**
 * Fixed-size gallery item card for admin management surfaces.
 * The image box is a strict aspect-[4/3] crop (absolute-positioned fill),
 * so every card is exactly the same size no matter the source image's
 * own dimensions — landscape, portrait, whatever comes in from a vendor.
 *
 * Always shows a "View" link to open the full-size original in a new tab,
 * so the admin can inspect a piece before deciding to approve/feature it.
 * When the item is approved, also shows toggles for featuring it on the
 * homepage and/or the public gallery page.
 */
export default function GalleryItemCard({
  item,
  busyAction, // 'home' | 'gallery' | null — which toggle (if any) is in flight for this card
  onToggleHome,
  onToggleGallery,
  showVendor = true,
  showStatus = false,
}) {
  const canFeature = item.status === 'approved' && !item.deletedByVendor;
  const tone = statusToneMap(item.status);

  return (
    <div className="border border-border rounded-pf overflow-hidden bg-white flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-bglight shrink-0">
        {item.type === 'video' ? (
          <video src={item.url} className="absolute inset-0 w-full h-full object-cover" muted />
        ) : (
          <img src={item.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5">
          {item.deletedByVendor ? (
            <span className="text-[10px] font-bold bg-danger text-white px-2 py-1 rounded-full">Deleted by vendor</span>
          ) : showStatus ? (
            <StatusPill tone={tone.tone}>{tone.label}</StatusPill>
          ) : null}
        </div>

        {(item.featuredHome || item.featuredGallery) && (
          <div className="absolute top-2 right-2 flex gap-1">
            {item.featuredHome && (
              <span title="Live on homepage" className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-gold">
                <Star size={12} fill="currentColor" />
              </span>
            )}
            {item.featuredGallery && (
              <span title="Live on gallery page" className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-gold">
                <Images size={12} />
              </span>
            )}
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        {showVendor && (
          <Link
            href={item.vendor?._id ? `/admin/vendors/${item.vendor._id}` : '#'}
            className="text-[11px] text-secondary mb-2.5 leading-snug hover:text-gold transition-colors"
          >
            <b className="text-primary">{item.vendor ? `${item.vendor.firstName} ${item.vendor.lastName}` : 'Unknown'}</b><br />
            <span className="text-gold font-semibold">{item.vendor?.vendorCode || item.vendorCode}</span> · {item.vendor?.businessName || '—'}
          </Link>
        )}

        <div className="grid gap-1.5 mt-auto">
          <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm !text-xs w-full">
            <ExternalLink size={12} /> View
          </a>

          {canFeature && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onToggleHome(item)}
                disabled={!!busyAction}
                className="btn btn-sm !text-[11px] !px-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={item.featuredHome ? { background: '#fee2e2', color: '#EF4444' } : { background: '#FEF3C7', color: '#B45309' }}
              >
                {busyAction === 'home' ? <Loader2 size={11} className="animate-spin" /> : <Star size={11} />}
                {item.featuredHome ? 'Unfeature' : 'Homepage'}
              </button>
              <button
                onClick={() => onToggleGallery(item)}
                disabled={!!busyAction}
                className="btn btn-sm !text-[11px] !px-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={item.featuredGallery ? { background: '#fee2e2', color: '#EF4444' } : { background: '#FEF3C7', color: '#B45309' }}
              >
                {busyAction === 'gallery' ? <Loader2 size={11} className="animate-spin" /> : <Images size={11} />}
                {item.featuredGallery ? 'Unfeature' : 'Gallery'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
