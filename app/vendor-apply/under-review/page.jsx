import Link from 'next/link';
import { Hourglass } from 'lucide-react';

export default function UnderReviewPage() {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6">
      <div className="text-center max-w-md animate-fadeUp">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-6">
          <Hourglass size={26} className="text-gold" />
        </div>
        <h1 className="text-white text-3xl font-head mb-3">Your profile is under review</h1>
        <p className="text-white/60 text-sm mb-8">
          Thanks for applying to Pikture Factory! Our team typically reviews new applications within
          24 hours. You'll receive an email the moment you're approved — with your login details ready to go.
        </p>
        <Link href="/" className="btn btn-gold">Back to Homepage</Link>
      </div>
    </div>
  );
}
