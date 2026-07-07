import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Video, Users, Calendar } from 'lucide-react';
import { fetchCourse, inr } from '../lib/api.js';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useQuery({ queryKey:['course',slug], queryFn:()=>fetchCourse(slug) });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-slate-500">Loading course…</div>;
  if (isError || !course) return <div className="mx-auto max-w-7xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Course not found</h1><Link to="/courses" className="text-brand-600 mt-4 inline-block">← Back to courses</Link></div>;

  return (
    <>
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div>
            <div className="text-xs text-slate-500 mb-2">
              <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/courses" className="hover:text-brand-600">Courses</Link>
              {course.categories?.[0] && <> / <Link to={`/courses?category=${course.categories[0].slug}`} className="hover:text-brand-600">{course.categories[0].name}</Link></>}
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{course.name}</h1>
            {course.short_description && <p className="mt-4 text-lg text-slate-600 leading-relaxed">{course.short_description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {course.categories?.map(c=>(
                <Link key={c.id} to={`/courses?category=${c.slug}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 hover:ring-brand-300">{c.name}</Link>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden">
            {course.image_url && <div className="aspect-video bg-slate-100"><img src={course.image_url} alt={course.name} className="w-full h-full object-cover"/></div>}
            <div className="p-5 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{inr(course.effective_price)}</span>
                {course.on_sale && <span className="text-base text-slate-400 line-through">{inr(course.regular_price)}</span>}
                <span className="text-xs text-slate-500 ml-auto">per month*</span>
              </div>
              <Link to={`/book-demo?course=${course.slug}`} className="block text-center rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
              <ul className="pt-2 space-y-2 text-sm">
                {[[Video,'Live 1-on-1 online classes'],[Users,'Personalised curriculum after demo'],[Calendar,'Flexible scheduling, reschedule anytime'],[CheckCircle2,'KYC-verified tutors']].map(([Icon,t])=>(
                  <li key={t} className="flex gap-2 items-start"><Icon className="h-4 w-4 mt-0.5 text-brand-600"/>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-extrabold mb-4">About this course</h2>
        {course.description
          ? <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{__html: course.description}}/>
          : <p className="text-slate-500">Course description coming soon.</p>}
      </div>
    </>
  );
}
