'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import { useToast } from '@/components/ui/Toast';
import { Camera, Images, ArrowRight } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function AdminSettingsPage() {
  const [admin, setAdmin] = useState(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const fileRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    fetch('/api/admin/profile').then((r) => r.json()).then((d) => { setAdmin(d.admin); setName(d.admin?.name || ''); });
  }, []);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadToCloudinary(file, {
        folder: 'pikture-factory/admin-avatars',
        onProgress: setUploadProgress,
      });
      await fetch('/api/admin/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: data.secure_url }) });
      setAdmin((a) => ({ ...a, avatar: data.secure_url }));
      showToast('Profile picture updated.', 'success');
    } catch (error) {
      showToast(error.message || 'Could not update profile picture.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function saveProfile() {
    setSavingProfile(true);
    await fetch('/api/admin/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    showToast('Profile updated.', 'success');
    setSavingProfile(false);
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return showToast('New passwords do not match.', 'error');
    setSavingPw(true);
    const res = await fetch('/api/admin/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setSavingPw(false);
    if (!res.ok) return showToast(data.error, 'error');
    showToast('Password changed successfully.', 'success');
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
  }

  if (!admin) return <div className="text-secondary">Loading...</div>;

  return (
    <>
      <AdminTopbar title="Settings" subtitle="Manage your admin profile and security." />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-5">Profile</h3>
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <img src={admin.avatar || 'https://i.pravatar.cc/100?img=5'} alt="" className="w-20 h-20 rounded-full object-cover" />
              <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-primary">
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </div>
            <div>
              <b className="block">{admin.email}</b>
              <span className="text-xs text-secondary">{uploading ? `Uploading... ${uploadProgress}%` : 'Click the camera icon to update your photo'}</span>
            </div>
          </div>
          <div className="grid gap-4">
            <div><label className="label">Display Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label">Email (username)</label><input className="input opacity-60" value={admin.email} disabled /></div>
            <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary w-fit">{savingProfile ? 'Saving...' : 'Save Profile'}</button>
          </div>

          <Link href="/admin/vendor-gallery" className="mt-6 flex items-center justify-between border border-border rounded-xl p-4 hover:border-gold transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center"><Images size={18} /></div>
              <div>
                <b className="text-sm block">Homepage Gallery</b>
                <span className="text-xs text-secondary">Search every vendor's approved work and pick what shows on the homepage.</span>
              </div>
            </div>
            <ArrowRight size={16} className="text-secondary" />
          </Link>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-5">Change Password</h3>
          <form onSubmit={changePassword} className="grid gap-4">
            <div><label className="label">Current Password</label><input required type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
            <div><label className="label">New Password</label><input required type="password" minLength={6} className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
            <div><label className="label">Confirm New Password</label><input required type="password" className="input" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
            <button disabled={savingPw} className="btn btn-primary w-fit">{savingPw ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      </div>
    </>
  );
}
