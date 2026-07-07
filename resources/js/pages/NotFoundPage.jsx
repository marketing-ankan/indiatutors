import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
      <div className="text-6xl font-extrabold text-brand-600">404</div>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="inline-flex mt-6 rounded-md bg-brand-600 text-white px-6 py-2.5 text-sm font-bold hover:bg-brand-700">Back to homepage</Link>
    </div>
  );
}
