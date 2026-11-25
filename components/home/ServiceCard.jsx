import Image from 'next/image';

export default function ServiceCard({ title, blurb, image }) {
  return (
    <div className="group rounded-pf overflow-hidden border border-border bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
      <div className="relative h-56 overflow-hidden">
        <Image src={image} alt={title} fill sizes="400px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
      </div>
      <div className="p-6">
        <h3 className="text-xl mb-2">{title}</h3>
        <p className="text-sm text-secondary opacity-85">{blurb}</p>
      </div>
    </div>
  );
}
