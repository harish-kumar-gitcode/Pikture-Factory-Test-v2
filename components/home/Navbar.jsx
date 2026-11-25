'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/#about', label: 'About' },
    { href: '/wedding-events', label: 'Wedding & Events' },
    { href: '/corporate-events', label: 'Corporate Events' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/cart', label: 'Cart' },
    { href: '/#faq', label: 'FAQ' },
    { href: '/#contact', label: 'Contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-[1000] h-[76px] flex items-center transition-all duration-300 ${scrolled ? 'bg-white/85 backdrop-blur-lg shadow-soft h-[68px]' : 'bg-transparent'}`}>
      <div className="max-w-[1240px] mx-auto px-6 md:px-8 w-full flex items-center justify-between">
        <Link href="/" className="font-head text-xl font-bold">Pikture <span className="text-gold">Factory</span></Link>

        <nav className="hidden lg:flex items-center gap-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium relative group">
              {l.label}
              <span className="absolute left-0 -bottom-1.5 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login/client" className="btn btn-primary btn-sm hidden sm:inline-flex">Client Login</Link>
          <button className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-soft p-8 grid gap-5">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium">{l.label}</Link>
          ))}
          <Link href="/login/client" onClick={() => setOpen(false)} className="btn btn-primary btn-sm w-fit">Client Login</Link>
        </div>
      )}
    </header>
  );
}
