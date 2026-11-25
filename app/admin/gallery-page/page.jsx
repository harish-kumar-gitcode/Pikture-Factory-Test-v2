'use client';
import { useEffect, useState } from 'react';
import AdminTopbar from '@/components/admin/Topbar';
import GalleryItemCard from '@/components/admin/GalleryItemCard';
import { useToast } from '@/components/ui/Toast';
import { Search, Images, ImageOff } from 'lucide-react';

export default function AdminGalleryPageCuration() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // { id, action }
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

  async function toggle(item, field, action) {
    if (busy) return;
    setBusy({ id: item._id, action });
    try {
      const res = await fetch(`/api/gallery/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        showToast(item[field] ? 'Removed.' : 'Updated.', 'success');
        setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, [field]: !i[field] } : i)));
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setBusy(null);
    }
  }

  const toggleHome = (item) => toggle(item, 'featuredHome', item.featuredHome ? 'unfeature' : 'feature');
  const toggleGallery = (item) => toggle(item, 'featuredGallery', item.featuredGallery ? 'unfeatureGallery' : 'featureGallery');

  const live = items.filter((i) => i.featuredGallery && !i.deletedByVendor);
  const notLive = items.filter((i) => !i.featuredGallery && !i.deletedByVendor);

  return (
    <>
      <AdminTopbar title="Gallery Page" subtitle="Approved work from every vendor — pick what shows on the public gallery page, from one place." />

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
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-pf bg-bglight animate-pulse" />)}
          </div>
        ) : !items.length ? (
          <div className="text-center py-16 text-secondary">
            <ImageOff size={28} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No approved uploads match your search.</p>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h3 className="text-lg font-head mb-1 flex items-center gap-2"><Images size={16} className="text-gold" /> Live on Gallery Page</h3>
              <p className="text-xs text-secondary mb-5">{live.length} asset{live.length === 1 ? '' : 's'} currently showing on /gallery.</p>
              {live.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {live.map((item) => (
                    <GalleryItemCard
                      key={item._id}
                      item={item}
                      busyAction={busy?.id === item._id ? (busy.action.includes('Gallery') ? 'gallery' : 'home') : null}
                      onToggleHome={toggleHome}
                      onToggleGallery={toggleGallery}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary bg-bglight rounded-xl p-5 text-center">Nothing added yet — pick some pieces from below.</p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-head mb-1">Approved · Not on Gallery Page</h3>
              <p className="text-xs text-secondary mb-5">{notLive.length} approved piece{notLive.length === 1 ? '' : 's'} not currently on the gallery page.</p>
              {notLive.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {notLive.map((item) => (
                    <GalleryItemCard
                      key={item._id}
                      item={item}
                      busyAction={busy?.id === item._id ? (busy.action.includes('Gallery') ? 'gallery' : 'home') : null}
                      onToggleHome={toggleHome}
                      onToggleGallery={toggleGallery}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary bg-bglight rounded-xl p-5 text-center">Everything approved is already on the gallery page.</p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
