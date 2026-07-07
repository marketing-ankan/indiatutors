import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container-page py-24 text-center">
      <div className="text-6xl font-extrabold text-brand-600">404</div>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">Back to homepage</Link>
    </div>
  );
}
