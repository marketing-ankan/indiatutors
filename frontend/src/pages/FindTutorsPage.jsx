import { Link } from 'react-router-dom';

export default function FindTutorsPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <h1 className="text-4xl font-extrabold tracking-tight">Find Tutors</h1>
      <p className="mt-4 text-slate-600">
        Tell us the subject, grade, and city — we'll match you with a verified tutor and set up a
        free demo class. The public tutor directory (with individual profiles, subjects taught, fees,
        and reviews) is launching in Phase 3.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <Link to="/book-demo" className="rounded-xl bg-white ring-1 ring-slate-100 p-6 hover:ring-brand-300 hover:shadow-md transition">
          <h3 className="font-bold text-lg">Request a matched tutor</h3>
          <p className="mt-2 text-sm text-slate-600">Fill a quick form. Our team hand-matches you within 24 hours.</p>
        </Link>
        <Link to="/courses" className="rounded-xl bg-white ring-1 ring-slate-100 p-6 hover:ring-brand-300 hover:shadow-md transition">
          <h3 className="font-bold text-lg">Browse by course</h3>
          <p className="mt-2 text-sm text-slate-600">Start from a subject — each course has a "Book Demo" button.</p>
        </Link>
      </div>
    </div>
  );
}
