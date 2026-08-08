'use client';
import { useEffect, useRef, useState } from 'react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { Star, Trash2, UploadCloud } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function VendorPortfolioPage() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const showToast = useToast();

  function load() {
    fetch('/api/vendor/gallery').then((r) => r.json()).then((d) => setItems(d.items || []));
  }
  useEffect(load, []);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    let ok = 0;
    try {
      for (const [index, file] of files.entries()) {
        const data = await uploadToCloudinary(file, {
          folder: 'pikture-factory/portfolio-uploads',
          onProgress: (percent) => setUploadProgress(Math.round(((index + percent / 100) / files.length) * 100)),
        });
        const submitRes = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.secure_url, publicId: data.public_id, type: data.resource_type }),
        });
        if (submitRes.ok) ok += 1;
      }
    } catch (error) {
      showToast(error.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
    if (ok) showToast(`${ok} upload${ok > 1 ? 's' : ''} sent for admin approval.`, 'success');
    load();
  }

  async function removeItem(id) {
    if (!confirm('Remove this from your portfolio? The admin will still be able to see it, marked as deleted.')) return;
    await fetch(`/api/vendor/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    });
    showToast('Removed from your portfolio.', 'success');
    load();
  }

  const visible = items.filter((i) => !i.deletedByVendor);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl">Your Portfolio</h1>
        <p className="text-sm text-secondary mt-0.5">Showcase your best work to get noticed — every upload goes to the admin for approval before it can appear on the website.</p>
      </div>

      <div className="panel mb-6">
        <h3 className="text-lg font-head mb-1">Upload Your Best Work</h3>
        <p className="text-xs text-secondary mb-4">This doesn't need to be tied to a client project — showcase anything that represents you well. Submitted for admin approval before it goes live.</p>
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-pf p-8 text-center cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors">
          <UploadCloud size={26} className="text-gold mx-auto mb-2" />
          <p className="text-sm font-medium">{uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload photos / videos'}</p>
          {uploading && <div className="h-1.5 bg-border rounded-full overflow-hidden mt-3"><div className="h-full bg-gold transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
          <input ref={fileRef} type="file" hidden multiple accept="image/*,video/*" onChange={handleUpload} />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {visible.map((item) => {
          const t = statusToneMap(item.status);
          return (
            <div key={item._id} className="border border-border rounded-pf overflow-hidden bg-white">
              <div className="aspect-square bg-bglight">
                {item.type === 'video'
                  ? <video src={item.url} className="w-full h-full object-cover" />
                  : <img src={item.url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-secondary truncate">{item.category || 'Uncategorised'}</span>
                  <StatusPill tone={t.tone}>{t.label}</StatusPill>
                </div>
                {item.featuredHome && (
                  <div className="text-[10px] font-bold text-gold flex items-center gap-1 mb-2"><Star size={11} fill="currentColor" /> Live on Homepage</div>
                )}
                <button onClick={() => removeItem(item._id)} className="btn btn-outline btn-sm w-full !text-xs" style={{ color: '#EF4444', borderColor: '#fecaca' }}>
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          );
        })}
        {!visible.length && <p className="text-secondary text-sm py-16 text-center col-span-4">No uploads yet — use the box above to submit your first piece.</p>}
      </div>
    </>
  );
}
