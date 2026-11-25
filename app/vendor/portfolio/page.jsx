'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { ArrowUpRight, CheckCircle2, Clock3, Images, Star, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function VendorPortfolioPage() {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef(null);
  const showToast = useToast();

  const load = async () => {
    try {
      const response = await fetch('/api/vendor/gallery');
      const data = await response.json();
      setItems(data.items || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(
    () => items.filter((item) => !item.deletedByVendor),
    [items]
  );

  const approved = visible.filter((item) => item.status === 'approved').length;
  const pending = visible.filter((item) => item.status === 'pending').length;
  const rejected = visible.filter((item) => item.status === 'rejected').length;

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const invalidType = files.find(
      (file) => !file.type.startsWith('image/') && !file.type.startsWith('video/')
    );

    if (invalidType) {
      showToast('Please choose an image or video file.', 'error');
      event.target.value = '';
      return;
    }

    const oversized = files.find(
      (file) =>
        (file.type.startsWith('image/') && file.size > 10 * 1024 * 1024) ||
        (file.type.startsWith('video/') && file.size > 200 * 1024 * 1024)
    );

    if (oversized) {
      showToast(
        oversized.type.startsWith('video/')
          ? 'File size too large. Videos are limited to 200MB.'
          : 'File size too large. Images are limited to 10MB.',
        'error'
      );
      event.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    let successCount = 0;

    try {
      for (const [index, file] of files.entries()) {
        const data = await uploadToCloudinary(file, {
          folder: 'pikture-factory/portfolio-uploads',
          onProgress: (progress) => {
            setUploadProgress(
              Math.round(((index + progress / 100) / files.length) * 100)
            );
          },
        });

        const response = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: data.secure_url,
            publicId: data.public_id,
            type: data.resource_type,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Unable to save the portfolio submission.');
        }

        successCount += 1;
      }
    } catch (error) {
      showToast(error.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = '';
      await load();
    }

    if (successCount) {
      showToast(
        `${successCount} upload${successCount > 1 ? 's' : ''} sent for admin approval.`,
        'success'
      );
    }
  }

  async function removeItem(id) {
    const confirmed = window.confirm(
      'Remove this from your portfolio? The admin will still be able to see it, marked as deleted.'
    );

    if (!confirmed) return;

    const response = await fetch(`/api/vendor/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    });

    if (!response.ok) {
      showToast('Unable to remove this portfolio item.', 'error');
      return;
    }

    showToast('Removed from your portfolio.', 'success');
    load();
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
        <div>
          <span className="section-kicker">Brand presence</span>
          <h1 className="font-head text-3xl sm:text-4xl mt-1">Your portfolio</h1>
          <p className="text-sm text-secondary mt-2 max-w-2xl">
            A professional showcase of your work. Submissions are reviewed by Pikture Factory before appearing on the public website.
          </p>
        </div>

        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-gold">
          <UploadCloud size={17} />
          Add work
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <Images size={17} className="text-gold" />
          <b className="font-head text-2xl block mt-4">{visible.length}</b>
          <span className="text-xs text-secondary">Total submissions</span>
        </div>
        <div className="metric-card">
          <CheckCircle2 size={17} className="text-success" />
          <b className="font-head text-2xl block mt-4">{approved}</b>
          <span className="text-xs text-secondary">Approved</span>
        </div>
        <div className="metric-card">
          <Clock3 size={17} className="text-warning" />
          <b className="font-head text-2xl block mt-4">{pending}</b>
          <span className="text-xs text-secondary">Under review</span>
        </div>
        <div className="metric-card">
          <XCircle size={17} className="text-danger" />
          <b className="font-head text-2xl block mt-4">{rejected}</b>
          <span className="text-xs text-secondary">Needs attention</span>
        </div>
      </div>

      <section className="panel !p-0 overflow-hidden">
        <div className="p-6 sm:p-7 bg-primary text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <span className="section-kicker">Upload studio</span>
              <h2 className="font-head text-2xl sm:text-3xl mt-2">Keep your best work current.</h2>
              <p className="text-white/50 text-xs sm:text-sm mt-2 max-w-xl">
                Images up to 10MB and videos up to 200MB are supported for portfolio submissions. Larger project RAW/EDITED files belong in the dedicated Drive workspace.
              </p>
            </div>
            <div className="rounded-2xl bg-white/[.07] border border-white/10 p-4 min-w-[230px]">
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Submission status</span>
                <span>{uploading ? `${uploadProgress}%` : 'Ready'}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden mt-3">
                <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${uploading ? uploadProgress : 100}%` }} />
              </div>
              <p className="text-[10px] text-white/35 mt-2">Admin approval keeps the public gallery curated.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-2xl py-10 text-center cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors"
          >
            <UploadCloud size={28} className="text-gold mx-auto mb-3" />
            <p className="text-sm font-semibold">
              {uploading ? `Uploading... ${uploadProgress}%` : 'Drop in your next hero image or film'}
            </p>
            <p className="text-xs text-secondary mt-1">Click to browse · Images 10MB max · Videos 200MB max</p>
            {uploading && (
              <div className="max-w-md mx-auto h-1.5 bg-border rounded-full overflow-hidden mt-4">
                <div className="h-full bg-gold transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
            <input ref={fileRef} type="file" hidden multiple accept="image/*,video/*" onChange={handleUpload} />
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="section-kicker">Library</span>
            <h2 className="font-head text-2xl mt-1">Submitted work</h2>
          </div>
          <span className="text-xs text-secondary">{visible.length} item{visible.length === 1 ? '' : 's'}</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visible.map((item) => {
            const tone = statusToneMap(item.status) || { tone: 'neutral', label: item.status || 'Pending' };

            return (
              <div key={item._id} className="bg-white border border-border rounded-[20px] overflow-hidden group hover:border-gold/50 transition-colors">
                <div className="aspect-[4/3] bg-primary relative overflow-hidden">
                  {item.type === 'video' ? (
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  )}
                  <div className="absolute left-3 top-3"><StatusPill tone={tone.tone}>{tone.label}</StatusPill></div>
                  <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur text-white flex items-center justify-center"><Star size={14} /></div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-secondary">{item.type}</span>
                    <button type="button" onClick={() => removeItem(item._id)} className="text-secondary hover:text-danger" title="Remove"><Trash2 size={15} /></button>
                  </div>
                  <p className="text-xs text-secondary mt-2">
                    {item.status === 'approved' ? 'Approved for public use' : item.status === 'rejected' ? 'Review the admin feedback' : 'Waiting for admin review.'}
                  </p>
                  <ArrowUpRight size={14} className="text-gold mt-3" />
                </div>
              </div>
            );
          })}

          {!visible.length && (
            <div className="col-span-full panel py-16 text-center">
              <Images size={30} className="text-gold mx-auto mb-3" />
              <h3 className="font-head text-xl">Your portfolio is ready for its first story</h3>
              <p className="text-sm text-secondary mt-1">Upload a few standout images or films to get started.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
