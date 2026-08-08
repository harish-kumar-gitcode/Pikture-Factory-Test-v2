'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Inbox, Users, Camera, ImageIcon, Wallet,
  LifeBuoy, Settings, LogOut, Star, Menu, X,
} from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/enquiries', label: 'Enquiries', icon: Inbox },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/vendors', label: 'Vendors', icon: Camera, badge: 'vendorPending' },
  { href: '/admin/gallery', label: 'Gallery Approval', icon: ImageIcon },
  { href: '/admin/vendor-gallery', label: 'Homepage Gallery', icon: Star },
  { href: '/admin/payments', label: 'Payments', icon: Wallet },
  { href: '/admin/tickets', label: 'Support Tickets', icon: LifeBuoy },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingVendors, setPendingVendors] = useState(0);
  const [admin, setAdmin] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/vendors/pending-count').then((r) => r.json()).then((d) => setPendingVendors(d.count || 0)).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    fetch('/api/admin/profile').then((r) => r.json()).then((d) => setAdmin(d.admin)).catch(() => {});
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/admin');
  }

  return (
    <>
      {/* mobile-only top bar with hamburger */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-primary text-white px-4 h-16 shrink-0">
        <Link href="/admin/dashboard" className="font-head text-base whitespace-nowrap">Pikture <span className="text-gold">Factory</span></Link>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1.5 -mr-1.5">
          <Menu size={22} />
        </button>
      </div>

      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`bg-primary text-white p-5 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 w-[264px] shrink-0 overflow-y-auto transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between mb-10 px-2">
          <Link href="/" className="font-head text-lg whitespace-nowrap">Pikture <span className="text-gold">Factory</span></Link>
          <button className="lg:hidden opacity-70 hover:opacity-100" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="grid gap-1">
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-gold text-primary font-semibold' : 'opacity-75 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3"><Icon size={17} /> {label}</span>
                {badge === 'vendorPending' && pendingVendors > 0 && (
                  <span className="bg-danger text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingVendors}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <img src={admin?.avatar || 'https://i.pravatar.cc/80?img=5'} alt="" className="w-9 h-9 rounded-full object-cover" />
            <div className="min-w-0">
              <b className="text-sm block truncate">{admin?.name || 'Admin'}</b>
              <span className="text-xs opacity-55 block truncate">{admin?.email}</span>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm opacity-65 hover:opacity-100 hover:text-gold px-2">
            <LogOut size={15} /> Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
