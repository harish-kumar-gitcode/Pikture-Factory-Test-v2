'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Welcome back, Admin.', 'success');
      router.push('/admin/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-14 bg-primary text-white relative overflow-hidden">
        <Link href="/" className="font-head text-2xl relative z-10">Pikture <span className="text-gold">Factory</span></Link>
        <div className="relative z-10 max-w-md">
          <ShieldCheck size={32} className="text-gold mb-4" />
          <p className="font-head text-2xl italic leading-snug mb-4">Full control of every client, vendor and shoot — from one place.</p>
          <span className="text-sm opacity-60">Admin Control Center</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fadeUp">
          <h1 className="text-3xl mb-1">Admin Sign In</h1>
          <p className="text-sm text-secondary mb-9">Restricted access — Pikture Factory staff only.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="label">Email Address</label>
              <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@pikturefactory.com" />
            </div>
            <div className="mb-6 relative">
              <label className="label">Password</label>
              <input required type={showPass ? 'text' : 'password'} className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass((s) => !s)} className="absolute right-4 top-[38px] text-secondary">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button disabled={loading} className="btn btn-primary w-full">{loading ? 'Signing in...' : 'Sign In'}</button>
          </form>

          <p className="text-center text-xs text-secondary mt-8">
            Not an admin? <Link href="/login/vendor" className="text-gold font-semibold">Vendor login</Link> · <Link href="/login/client" className="text-gold font-semibold">Client login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
