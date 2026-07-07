import { Link } from 'react-router-dom';
import { inr } from '../lib/api.js';
export default function CourseCard({ course }) {
  const fallback = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="14" fill="white">${(course.name||'').slice(0,30)}</text></svg>`)}`;
  return (
    <Link to={`/courses/${course.slug}`} className="group block rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="aspect-[5/3] bg-slate-100 overflow-hidden">
        <img src={course.image_url||fallback} alt={course.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e=>{e.currentTarget.src=fallback}} loading="lazy"/>
      </div>
      <div className="p-4">
        {course.categories?.[0] && <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1.5">{course.categories[0].name}</div>}
        <h3 className="font-semibold text-slate-900 line-clamp-2 min-h-[3rem]">{course.name}</h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-slate-900">{inr(course.effective_price)}</span>
          {course.on_sale && <span className="text-sm text-slate-400 line-through">{inr(course.regular_price)}</span>}
        </div>
      </div>
    </Link>
  );
}
