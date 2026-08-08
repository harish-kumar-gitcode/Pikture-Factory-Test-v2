import Navbar from '@/components/home/Navbar';
import Footer from '@/components/home/Footer';
import ServiceCard from '@/components/home/ServiceCard';
import { SERVICES } from '@/lib/servicesData';

export const metadata = { title: 'Services — Pikture Factory' };

export default function ServicesPage() {
  return (
    <>
      <Navbar />
      <section className="pt-[140px] pb-28">
        <div className="max-w-[1240px] mx-auto px-6 md:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5"><span className="w-6 h-px bg-gold" />What We Do<span className="w-6 h-px bg-gold" /></div>
            <h1 className="text-4xl mb-3">All Services</h1>
            <p className="text-secondary">Every category is delivered by curated, vetted professionals from our vendor network.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => <ServiceCard key={s.slug} {...s} />)}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
