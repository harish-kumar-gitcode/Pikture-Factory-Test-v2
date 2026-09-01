'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Images, Wallet, User, LogOut, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/vendor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vendor/portfolio', label: 'Portfolio', icon: Images },
  { href: '/vendor/payments', label: 'Payments', icon: Wallet },
  { href: '/vendor/profile', label: 'Profile', icon: User },
];

export default function VendorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/vendor/profile').then((r) => r.json()).then((d) => setVendor(d.vendor)).catch(() => {});
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login/vendor');
  }

  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-primary text-white px-4 h-16 shrink-0">
        <Link href="/vendor/dashboard" className="font-head text-base whitespace-nowrap">Pikture <span className="text-gold">Factory</span></Link>
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
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-gold text-primary font-semibold' : 'opacity-75 hover:opacity-100 hover:bg-white/5'
                }`}
              >
                <Icon size={17} /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <img src={vendor?.avatar || 'https://i.pravatar.cc/80?img=11'} alt="" className="w-9 h-9 rounded-full object-cover" />
            <div className="min-w-0">
              <b className="text-sm block truncate">{vendor ? `${vendor.firstName} ${vendor.lastName}` : 'Vendor'}</b>
              <span className="text-xs opacity-55 block truncate">{vendor?.vendorCode}</span>
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
