'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import StatusPill, { statusToneMap } from '@/components/ui/StatusPill';
import SearchFilter from '@/components/ui/SearchFilter';

const TAG_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    fetch('/api/enquiries').then((r) => r.json()).then((d) => { setEnquiries(d.enquiries || []); setLoading(false); });
  }, []);

  const filtered = enquiries.filter((e) => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search);
    const matchesTag = !tag || e.tag === tag;
    return matchesSearch && matchesTag;
  });

  return (
    <>
      <AdminTopbar title="Enquiries" subtitle="Every lead that has come in through the site or by phone." />

      <div className="panel">
        <SearchFilter search={search} onSearch={setSearch} status={tag} onStatus={setTag} statusOptions={TAG_OPTIONS} />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-secondary border-b border-border">
                <th className="py-3">Name</th><th>Phone</th><th>Event Date</th><th>Place</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const t = statusToneMap(e.tag);
                return (
                  <tr key={e._id} className="border-b border-border hover:bg-bglight">
                    <td className="py-4">{e.name}</td>
                    <td>{e.phone}</td>
                    <td>{e.eventDate ? new Date(e.eventDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td>{e.eventPlace || '—'}</td>
                    <td><StatusPill tone={t.tone}>{t.label}</StatusPill></td>
                    <td><Link href={`/admin/enquiries/${e._id}`} className="btn btn-outline btn-sm">View</Link></td>
                  </tr>
                );
              })}
              {!loading && !filtered.length && (
                <tr><td colSpan={6} className="py-10 text-center text-secondary">No matching enquiries.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
