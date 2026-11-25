'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const fileRef = useRef(null);
  const router = useRouter();
  const showToast = useToast();

  useEffect(() => {
    fetch('/api/vendor/profile').then((r) => r.json()).then((d) => setVendor(d.vendor));
  }, []);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await uploadToCloudinary(file, {
        folder: 'pikture-factory/vendor-avatars',
        onProgress: setUploadProgress,
      });
      await fetch('/api/vendor/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: data.secure_url }) });
      setVendor((v) => ({ ...v, avatar: data.secure_url }));
      showToast('Profile picture updated.', 'success');
    } catch (error) {
      showToast(error.message || 'Could not update profile picture.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return showToast('New passwords do not match.', 'error');
    setSavingPw(true);
    const res = await fetch('/api/vendor/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setSavingPw(false);
    if (!res.ok) return showToast(data.error, 'error');
    showToast('Password changed.', 'success');
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/vendor');
  }

  if (!vendor) return <div className="text-secondary">Loading...</div>;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl">Profile</h1>
        <p className="text-sm text-secondary mt-0.5">{vendor.vendorCode} · {vendor.businessName}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-5">Account</h3>
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <img src={vendor.avatar || 'https://i.pravatar.cc/100?img=11'} alt="" className="w-20 h-20 rounded-full object-cover" />
              <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-primary">
                <Camera size={14} />
              </button>
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={handleAvatarChange} />
            </div>
            <div>
              <b className="block">{vendor.firstName} {vendor.lastName}</b>
              <span className="text-xs text-secondary">{uploading ? `Uploading photo... ${uploadProgress}%` : `Username: ${vendor.email}`}</span>
            </div>
          </div>
          <button onClick={logout} className="btn btn-outline w-fit">Log Out</button>
        </div>

        <div className="panel">
          <h3 className="text-lg font-head mb-5">Change Password</h3>
          <form onSubmit={changePassword} className="grid gap-4">
            <div><label className="label">Current Password</label><input required type="password" className="input" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
            <div><label className="label">New Password</label><input required type="password" minLength={6} className="input" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} /></div>
            <div><label className="label">Confirm New Password</label><input required type="password" className="input" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} /></div>
            <button disabled={savingPw} className="btn btn-primary w-fit disabled:opacity-60 disabled:cursor-not-allowed">{savingPw ? 'Updating...' : 'Update Password'}</button>
          </form>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
      </div>
    </>
  );
}
