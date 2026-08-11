import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Star } from 'lucide-react';

export default function TutorCard({ tutor }) {
  const fb = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><rect width="300" height="300" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="80" fill="white">${(tutor.name||'?')[0]}</text></svg>`)}`;
  const subjects = tutor.subjects || [];
  return (
    <Link to={`/tutors/${tutor.slug}`} className="group block rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative">
        <img src={tutor.image_url || fb} alt={tutor.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onError={e=>{e.currentTarget.src=fb}} loading="lazy"/>
        {tutor.verified && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 text-green-700 px-2.5 py-1 text-xs font-bold shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5"/>Verified
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-lg">{tutor.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">{tutor.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {subjects.slice(0,3).map(s=>(
            <span key={s} className="rounded-full bg-brand-50 text-brand-700 px-2 py-0.5 text-[11px] font-semibold">{s}</span>
          ))}
          {subjects.length>3 && <span className="text-[11px] text-slate-500 px-1 py-0.5">+{subjects.length-3}</span>}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="h-3 w-3"/>{tutor.city}</span>
          <span className="text-sm font-bold text-brand-700">₹{Number(tutor.fee_hourly).toLocaleString('en-IN')}/hr</span>
        </div>
      </div>
    </Link>
  );
}
