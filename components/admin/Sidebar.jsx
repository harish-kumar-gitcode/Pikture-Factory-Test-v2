'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, ChevronDown, Cloud, FolderKanban, ImageIcon, Inbox, LayoutDashboard, LifeBuoy, LogOut, Menu, Settings, Star, Users, Camera, X, Images, WalletCards, Package } from 'lucide-react';

const GROUPS = [
  { title: 'Command centre', items: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/data', label: 'Data & Insights', icon: BarChart3 },
    { href: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
  ]},
  { title: 'Operations', items: [
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
    { href: '/admin/packages', label: 'Packages', icon: Package },
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/vendors', label: 'Vendors', icon: Camera, badge: 'vendorPending' },
    { href: '/admin/tickets', label: 'Support', icon: LifeBuoy },
  ]},
  { title: 'Media & brand', items: [
    { href: '/admin/media', label: 'Media Library', icon: Cloud },
    { href: '/admin/gallery', label: 'Gallery Approval', icon: ImageIcon },
    { href: '/admin/vendor-gallery', label: 'Homepage Gallery', icon: Star },
    { href: '/admin/gallery-page', label: 'Gallery Page', icon: Images },
  ]},
  { title: 'Finance & system', items: [
    { href: '/admin/payments', label: 'Finance', icon: WalletCards },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]},
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingVendors, setPendingVendors] = useState(0);
  const [admin, setAdmin] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groups, setGroups] = useState(Object.fromEntries(GROUPS.map(g => [g.title, true])));

  useEffect(() => {
    fetch('/api/vendors/pending-count').then(r => r.json()).then(d => setPendingVendors(d.count || 0)).catch(() => {});
    fetch('/api/admin/profile').then(r => r.json()).then(d => setAdmin(d.admin)).catch(() => {});
  }, [pathname]);
  useEffect(() => setMobileOpen(false), [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/admin');
  }

  return <>
    <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-primary text-white px-5 h-16">
      <Link href="/admin/dashboard" className="brand-mark text-base">Pikture <span>Factory</span></Link>
      <button onClick={() => setMobileOpen(true)} className="p-2" aria-label="Open menu"><Menu size={21} /></button>
    </div>
    {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`app-sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="px-2 flex items-center justify-between">
        <Link href="/admin/dashboard" className="brand-mark text-xl whitespace-nowrap">Pikture <span>Factory</span></Link>
        <button className="lg:hidden text-white/60 p-2" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19} /></button>
      </div>
      <div className="mt-9 px-2">
        <p className="text-[10px] uppercase tracking-[.2em] text-white/30">Admin workspace</p>
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gold text-primary flex items-center justify-center font-head">{admin?.name?.[0] || 'A'}</div><div className="min-w-0"><b className="text-sm block truncate">{admin?.name || 'Admin'}</b><span className="text-[10px] text-white/35 block truncate">{admin?.email || 'Control account'}</span></div></div></div>
      </div>
      <nav className="mt-9 px-1 space-y-5 overflow-y-auto flex-1 min-h-0">
        {GROUPS.map(group => <div key={group.title}>
          <button onClick={() => setGroups(g => ({ ...g, [group.title]: !g[group.title] }))} className="w-full flex items-center justify-between px-3 mb-2 text-[10px] uppercase tracking-[.18em] text-white/35 font-semibold"><span>{group.title}</span><ChevronDown size={13} className={`transition-transform ${groups[group.title] ? '' : '-rotate-90'}`} /></button>
          {groups[group.title] && <div className="grid gap-1">{group.items.map(({ href, label, icon: Icon, badge }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`sidebar-link ${pathname.startsWith(href) ? 'active' : ''}`}><span className="flex items-center gap-3"><Icon size={17} /><span>{label}</span></span>{badge === 'vendorPending' && pendingVendors > 0 && <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{pendingVendors}</span>}</Link>)}</div>}
        </div>)}
      </nav>
      <div className="mt-auto pt-5 border-t border-white/10"><button onClick={logout} className="sidebar-link w-full text-white/50 hover:text-gold"><LogOut size={16} /><span>Sign out</span></button></div>
    </aside>
  </>;
}
