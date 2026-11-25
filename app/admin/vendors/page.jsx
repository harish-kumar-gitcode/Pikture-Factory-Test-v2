'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminTopbar from '@/components/admin/Topbar';
import SearchFilter from '@/components/ui/SearchFilter';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useToast } from '@/components/ui/Toast';
import { Bell, CheckCircle2, XCircle, Play, Download, Loader2 } from 'lucide-react';

export default function VendorsPage() {
  const [tab, setTab] = useState('approved'); // 'approved' | 'pending'
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState({ from: null, to: null });
  const [processingId, setProcessingId] = useState(null); // vendor id currently being approved/rejected
  const showToast = useToast();

  function load() {
    const qs = new URLSearchParams({ status: tab, search });
    fetch(`/api/vendors?${qs}`).then((r) => r.json()).then((d) => setVendors(d.vendors || []));
  }
  useEffect(load, [tab, search]);

  const filtered = vendors.filter((v) => {
    if (!range.from) return true;
    const created = new Date(v.createdAt);
    const to = range.to || range.from;
    return created >= new Date(range.from) && created <= new Date(to);
  });

  async function handleAction(id, action) {
    if (processingId) return; // a request is already in flight — ignore repeat clicks entirely
    setProcessingId(id);
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          data.alreadyProcessed
            ? 'Already handled — no duplicate email was sent.'
            : action === 'approve' ? 'Vendor approved & onboarded — email sent.' : 'Moved to waitlist — email sent.',
          'success'
        );
        setVendors((prev) => prev.filter((v) => v._id !== id));
      } else {
        showToast(data.error || 'Something went wrong — please try again.', 'error');
      }
    } catch {
      showToast('Network error — please try again.', 'error');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <AdminTopbar title="Vendors" subtitle="Your approved roster and new applications." hasNotification={tab === 'pending'} />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button onClick={() => setTab('approved')} className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors ${tab === 'approved' ? 'bg-primary text-white border-primary' : 'border-border'}`}>Roster</button>
        <button onClick={() => setTab('pending')} className={`relative px-5 py-2.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-2 ${tab === 'pending' ? 'bg-primary text-white border-primary' : 'border-border'}`}>
          <Bell size={14} /> New Applications
        </button>
        <Link href="/admin/vendors/rejected" className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border sm:ml-auto">Rejected / Waitlist</Link>
      </div>

      <div className="panel">
        {tab === 'approved' ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-1 justify-between">
              <div className="flex-1"><SearchFilter search={search} onSearch={setSearch} searchPlaceholder="Search by name, business, or vendor code..." status="" onStatus={() => {}} /></div>
              <DateRangePicker range={range} onChange={setRange} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-secondary border-b border-border">
                    <th className="py-3">Vendor</th><th>Services</th><th>Location</th><th>Joined</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr key={v._id} className="border-b border-border hover:bg-bglight">
                      <td className="py-4"><b className="block">{v.firstName} {v.lastName}</b><span className="text-xs text-secondary">{v.vendorCode} · {v.businessName}</span></td>
                      <td className="text-xs">{v.servicesProvided.join(', ')}</td>
                      <td>{v.location}</td>
                      <td className="text-xs">{new Date(v.createdAt).toLocaleDateString('en-IN')}</td>
                      <td><Link href={`/admin/vendors/${v._id}`} className="btn btn-outline btn-sm">Manage</Link></td>
                    </tr>
                  ))}
                  {!filtered.length && <tr><td colSpan={5} className="py-10 text-center text-secondary">No vendors match.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {vendors.map((v) => (
              <div key={v._id} className="border border-border rounded-pf p-5">
                <div className="flex items-center gap-3 mb-3">
                  {v.portfolioSamples[0] && (
                    v.portfolioSamples[0].type === 'video'
                      ? <video src={v.portfolioSamples[0].url} className="w-14 h-14 rounded-lg object-cover" />
                      : <img src={v.portfolioSamples[0].url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  )}
                  <div>
                    <b className="block">{v.firstName} {v.lastName}</b>
                    <span className="text-xs text-secondary">{v.businessName}</span>
                  </div>
                </div>
                <p className="text-xs text-secondary mb-1">{v.servicesProvided.join(', ')} · {v.location}</p>
                <p className="text-xs text-secondary mb-4">{v.yearsOfExperience} yrs experience · {v.email} · {v.phone}</p>
                <div className="grid gap-2 mb-3">
                  {v.portfolioSamples.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 bg-bglight px-3 py-2 rounded-lg">
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-gold flex items-center gap-1.5 min-w-0">
                        {s.type === 'video' && <Play size={11} className="shrink-0" />} Sample {i + 1} — view
                      </a>
                      <a href={s.url.replace('/upload/', '/upload/fl_attachment/')} className="text-xs text-secondary flex items-center gap-1 shrink-0 hover:text-primary">
                        <Download size={12} /> Download
                      </a>
                    </div>
                  ))}
                  {!v.portfolioSamples.length && <p className="text-xs text-secondary">No samples submitted.</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAction(v._id, 'approve')}
                    disabled={processingId === v._id}
                    className="btn btn-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: '#dcfce7', color: '#22C55E' }}
                  >
                    {processingId === v._id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {processingId === v._id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(v._id, 'reject')}
                    disabled={processingId === v._id}
                    className="btn btn-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: '#fee2e2', color: '#EF4444' }}
                  >
                    {processingId === v._id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    {processingId === v._id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
            {!vendors.length && <p className="text-secondary text-sm py-10 text-center col-span-2">No new applications right now.</p>}
          </div>
        )}
      </div>
    </>
  );
}
