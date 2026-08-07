import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, BadgeCheck, BookOpen, Users } from 'lucide-react';
import { fetchCity } from '../lib/api.js';
import TutorCard from '../components/TutorCard.jsx';

export default function CityPage() {
  const { city } = useParams();
  const { data, isLoading, isError } = useQuery({ queryKey:['city',city], queryFn:()=>fetchCity(city) });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-slate-500">Loading…</div>;
  if (isError || !data) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">City not found</h1>
      <Link to="/find-tutors" className="text-brand-600 mt-4 inline-block">← Browse all tutors</Link>
    </div>
  );

  const { name, state, tutor_count, localities = [], subjects = [], tutors = [] } = data;

  return (
    <>
      {/* HERO */}
      <div className="bg-brand-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-xs text-brand-300 mb-2">
            <Link to="/" className="hover:text-white">Home</Link> / <Link to="/find-tutors" className="hover:text-white">Find Tutors</Link> / <span>{name}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">Online &amp; Home Tutors in {name}</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            Experienced tutors for live 1-on-1 and home tuition across {name}{state ? `, ${state}` : ''} — verified tutors carry a badge on their profile. Book a free trial class today.
          </p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm">
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-brand-300"/><b>{tutor_count}</b> tutors</span>
            <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-brand-300"/><b>{subjects.length}</b> subjects</span>
            {localities.length > 0 && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-300"/><b>{localities.length}</b> localities covered</span>}
          </div>
          <Link to="/book-demo" className="mt-7 inline-block rounded-lg bg-white text-brand-800 px-6 py-3 text-sm font-bold hover:bg-slate-100">Book a Free Trial</Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-14">
        {/* SUBJECTS */}
        {subjects.length > 0 && (
          <section>
            <h2 className="text-2xl font-extrabold mb-1">Popular subjects in {name}</h2>
            <p className="text-sm text-slate-500 mb-5">Tap a subject to see tutors who teach it.</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map(s => (
                <Link key={s} to={`/find-tutors?subject=${encodeURIComponent(s)}&city=${encodeURIComponent(name)}`}
                  className="rounded-full bg-brand-50 text-brand-700 px-4 py-1.5 text-sm font-semibold ring-1 ring-brand-100 hover:bg-brand-100">{s}</Link>
              ))}
            </div>
          </section>
        )}

        {/* TUTORS */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold">Meet tutors in {name}</h2>
              <p className="text-sm text-slate-500 mt-1">{tutor_count} educator{tutor_count===1?'':'s'} ready to teach.</p>
            </div>
            <Link to={`/find-tutors?city=${encodeURIComponent(name)}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap">See all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {tutors.map(t => <TutorCard key={t.id} tutor={t} />)}
          </div>
        </section>

        {/* LOCALITIES */}
        {localities.length > 0 && (
          <section>
            <h2 className="text-2xl font-extrabold mb-1 flex items-center gap-2"><MapPin className="h-5 w-5 text-brand-600"/>Areas we cover in {name}</h2>
            <p className="text-sm text-slate-500 mb-5">Home tuition available across these localities.</p>
            <div className="flex flex-wrap gap-2">
              {localities.map(l => (
                <span key={l} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-sm">{l}</span>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="rounded-2xl bg-slate-50 p-8 text-center">
          <BadgeCheck className="h-8 w-8 text-brand-600 mx-auto mb-3"/>
          <h2 className="text-2xl font-extrabold">Ready to start in {name}?</h2>
          <p className="text-slate-600 mt-2 max-w-xl mx-auto">Tell us the subject and grade — we'll match you with the right verified tutor and set up a free trial class.</p>
          <Link to="/book-demo" className="mt-5 inline-block rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700">Book a Free Trial</Link>
        </section>
      </div>
    </>
  );
}
