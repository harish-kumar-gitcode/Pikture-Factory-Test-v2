'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import { useToast } from '@/components/ui/Toast';
import { Search, Star, ExternalLink, Loader2, ImageOff } from 'lucide-react';

function GalleryCard({ item, busy, onToggleFeature }) {
  return (
    <div className="border border-border rounded-pf overflow-hidden bg-white flex flex-col">
      <div className="aspect-[4/3] bg-bglight relative shrink-0">
        {item.type === 'video'
          ? <video src={item.url} className="w-full h-full object-cover" controls />
          : <img src={item.url} alt="" className="w-full h-full object-cover" />}
        {item.deletedByVendor && (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-danger text-white px-2 py-1 rounded-full">Deleted by vendor</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <Link
          href={item.vendor?._id ? `/admin/vendors/${item.vendor._id}` : '#'}
          className="text-xs text-secondary mb-3 leading-relaxed hover:text-gold transition-colors"
        >
          Vendor: <b className="text-primary">{item.vendor ? `${item.vendor.firstName} ${item.vendor.lastName}` : 'Unknown'}</b><br />
          <span className="text-gold font-semibold">{item.vendor?.vendorCode || item.vendorCode}</span> · {item.vendor?.businessName || '—'}
        </Link>
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm !text-xs">
            <ExternalLink size={12} /> View
          </a>
          <button
            onClick={() => onToggleFeature(item)}
            disabled={busy || item.deletedByVendor}
            className="btn btn-sm !text-xs disabled:opacity-60 disabled:cursor-not-allowed"
            style={item.featuredHome ? { background: '#fee2e2', color: '#EF4444' } : { background: '#FEF3C7', color: '#B45309' }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
            {busy ? 'Wait...' : item.featuredHome ? 'Unfeature' : 'Feature'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorGalleryPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const showToast = useToast();

  function load() {
    setLoading(true);
    const qs = new URLSearchParams({ admin: '1', status: 'approved' });
    if (search) qs.set('search', search);
    fetch(`/api/gallery?${qs}`).then((r) => r.json()).then((d) => setItems(d.items || [])).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function toggleFeatured(item) {
    if (processingId) return;
    setProcessingId(item._id);
    try {
      const res = await fetch(`/api/gallery/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: item.featuredHome ? 'unfeature' : 'feature' }),
      });
      if (res.ok) {
        showToast(item.featuredHome ? 'Removed from homepage.' : 'Now showing on the homepage.', 'success');
        setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, featuredHome: !i.featuredHome } : i)));
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setProcessingId(null);
    }
  }

  const live = items.filter((i) => i.featuredHome && !i.deletedByVendor);
  const notLive = items.filter((i) => !i.featuredHome && !i.deletedByVendor);

  return (
    <>
      <AdminTopbar title="Homepage Gallery" subtitle="Approved work from every vendor — pick what shows on the homepage, from one place." />

      <div className="panel">
        <div className="flex items-center gap-2 bg-bglight border border-border rounded-full px-4 py-2.5 mb-8 max-w-md">
          <Search size={16} className="text-secondary shrink-0" />
          <input
            className="bg-transparent outline-none text-sm flex-1 min-w-0"
            placeholder="Search by vendor code or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-pf bg-bglight animate-pulse" />)}
          </div>
        ) : !items.length ? (
          <div className="text-center py-16 text-secondary">
            <ImageOff size={28} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No approved uploads match your search.</p>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h3 className="text-lg font-head mb-1 flex items-center gap-2"><Star size={16} className="text-gold" fill="currentColor" /> Live on Homepage</h3>
              <p className="text-xs text-secondary mb-5">{live.length} asset{live.length === 1 ? '' : 's'} currently showing to visitors.</p>
              {live.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {live.map((item) => (
                    <GalleryCard key={item._id} item={item} busy={processingId === item._id} onToggleFeature={toggleFeatured} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary bg-bglight rounded-xl p-5 text-center">Nothing featured yet — pick some pieces from below.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-head mb-1">Approved · Not Live</h3>
              <p className="text-xs text-secondary mb-5">{notLive.length} approved piece{notLive.length === 1 ? '' : 's'} not currently on the homepage.</p>
              {notLive.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {notLive.map((item) => (
                    <GalleryCard key={item._id} item={item} busy={processingId === item._id} onToggleFeature={toggleFeatured} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary bg-bglight rounded-xl p-5 text-center">Everything approved is already live.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
