import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bglight text-center px-6">
      <div>
        <div className="font-head text-[120px] leading-none text-primary">4<span className="text-gold">0</span>4</div>
        <h2 className="text-2xl mt-2 mb-3">This frame didn't make the final cut.</h2>
        <p className="text-secondary mb-8">The page you're looking for has been moved, renamed, or never existed.</p>
        <Link href="/" className="btn btn-primary">Back to Homepage</Link>
      </div>
    </div>
  );
}
