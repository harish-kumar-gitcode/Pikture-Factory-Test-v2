'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function ClientLoginPage() {
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
      const res = await fetch('/api/auth/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Welcome back!', 'success');
      router.push('/client/dashboard');
    } catch (err) {
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:block relative">
        <Image src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-primary/90" />
        <div className="relative z-10 h-full flex flex-col justify-between p-14 text-white">
          <Link href="/" className="font-head text-2xl">Pikture <span className="text-gold">Factory</span></Link>
          <div className="max-w-md">
            <p className="font-head text-2xl italic leading-snug mb-4">&ldquo;A platform that finally makes agency-scale photography feel organized.&rdquo;</p>
            <span className="text-sm opacity-70">Studio Nine Pvt Ltd, Corporate Client</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fadeUp">
          <h1 className="text-3xl mb-1">Welcome back</h1>
          <p className="text-sm text-secondary mb-9">Sign in to track your project.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="label">Email Address</label>
              <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            New client? <Link href="/#contact" className="text-gold font-semibold">Book a shoot to get started</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
