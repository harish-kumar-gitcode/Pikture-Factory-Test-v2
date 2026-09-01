'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import ServiceCard from '@/components/home/ServiceCard';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { SERVICES } from '@/lib/servicesData';
import { useToast } from '@/components/ui/Toast';
import { MapPin, Phone, Mail, Clock, Plus, MessageCircle, PhoneCall } from 'lucide-react';

const FAQS = [
  { q: 'How do I track my project after booking?', a: 'Once your advance is paid, you receive dashboard credentials to track shoot status, editing progress, previews and invoices in real time.' },
  { q: 'Do I get to choose my photographer?', a: 'Our team assigns the best-fit vendor for your style and location based on portfolio match and availability — quality is consistent across our network.' },
  { q: 'How long until I receive edited photos?', a: 'Delivery timelines depend on your package, ranging from 7 to 15 days after the shoot date, visible on your project timeline.' },
  { q: 'Can I request changes to the final gallery?', a: 'Yes — every preview goes through a client approval step where you can request specific edits before final delivery.' },
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', type: 'Wedding', message: '' });
  const [sending, setSending] = useState(false);
  const showToast = useToast();

  async function submitEnquiry(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vendorSelected: form.type }),
      });
      if (!res.ok) throw new Error();
      showToast('Enquiry sent — our team will reach out shortly.', 'success');
      setForm({ name: '', phone: '', email: '', type: 'Wedding', message: '' });
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="min-h-screen flex items-center pt-[76px] bg-gradient-to-b from-white to-bglight">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8 grid md:grid-cols-[1.1fr_.9fr] gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5">
              <span className="w-6 h-px bg-gold" /> Photography &amp; Film Agency
            </div>
            <h1 className="text-[40px] md:text-[68px] leading-[1.1] mb-6">Stories worth <em className="italic text-gold not-italic font-normal" style={{ fontStyle: 'italic', color: '#C8A45D' }}>remembering</em>, shot to last a lifetime.</h1>
            <p className="text-lg text-secondary max-w-[460px] mb-9">Pikture Factory is a full-service photography agency — from weddings to corporate campaigns — handled by curated professionals and managed end-to-end on one platform.</p>
            <div className="flex gap-4 flex-wrap">
              <a href="#contact" className="btn btn-primary">Book a Consultation</a>
              <Link href="/gallery" className="btn btn-outline">View Our Work</Link>
            </div>
            <div className="flex gap-10 mt-14">
              <div><b className="font-head text-3xl block">420+</b><span className="text-sm text-secondary">Projects Delivered</span></div>
              <div><b className="font-head text-3xl block">128</b><span className="text-sm text-secondary">Happy Clients</span></div>
              <div><b className="font-head text-3xl block">4.9/5</b><span className="text-sm text-secondary">Average Rating</span></div>
            </div>
          </div>
          <div className="relative rounded-pf overflow-hidden shadow-lift aspect-[4/5]">
            <Image src="https://images.unsplash.com/photo-1519741497674-611481863552?w=800" alt="Wedding photography by Pikture Factory" fill className="object-cover" priority />
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-3 rounded-lg flex items-center gap-2.5 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-success" /> Live shoot in progress — Coorg
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-28">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8 grid md:grid-cols-[.9fr_1.1fr] gap-16 items-center">
          <div className="relative aspect-square rounded-pf overflow-hidden shadow-soft">
            <Image src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=700" alt="Pikture Factory creative team" fill className="object-cover" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5">
              <span className="w-6 h-px bg-gold" /> About Us
            </div>
            <h2 className="text-4xl mb-4">A studio built like a system, not a scramble.</h2>
            <p className="text-secondary text-base mb-8">Every shoot at Pikture Factory runs through a managed pipeline — booking, vendor assignment, editing, approval and delivery — so nothing depends on a single photographer's memory.</p>
            <ul className="grid gap-5">
              {['Curated network of vetted photographers & editors', 'Every gallery reviewed by our creative directors before delivery', 'Full project visibility for clients — timeline, previews, invoices'].map((t, i) => (
                <li key={i} className="flex gap-4 text-sm items-start"><span className="font-head text-gold text-lg">{`0${i + 1}`}</span><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-28 bg-bglight">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />What We Do<span className="w-6 h-px bg-gold" /></div>
            <h2 className="text-4xl mb-3">Services built around your story</h2>
            <p className="text-secondary">From intimate portraits to large-scale corporate campaigns.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.slice(0, 4).map((s) => <ServiceCard key={s.slug} {...s} />)}
          </div>
          <div className="text-center mt-12">
            <Link href="/services" className="btn btn-outline">View All Services</Link>
          </div>
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section id="gallery" className="py-28">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />Featured Work</div>
              <h2 className="text-4xl mb-2">A glimpse into recent projects</h2>
              <p className="text-secondary">All uploads are reviewed and approved by our team before publishing here.</p>
            </div>
            <Link href="/gallery" className="btn btn-primary shrink-0">View Full Gallery</Link>
          </div>
          <GalleryGrid limit={8} featured />
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-28 bg-primary text-white">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="mb-14">
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />Client Stories</div>
            <h2 className="text-4xl">What our clients say</h2>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
            {[
              { name: 'Riya & Arjun', tag: 'Wedding, Coorg', avatar: 47, quote: 'Pikture Factory managed everything — we always knew our shoot status without chasing anyone.' },
              { name: 'Studio Nine Pvt Ltd', tag: 'Corporate Shoot', avatar: 15, quote: 'The client dashboard alone made this worth it — full transparency on editing and delivery.' },
              { name: 'Devika Shah', tag: 'Maternity Session', avatar: 32, quote: 'Every photo felt intentional. The final gallery told our story better than we expected.' },
            ].map((t, i) => (
              <div key={i} className="min-w-[340px] snap-start bg-white/5 border border-white/10 rounded-pf p-8 backdrop-blur">
                <div className="text-gold mb-4">★★★★★</div>
                <p className="text-[15px] opacity-90 mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <Image src={`https://i.pravatar.cc/80?img=${t.avatar}`} alt="" width={44} height={44} className="rounded-full object-cover" />
                  <div><b className="text-sm block">{t.name}</b><span className="text-xs opacity-60">{t.tag}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="packages" className="py-28 bg-bglight">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />Packages<span className="w-6 h-px bg-gold" /></div>
            <h2 className="text-4xl mb-3">Simple, transparent pricing</h2>
            <p className="text-secondary">Every package includes a dedicated project manager and client dashboard access.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Essential', price: '₹45,000', features: ['1 Lead Photographer', '200+ Edited Photos', 'Online Gallery', '15-day Delivery'] },
              { name: 'Signature', price: '₹95,000', featured: true, features: ['2 Photographers + 1 Videographer', '500+ Edited Photos', 'Cinematic Highlight Film', '10-day Delivery'] },
              { name: 'Prestige', price: '₹1,80,000', features: ['Full Creative Team', 'Drone Coverage', 'Feature Film + Reels', '7-day Priority Delivery'] },
            ].map((p) => (
              <div key={p.name} className={`rounded-pf p-9 border transition-all duration-300 hover:-translate-y-2 hover:shadow-lift relative flex flex-col ${p.featured ? 'bg-primary text-white border-primary' : 'bg-white border-border'}`}>
                {p.featured && <span className="absolute -top-3.5 right-8 bg-gold text-primary text-[11px] font-bold px-3.5 py-1.5 rounded-full">Most Popular</span>}
                <h3 className="text-xl mb-1">{p.name}</h3>
                <div className="font-head text-4xl my-4">{p.price}<span className="text-sm font-body opacity-60 font-normal">/day</span></div>
                <ul className="grid gap-3 my-7 flex-1">
                  {p.features.map((f) => <li key={f} className="text-sm">✓ {f}</li>)}
                </ul>
                <a href="#contact" className={`btn ${p.featured ? 'btn-gold' : 'btn-outline'}`}>Choose Plan</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-28">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />FAQ<span className="w-6 h-px bg-gold" /></div>
            <h2 className="text-4xl">Common questions</h2>
          </div>
          <div className="max-w-[760px] mx-auto">
            {FAQS.map((f, i) => (
              <div key={i} className="border-b border-border">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex justify-between items-center py-6 w-full text-left font-medium">
                  {f.q}
                  <Plus size={20} className={`text-gold transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`} />
                </button>
                {openFaq === i && <p className="pb-6 text-sm text-secondary max-w-[640px]">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-28 bg-bglight">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8 grid md:grid-cols-[.9fr_1.1fr] gap-14">
          <div>
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />Get In Touch</div>
            <h2 className="text-[32px] mb-6">Let&apos;s plan your shoot</h2>
            <div className="grid gap-4">
              {[
                { Icon: MapPin, label: 'Studio Address', value: 'Kallumantapa, Ramamurthy Nagar, Bengaluru, Karnataka 560016' },
                { Icon: Phone, label: 'Call Us', value: '+91 72043 39503' },
                { Icon: Mail, label: 'Email', value: 'info@pikturefactory.in' },
                { Icon: Clock, label: 'Studio Hours', value: 'Mon – Sat, 10 AM – 7 PM' },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex gap-4 items-start bg-white p-5 rounded-xl border border-border">
                  <Icon size={18} className="text-gold shrink-0 mt-0.5" />
                  <div><b className="text-sm block mb-0.5">{label}</b><span className="text-[13px] text-secondary">{value}</span></div>
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={submitEnquiry} className="bg-white p-9 rounded-pf border border-border">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label">Phone Number</label><input required className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div><label className="label">Email</label><input type="email" required className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="label">Shoot Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>Wedding</option><option>Corporate</option><option>Maternity</option><option>Portrait</option>
                </select>
              </div>
            </div>
            <div className="mt-4"><label className="label">Tell us about your project</label><textarea required rows={4} className="input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <button disabled={sending} className="btn btn-primary w-full mt-6">{sending ? 'Sending...' : 'Send Enquiry'}</button>
          </form>
        </div>
      </section>

      <Footer />

      {/* FLOATING BUTTONS */}
      <div className="fixed bottom-7 right-7 flex flex-col gap-3.5 z-[900]">
        <a href="https://wa.me/917204339503" target="_blank" rel="noreferrer" className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lift hover:scale-110 transition-transform"><MessageCircle size={22} /></a>
        <a href="tel:+917204339503" className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lift hover:scale-110 transition-transform"><PhoneCall size={20} /></a>
      </div>
    </>
  );
}
