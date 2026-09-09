import Link from 'next/link';
import { Instagram, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-white pt-20 pb-8">
      <div className="max-w-[1240px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-14">
          <div>
            <Link href="/" className="font-head text-xl">Pikture <span className="text-gold">Factory</span></Link>
            <p className="opacity-65 text-sm mt-4 max-w-[280px]">A managed visual production studio managing every shoot end-to-end, from booking to final delivery.</p>
            <div className="flex gap-3 mt-5">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:bg-gold hover:border-gold hover:text-primary transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gold mb-4">Company</h4>
            <ul className="grid gap-3 text-sm opacity-75">
              <li><Link href="/#about">About</Link></li>
              <li><Link href="/services">Services</Link></li>
              <li><Link href="/gallery">Gallery</Link></li>
              <li><Link href="/#contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gold mb-4">Services</h4>
            <ul className="grid gap-3 text-sm opacity-75">
              <li><Link href="/services">Weddings</Link></li>
              <li><Link href="/services">Corporate</Link></li>
              <li><Link href="/services">Maternity</Link></li>
              <li><Link href="/services">Films</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-gold mb-4">Account</h4>
            <ul className="grid gap-3 text-sm opacity-75">
              <li><Link href="/login/client">Client Login</Link></li>
              <li><Link href="/vendor-apply">Become a Vendor</Link></li>
              <li><Link href="/login/vendor">Vendor Login</Link></li>
              <li><Link href="/login/admin">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs opacity-60">
          <span>© {new Date().getFullYear()} Pikture Factory. All rights reserved.</span>
          <span>Crafted for Pikture Factory, <a href="https://yourwebstudio.vercel.app" target='_blank'>by Your Web Studio</a>.</span>
        </div>
      </div>
    </footer>
  );
}
