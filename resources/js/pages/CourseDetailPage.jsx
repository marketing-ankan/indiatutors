import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Video, Users, Calendar, Clock, Baby } from 'lucide-react';
import { fetchCourse, inr } from '../lib/api.js';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useQuery({ queryKey:['course',slug], queryFn:()=>fetchCourse(slug) });

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-slate-500">Loading course…</div>;
  if (isError || !course) return <div className="mx-auto max-w-7xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Course not found</h1><Link to="/courses" className="text-brand-600 mt-4 inline-block">← Back to courses</Link></div>;

  const pills = course.pills ?? [];
  const curriculum = course.curriculum ?? [];

  return (
    <>
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div>
            <div className="text-xs text-slate-500 mb-2">
              <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/courses" className="hover:text-brand-600">Courses</Link>
              {course.categories?.[0] && <> / <Link to={`/courses?category=${course.categories[0].slug}`} className="hover:text-brand-600">{course.categories[0].name}</Link></>}
            </div>
            {pills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pills.map(p => (
                  <span key={p} className="rounded-full bg-brand-50 text-brand-700 px-2.5 py-0.5 text-xs font-semibold ring-1 ring-brand-100">{p}</span>
                ))}
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{course.name}</h1>
            {course.subtitle && <p className="mt-4 text-lg text-slate-600 leading-relaxed">{course.subtitle}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {course.age && <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200"><Baby className="h-3.5 w-3.5 text-brand-600"/>{course.age}</span>}
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[1fr_360px] gap-10 items-start">
        <div>
          <h2 className="text-2xl font-extrabold mb-4">About this course</h2>
          {course.description
            ? <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{__html: course.description}}/>
            : <p className="text-slate-500">{course.subtitle || 'Course description coming soon.'}</p>}

          {curriculum.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-extrabold mb-1">Curriculum</h2>
              <p className="text-sm text-slate-500 mb-6">A structured, level-by-level path — personalised further after your free demo.</p>
              <div className="space-y-4">
                {curriculum.map((level, i) => (
                  <div key={i} className="rounded-2xl ring-1 ring-slate-100 bg-white overflow-hidden">
                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-5 py-3 border-b border-slate-100">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">{i+1}</span>
                      <h3 className="font-bold text-slate-900">{level.title}</h3>
                      <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                        {level.age && <span className="inline-flex items-center gap-1"><Baby className="h-3.5 w-3.5"/>{level.age}</span>}
                        {level.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{level.duration}</span>}
                      </div>
                    </div>
                    {level.topics?.length > 0 && (
                      <ul className="p-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                        {level.topics.map((t, j) => (
                          <li key={j} className="flex gap-2 items-start text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/>{t}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl bg-brand-50 ring-1 ring-brand-100 p-6 lg:sticky lg:top-6">
          <h3 className="font-extrabold text-lg">Try it free first</h3>
          <p className="text-sm text-slate-600 mt-1">Book a no-commitment demo class. Meet your tutor, then decide.</p>
          <Link to={`/book-demo?course=${course.slug}`} className="mt-4 block text-center rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
        </aside>
      </div>
    </>
  );
}
