'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import NextLink from 'next/link';
import { ArrowLeft, UploadCloud, Send, MapPin, Calendar, MessageCircle } from 'lucide-react';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import { useToast } from '@/components/ui/Toast';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function VendorProjectDetailPage() {
  const { id } = useParams();
  const showToast = useToast();
  const [project, setProject] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const fileRef = useRef(null);

  function load() {
    fetch(`/api/projects/${id}`).then((r) => r.json()).then((d) => setProject(d.project));
  }
  useEffect(load, [id]);

  async function updateStatus(status) {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      showToast(`Marked as ${statusToneMap(status).label}.`, 'success');
      load();
    } finally {
      setStatusBusy(false);
    }
  }

  async function sendChat() {
    if (!chatText.trim() || sendingChat) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note: chatText.trim() }) });
      if (res.ok) {
        setChatText('');
        load();
      } else {
        showToast('Something went wrong — please try again.', 'error');
      }
    } finally {
      setSendingChat(false);
    }
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const [index, file] of files.entries()) {
        const data = await uploadToCloudinary(file, {
          folder: 'pikture-factory/gallery-submissions',
          onProgress: (percent) => setUploadProgress(Math.round(((index + percent / 100) / files.length) * 100)),
        });
        await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: data.secure_url, publicId: data.public_id, type: data.resource_type, projectId: id }),
        });
      }
      showToast('Submitted for admin approval.', 'success');
    } catch (error) {
      showToast(error.message || 'Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  if (!project) return <div className="text-secondary">Loading...</div>;
  const t = statusToneMap(project.status);

  return (
    <>
      <NextLink href="/vendor/dashboard" className="text-sm text-secondary flex items-center gap-1.5 mb-3"><ArrowLeft size={14} /> Back to Dashboard</NextLink>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl">{project.projectCode} — {project.eventType}</h1>
          <span className="text-sm text-secondary">{project.eventDate ? new Date(project.eventDate).toLocaleDateString('en-IN') : 'Date TBD'} · {project.location}</span>
        </div>
        <StatusPill tone={t.tone}>{t.label}</StatusPill>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-4">Event Info</h3>
          <p className="text-xs text-secondary mb-4">Client contact details stay with the admin — reach out to them if you need to coordinate directly with the client.</p>
          <div className="grid gap-2.5 text-sm">
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary flex items-center gap-1.5"><Calendar size={13} /> Event Date</span><b>{project.eventDate ? new Date(project.eventDate).toLocaleDateString('en-IN') : 'TBD'}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary flex items-center gap-1.5"><MapPin size={13} /> Location</span><b>{project.location || '—'}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Reference Code</span><b>{project.client?.clientCode || '—'}</b></div>
          </div>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-4">Payment for This Project</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-bglight rounded-lg p-3"><span className="text-xs text-secondary block">Amount Paid</span><b className="text-success">₹{project.amountPaidToVendor?.toLocaleString('en-IN')}</b></div>
            <div className="bg-bglight rounded-lg p-3"><span className="text-xs text-secondary block">Amount Pending</span><b className="text-warning">₹{project.amountPendingVendor?.toLocaleString('en-IN')}</b></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-4">Update Shoot Status</h3>
          <p className="text-xs text-secondary mb-5">This status is visible to the admin and reflects overall project progress.</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => updateStatus('shoot_scheduled')}
              disabled={statusBusy || (project.status !== 'vendor_assigned' && project.status !== 'requested')}
              className="btn btn-outline btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark: Shoot Scheduled
            </button>
            <button
              onClick={() => updateStatus('shoot_completed')}
              disabled={statusBusy || project.status !== 'shoot_scheduled'}
              className="btn btn-primary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Mark: Shoot Completed
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold mb-1 flex items-center gap-1.5"><MessageCircle size={15} className="text-gold" /> Chat with Admin — This Project</h4>
            <p className="text-xs text-secondary mb-3">Scoped to {project.projectCode} only — use it for delays, progress, or anything worth flagging about this shoot.</p>
            <div className="grid gap-2 max-h-64 overflow-y-auto pr-1 mb-3">
              {[...(project.notes || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((n, i) => (
                <div key={n._id || i} className="bg-bglight rounded-lg p-3 text-xs">
                  <p className="text-sm">{n.text}</p>
                  <div className="flex justify-between mt-1.5 text-secondary">
                    <span>{n.author}</span>
                    <span>{formatTime(n.createdAt)}</span>
                  </div>
                </div>
              ))}
              {!project.notes?.length && <p className="text-xs text-secondary">No messages yet — say hello.</p>}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Message the admin about this project..." value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
              <button onClick={sendChat} disabled={sendingChat} className="btn btn-primary btn-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"><Send size={14} /> {sendingChat ? '...' : 'Send'}</button>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-4">Upload Media for This Project</h3>
          <p className="text-xs text-secondary mb-4">Sent for admin approval — not published directly.</p>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-border rounded-pf p-8 text-center cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors">
            <UploadCloud size={26} className="text-gold mx-auto mb-2" />
            <p className="text-sm font-medium">{uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload photos / videos'}</p>
            {uploading && <div className="h-1.5 bg-border rounded-full overflow-hidden mt-3"><div className="h-full bg-gold transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
            <input ref={fileRef} type="file" hidden multiple accept="image/*,video/*" onChange={handleUpload} />
          </div>
        </div>
      </div>
    </>
  );
}
