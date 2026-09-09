'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SupportWidget from '@/components/shared/SupportWidget';
import { ChevronDown, FolderHeart, LifeBuoy, LogOut, Menu, UserRound, X, Sparkles } from 'lucide-react';

export default function ClientSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState(true);
  const nav = [
    { href: '/client/dashboard', label: 'My Events', icon: FolderHeart },
    { href: '/client/support', label: 'Support', icon: LifeBuoy },
    { href: '/client/profile', label: 'Profile', icon: UserRound },
  ];

  useEffect(() => { fetch('/api/client/profile').then(r => r.json()).then(d => setClient(d.client)).catch(() => {}); }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/client');
  }

  return <>
    <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-primary text-white px-5 h-16"><Link href="/client/dashboard" className="brand-mark text-base">Pikture <span>Factory</span></Link><button onClick={() => setMobileOpen(true)} className="p-2" aria-label="Open menu"><Menu size={21} /></button></div>
    {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="px-2 flex items-center justify-between"><Link href="/client/dashboard" className="brand-mark text-xl whitespace-nowrap">Pikture <span>Factory</span></Link><button className="lg:hidden text-white/60 p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button></div>
      <div className="mt-8 mx-2 rounded-2xl bg-white/[.04] border border-white/10 p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gold text-primary flex items-center justify-center font-head text-lg">{client?.name?.[0] || 'C'}</div><div className="min-w-0"><b className="text-sm block truncate">{client?.name || 'Client'}</b><span className="text-[10px] text-white/35 block truncate">{client?.clientCode || 'Private account'}</span></div></div><div className="mt-3 flex items-center gap-2 text-[10px] text-white/35"><Sparkles size={12} className="text-gold" /> Your memories, privately curated.</div></div>
      <nav className="mt-8 px-1"><button onClick={() => setMenu(!menu)} className="w-full flex items-center justify-between px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-white/35 font-semibold"><span>Your space</span><ChevronDown size={13} className={menu ? '' : '-rotate-90'} /></button>{menu && <div className="grid gap-1">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}><Icon size={17} /><span>{label}</span></Link>)}</div>}</nav>
      <div className="mt-auto pt-5 border-t border-white/10"><p className="px-3 text-[10px] text-white/30 leading-5 mb-3">A private space for your event memories and delivery updates.</p><button onClick={logout} className="sidebar-link w-full text-white/50 hover:text-gold"><LogOut size={16} /><span>Sign out</span></button></div>
    </aside>
    <SupportWidget role="client" name={client?.name || ''} />
  </>;
}
