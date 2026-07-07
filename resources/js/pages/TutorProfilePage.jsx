import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, MapPin, Globe, GraduationCap, Clock, Video, Home, Star, CheckCircle2 } from 'lucide-react';
import { fetchTutor } from '../lib/api.js';

export default function TutorProfilePage() {
  const { slug } = useParams();
  const { data: tutor, isLoading, isError } = useQuery({ queryKey:['tutor',slug], queryFn:()=>fetchTutor(slug) });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-slate-500">Loading tutor…</div>;
  if (isError || !tutor) return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Tutor not found</h1>
      <Link to="/find-tutors" className="text-brand-600 mt-4 inline-block">← Back to all tutors</Link>
    </div>
  );

  const fb = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380"><rect width="300" height="380" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="90" fill="white">${(tutor.name||'?')[0]}</text></svg>`)}`;
  const modeLabel = { online:'Online classes', home:'Home tuition', both:'Online & Home' }[tutor.teaching_mode] || 'Online classes';
  const ModeIcon = tutor.teaching_mode === 'home' ? Home : Video;

  return (
    <>
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-500">
          <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/find-tutors" className="hover:text-brand-600">Find Tutors</Link> / <span className="text-slate-700">{tutor.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[340px_1fr] gap-10 items-start">
        {/* LEFT: photo + booking card */}
        <div className="lg:sticky lg:top-28">
          <div className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden">
            <div className="aspect-[4/5] bg-slate-100">
              <img src={tutor.image_url || fb} alt={tutor.name} className="w-full h-full object-cover object-top" onError={e=>{e.currentTarget.src=fb}}/>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Hourly fee</div>
                  <div className="text-3xl font-extrabold text-slate-900">₹{Number(tutor.fee_hourly).toLocaleString('en-IN')}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Trial class</div>
                  <div className="text-lg font-bold text-green-600">{Number(tutor.fee_trial) > 0 ? `₹${Number(tutor.fee_trial).toLocaleString('en-IN')}` : 'FREE'}</div>
                </div>
              </div>
              <Link to={`/book-demo?tutor=${tutor.slug}`} className="block text-center rounded-lg bg-brand-600 text-white py-3 text-sm font-bold hover:bg-brand-700">Book a Free Trial</Link>
              <Link to="/book-demo" className="block text-center rounded-lg bg-slate-100 text-slate-800 py-2.5 text-sm font-bold hover:bg-slate-200">Request this tutor</Link>
            </div>
          </div>
        </div>

        {/* RIGHT: details */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{tutor.name}</h1>
            {tutor.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-3 py-1 text-sm font-bold"><BadgeCheck className="h-4 w-4"/>Verified</span>
            )}
          </div>
          {tutor.tagline && <p className="mt-3 text-lg text-slate-600 leading-relaxed">{tutor.tagline}</p>}

          {/* quick facts */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {tutor.experience_years ? (
              <Fact icon={Clock} label="Experience" value={`${tutor.experience_years}+ years`} />
            ) : null}
            <Fact icon={ModeIcon} label="Teaching mode" value={modeLabel} />
            <Fact icon={MapPin} label="Location" value={[tutor.city, tutor.state].filter(Boolean).join(', ')} />
            {tutor.languages?.length ? <Fact icon={Globe} label="Languages" value={tutor.languages.join(', ')} /> : null}
          </div>

          {/* subjects */}
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-3">Subjects taught</h2>
            <div className="flex flex-wrap gap-2">
              {(tutor.subjects ?? []).map(s=>(
                <Link key={s} to={`/find-tutors?subject=${encodeURIComponent(s)}`} className="rounded-full bg-brand-50 text-brand-700 px-3 py-1.5 text-sm font-semibold hover:bg-brand-100">{s}</Link>
              ))}
            </div>
          </div>

          {/* qualification */}
          {tutor.qualification && (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-brand-600"/>Qualifications</h2>
              <p className="text-slate-600 leading-relaxed">{tutor.qualification}</p>
            </div>
          )}

          {/* bio */}
          {tutor.bio && (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-3">About {tutor.name}</h2>
              <p className="text-slate-600 leading-relaxed">{tutor.bio}</p>
            </div>
          )}

          {/* availability areas */}
          {tutor.localities?.length ? (
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-3">Available in</h2>
              <div className="flex flex-wrap gap-2">
                {tutor.localities.map(l=>(
                  <span key={l} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-sm">{l}</span>
                ))}
              </div>
            </div>
          ) : null}

          {/* why book */}
          <div className="mt-10 rounded-2xl bg-slate-50 p-6">
            <h2 className="text-lg font-bold mb-4">Why book with {tutor.name}?</h2>
            <ul className="space-y-2">
              {['Verified identity and qualifications','Personalised curriculum after your free trial','Progress tracked after every class','Flexible scheduling, easy rescheduling'].map(x=>(
                <li key={x} className="flex gap-2 items-start text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function Fact({ icon:Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 items-start rounded-xl ring-1 ring-slate-100 p-3">
      <Icon className="h-5 w-5 text-brand-600 mt-0.5 shrink-0"/>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-sm font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  );
}
