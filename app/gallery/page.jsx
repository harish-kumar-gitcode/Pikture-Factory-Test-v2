'use client';
import { useState } from 'react';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { SERVICES } from '@/lib/servicesData';

export default function GalleryPage() {
  const [category, setCategory] = useState('');

  return (
    <>
      <Navbar />
      <section className="pt-[140px] pb-28">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />Our Work</div>
            <h1 className="text-4xl mb-3">Full Gallery</h1>
            <p className="text-secondary">Every piece here has been reviewed and approved by our creative team.</p>
          </div>

          <div className="flex gap-2.5 flex-wrap mb-9">
            <button onClick={() => setCategory('')} className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${category === '' ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'}`}>All</button>
            {SERVICES.map((s) => (
              <button key={s.slug} onClick={() => setCategory(s.title)} className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${category === s.title ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'}`}>{s.title}</button>
            ))}
          </div>

          <GalleryGrid category={category} />
        </div>
      </section>
      <Footer />
    </>
  );
}
