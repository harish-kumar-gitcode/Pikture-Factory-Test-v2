'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';

export default function ClientProfilePage() {
  const [client, setClient] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  useEffect(() => {
    fetch('/api/client/profile').then((r) => r.json()).then((d) => setClient(d.client));
  }, []);

  async function changePassword(e) {
    e.preventDefault();
    if (savingPw) return;
    if (pwForm.newPassword !== pwForm.confirm) return showToast('New passwords do not match.', 'error');
    setSavingPw(true);
    try {
      const res = await fetch('/api/client/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return showToast(data.error, 'error');
      showToast('Password changed.', 'success');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } finally {
      setSavingPw(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/client');
  }

  if (!client) return <div className="text-secondary">Loading...</div>;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl">Profile</h1>
        <p className="text-sm text-secondary mt-0.5">{client.clientCode}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="panel">
          <h3 className="text-lg font-head mb-5">Account</h3>
          <div className="grid gap-2.5 text-sm mb-6">
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Name</span><b>{client.name}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Email</span><b>{client.email}</b></div>
            <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Phone</span><b>{client.phone}</b></div>
            {client.vendor?.businessName && (
              <div className="flex items-center justify-between bg-bglight rounded-lg p-3"><span className="text-secondary">Photographer</span><b>{client.vendor.businessName}</b></div>
            )}
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
    </>
  );
}
