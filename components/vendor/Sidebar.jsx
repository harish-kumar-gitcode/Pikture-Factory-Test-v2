'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, ChevronDown, FolderKanban, Images, LayoutDashboard, LifeBuoy, LogOut, Menu, WalletCards, X, Sparkles, UserRound, HelpCircle } from 'lucide-react';
import HowItWorksModal from '@/components/shared/HowItWorksModal';
import SupportWidget from '@/components/shared/SupportWidget';

const GROUPS = [
  { title: 'Workspace', items: [
    { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/vendor/projects', label: 'Projects', icon: FolderKanban },
    { href: '/vendor/portfolio', label: 'Portfolio', icon: Images },
    { href: '/vendor/data', label: 'Data & Insights', icon: BarChart3 },
  ]},
  { title: 'Business', items: [
    { href: '/vendor/payments', label: 'Finance', icon: WalletCards },
    { href: '/vendor/profile', label: 'Profile & Account', icon: UserRound },
  ]},
];

export default function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [guide, setGuide] = useState(false);
  const [groups, setGroups] = useState({ Workspace: true, Business: true });

  useEffect(() => {
    fetch('/api/vendor/profile').then(r => r.json()).then(d => setVendor(d.vendor)).catch(() => {});
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/vendor');
  }

  return <>
    <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-primary text-white px-5 h-16 shrink-0">
      <Link href="/vendor/dashboard" className="brand-mark text-base">Pikture <span>Factory</span></Link>
      <button onClick={() => setMobileOpen(true)} className="p-2" aria-label="Open menu"><Menu size={21} /></button>
    </div>
    {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="px-2 flex items-center justify-between">
        <Link href="/vendor/dashboard" className="brand-mark text-xl whitespace-nowrap">Pikture <span>Factory</span></Link>
        <button className="lg:hidden text-white/60 p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button>
      </div>

      <div className="mt-9 px-2">
        <p className="eyebrow text-white/35">Vendor workspace</p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold text-primary flex items-center justify-center font-head text-lg">{vendor?.firstName?.[0] || 'V'}</div>
            <div className="min-w-0"><b className="text-sm block truncate">{vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor'}</b><span className="text-[11px] text-white/40 block truncate">{vendor?.vendorCode || 'Partner account'}</span></div>
          </div>
          <div className="mt-4 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-3/4 bg-gold rounded-full" /></div>
          <div className="flex justify-between mt-2 text-[10px] text-white/35"><span>Workspace ready</span><span>75%</span></div>
        </div>
      </div>

      <nav className="mt-7 px-1 space-y-5 overflow-y-auto flex-1 min-h-0">
        {GROUPS.map(group => <div key={group.title}>
          <button onClick={() => setGroups(g => ({ ...g, [group.title]: !g[group.title] }))} className="w-full flex items-center justify-between px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-white/35 font-semibold">
            <span>{group.title}</span><ChevronDown size={13} className={`transition-transform ${groups[group.title] ? '' : '-rotate-90'}`} />
          </button>
          {groups[group.title] && <div className="grid gap-1">{group.items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}><Icon size={17} /><span>{label}</span></Link>)}</div>}
        </div>)}
        <div>
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-white/35 font-semibold">Support</p>
          <button onClick={() => setGuide(true)} className="sidebar-link w-full"><HelpCircle size={17} /><span>How it works</span><span className="ml-auto"><Sparkles size={13} className="text-gold" /></span></button>
          <button onClick={() => window.dispatchEvent(new Event('pf-open-support'))} className="sidebar-link w-full"><LifeBuoy size={17} /><span>Need help?</span></button>
        </div>
      </nav>

      <div className="mt-auto pt-5 border-t border-white/10">
        <div className="px-3 text-[10px] text-white/30 leading-5 mb-3">Private partner workspace<br />Pikture Factory Network</div>
        <button onClick={logout} className="sidebar-link w-full text-white/50 hover:text-gold"><LogOut size={16} /><span>Sign out</span></button>
      </div>
    </aside>
    <HowItWorksModal open={guide} onClose={() => setGuide(false)} role="vendor" name={vendor?.firstName || ''} />
    <SupportWidget role="vendor" name={vendor?.firstName || ''} code={vendor?.vendorCode || ''} />
  </>;
}
