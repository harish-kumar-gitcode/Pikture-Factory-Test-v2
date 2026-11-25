function Paragraphs({ text }) {
  if (!text) return null;
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p, i) => (
      <p key={i} className="text-secondary leading-relaxed mb-4 last:mb-0">
        {p}
      </p>
    ));
}

function List({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="grid gap-2 mb-4 pl-1">
      {items.map((item, i) => (
        <li key={i} className="text-secondary leading-relaxed flex gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ContactCard({ lines }) {
  if (!lines?.length) return null;
  return (
    <div className="bg-bglight border border-border rounded-pf p-6 mb-4 grid gap-1.5">
      {lines.map(([label, value], i) => (
        <p key={i} className="text-sm">
          {value ? (
            <>
              <span className="text-secondary">{label}:</span> <span className="text-primary font-medium">{value}</span>
            </>
          ) : (
            <span className="font-head text-primary text-base">{label}</span>
          )}
        </p>
      ))}
    </div>
  );
}

function Subsection({ heading, body, list, after }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="font-head text-lg mb-2.5">{heading}</h3>
      <Paragraphs text={body} />
      <List items={list} />
      <Paragraphs text={after} />
    </div>
  );
}

function Section({ heading, body, list, after, subsections, contactCard }) {
  return (
    <section id={heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="scroll-mt-28 border-t border-border pt-10 mt-10 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="font-head text-2xl mb-4">{heading}</h2>
      <Paragraphs text={body} />
      <List items={list} />
      <ContactCard lines={contactCard?.lines} />
      {subsections?.map((s, i) => <Subsection key={i} {...s} />)}
      <Paragraphs text={after} />
    </section>
  );
}

export default function LegalDocument({ eyebrow, title, lastUpdated, intro, sections }) {
  return (
    <section className="pt-[140px] pb-28">
      <div className="max-w-[820px] mx-auto px-6 md:px-8">
        <div className="mb-14">
          <div className="inline-flex items-center gap-2.5 text-xs tracking-[.16em] uppercase text-gold font-semibold mb-5">
            <span className="w-6 h-px bg-gold" />{eyebrow}<span className="w-6 h-px bg-gold" />
          </div>
          <h1 className="text-4xl mb-3">{title}</h1>
          <p className="text-sm text-secondary">Last Updated: {lastUpdated}</p>
        </div>

        {intro && (
          <div className="mb-14 pb-10 border-b border-border">
            <Paragraphs text={intro} />
          </div>
        )}

        <div>
          {sections.map((s, i) => <Section key={i} {...s} />)}
        </div>

        <p className="text-xs text-secondary mt-14 pt-8 border-t border-border">Last Updated: {lastUpdated}</p>
      </div>
    </section>
  );
}
