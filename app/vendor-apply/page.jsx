'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, UploadCloud, CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';

const SERVICE_OPTIONS = ['Wedding', 'Corporate', 'Maternity & Family', 'Films & Reels', 'Portrait', 'Aerial & Drone'];
const STEPS = ['Name', 'Business', 'Services', 'Location', 'Contact', 'Best Work'];

export default function VendorApplyPage() {
  const [step, setStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);
  const router = useRouter();
  const showToast = useToast();

  const [form, setForm] = useState({
    firstName: '', lastName: '', businessName: '', servicesProvided: [],
    yearsOfExperience: '', location: '', email: '', phone: '',
    portfolioSamples: [],
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleService(s) {
    setForm((f) => ({
      ...f,
      servicesProvided: f.servicesProvided.includes(s)
        ? f.servicesProvided.filter((x) => x !== s)
        : [...f.servicesProvided, s],
    }));
  }

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const [index, file] of files.entries()) {
        const data = await uploadToCloudinary(file, {
          folder: 'pikture-factory/vendor-applications',
          onProgress: (percent) => setUploadProgress(Math.round(((index + percent / 100) / files.length) * 100)),
        });
        uploaded.push({ url: data.secure_url, publicId: data.public_id, type: data.resource_type });
      }
      setForm((f) => ({ ...f, portfolioSamples: [...f.portfolioSamples, ...uploaded] }));
      showToast('Sample uploaded successfully.', 'success');
    } catch (err) {
      showToast('Upload failed — please try again.', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function canProceed() {
    switch (step) {
      case 0: return form.firstName.trim() && form.lastName.trim();
      case 1: return form.businessName.trim();
      case 2: return form.servicesProvided.length > 0;
      case 3: return form.location.trim();
      case 4: return form.email.trim() && form.phone.trim();
      case 5: return form.portfolioSamples.length > 0;
      default: return true;
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/vendor-apply/under-review');
    } catch (err) {
      showToast(err.message || 'Something went wrong.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* header / progress */}
      <div className="p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Link href="/" className="font-head text-xl text-white mb-6 block">Pikture <span className="text-gold">Factory</span></Link>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-gold transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-white/50 uppercase tracking-wide">
            <span>Step {step + 1} of {STEPS.length} — {STEPS[step]}</span>
            <span>{progress}% complete</span>
          </div>
        </div>
      </div>

      {/* hero hook — only on first step */}
      {step === 0 && (
        <div className="max-w-2xl mx-auto px-6 md:px-8 -mt-2 mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/15 text-gold text-xs font-bold px-4 py-2 rounded-full mb-4">
            <Zap size={13} /> SPEND 0% ON MARKETING
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-head leading-tight mb-3">
            Generate 100% paying clients — for free, with us.
          </h1>
          <p className="text-white/60 text-sm max-w-md mx-auto">
            Join the Pikture Factory vendor network. We bring the clients, handle the admin,
            and pay you for the work you already love doing.
          </p>
          <div className="flex justify-center gap-8 mt-6 text-white/70 text-xs">
            <span className="flex items-center gap-1.5"><Users size={14} className="text-gold" /> 120+ active vendors</span>
            <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-gold" /> Steady monthly bookings</span>
          </div>
        </div>
      )}

      {/* form card */}
      <div className="flex-1 flex items-start justify-center px-6 md:px-8 pb-16">
        <div className="bg-white rounded-pf p-8 md:p-10 w-full max-w-2xl animate-fadeUp">

          {step === 0 && (
            <div className="grid gap-5">
              <h2 className="text-2xl mb-1">What's your name?</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="label">First Name</label><input autoFocus className="input" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
                <div><label className="label">Last Name</label><input className="input" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-5">
              <h2 className="text-2xl mb-1">What's your business called?</h2>
              <p className="text-sm text-secondary -mt-3">This is how clients will discover your work.</p>
              <div>
                <label className="label">Business Name</label>
                <input autoFocus className="input" value={form.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder="e.g. Lensview Studios" />
              </div>
              <div>
                <label className="label">Years of Experience</label>
                <input type="number" min="0" className="input" value={form.yearsOfExperience} onChange={(e) => update('yearsOfExperience', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5">
              <h2 className="text-2xl mb-1">What services do you provide?</h2>
              <p className="text-sm text-secondary -mt-3">Select all that apply.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {SERVICE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                      form.servicesProvided.includes(s) ? 'bg-gold/10 border-gold text-primary' : 'border-border hover:border-gold'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${form.servicesProvided.includes(s) ? 'bg-gold border-gold' : 'border-border'}`}>
                      {form.servicesProvided.includes(s) && <CheckCircle2 size={12} className="text-white" />}
                    </span>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5">
              <h2 className="text-2xl mb-1">Where can you shoot?</h2>
              <p className="text-sm text-secondary -mt-3">City, region, or "Pan-India" if you travel.</p>
              <div>
                <label className="label">Serviceable Location</label>
                <input autoFocus className="input" value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. Bengaluru & Coorg" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-5">
              <h2 className="text-2xl mb-1">How do we reach you?</h2>
              <div>
                <label className="label">Email Address</label>
                <input autoFocus type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input type="tel" className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="grid gap-5">
              <h2 className="text-2xl mb-1">Show us your best work</h2>
              <p className="text-sm text-secondary -mt-3">Upload 1–3 photos or a short video — this is what gets you approved fastest.</p>

              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-pf p-10 text-center cursor-pointer hover:border-gold hover:bg-gold/5 transition-colors"
              >
                <UploadCloud size={30} className="text-gold mx-auto mb-3" />
                <p className="text-sm font-medium">{uploading ? `Uploading... ${uploadProgress}%` : 'Click to upload photos or videos'}</p>
                {uploading && <div className="h-1.5 bg-border rounded-full overflow-hidden mt-3"><div className="h-full bg-gold transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
                <input ref={fileRef} type="file" hidden multiple accept="image/*,video/*" onChange={handleFileSelect} />
              </div>

              {form.portfolioSamples.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {form.portfolioSamples.map((s, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-bglight">
                      {s.type === 'video' ? <video src={s.url} className="w-full h-full object-cover" /> : <img src={s.url} alt="" className="w-full h-full object-cover" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* nav buttons */}
          <div className="flex justify-between mt-9">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className={`btn btn-outline btn-sm ${step === 0 ? 'invisible' : ''}`}
            >
              <ArrowLeft size={14} /> Back
            </button>

            {step < STEPS.length - 1 ? (
              <button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} className="btn btn-primary btn-sm disabled:opacity-40">
                Continue <ArrowRight size={14} />
              </button>
            ) : (
              <button disabled={!canProceed() || submitting} onClick={handleSubmit} className="btn btn-gold btn-sm disabled:opacity-40">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
