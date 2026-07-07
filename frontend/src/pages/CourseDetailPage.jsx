import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Video, Users, Calendar } from 'lucide-react';
import { fetchCourse, inr } from '../lib/api.js';

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => fetchCourse(slug),
  });

  if (isLoading) {
    return <div className="container-page py-20 text-slate-500">Loading course…</div>;
  }
  if (isError || !course) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Link to="/courses" className="text-brand-600 mt-4 inline-block">← Back to courses</Link>
      </div>
    );
  }

  return (
    <>
      {/* HERO */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="container-page py-10 grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div>
            <div className="text-xs text-slate-500 mb-2">
              <Link to="/" className="hover:text-brand-600">Home</Link>
              {' / '}
              <Link to="/courses" className="hover:text-brand-600">Courses</Link>
              {course.categories?.[0] && (
                <>
                  {' / '}
                  <Link to={`/courses?category=${course.categories[0].slug}`} className="hover:text-brand-600">
                    {course.categories[0].name}
                  </Link>
                </>
              )}
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight">{course.name}</h1>
            {course.short_description && (
              <p className="mt-4 text-lg text-slate-600 leading-relaxed">{course.short_description}</p>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              {course.categories?.map((c) => (
                <Link
                  key={c.id}
                  to={`/courses?category=${c.slug}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 hover:ring-brand-300"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* SIDE CARD */}
          <div className="rounded-xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden">
            {course.image_url && (
              <div className="aspect-video bg-slate-100">
                <img src={course.image_url} alt={course.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{inr(course.effective_price)}</span>
                {course.on_sale && (
                  <span className="text-base text-slate-400 line-through">{inr(course.regular_price)}</span>
                )}
                <span className="text-xs text-slate-500 ml-auto">per month*</span>
              </div>

              <Link to={`/book-demo?course=${course.slug}`} className="btn-primary w-full">
                Book a Free Demo
              </Link>
              <button className="btn-secondary w-full">Enroll Now</button>

              <ul className="pt-2 space-y-2 text-sm">
                <li className="flex gap-2 items-start"><Video className="h-4 w-4 mt-0.5 text-brand-600" /> Live 1-on-1 online classes</li>
                <li className="flex gap-2 items-start"><Users className="h-4 w-4 mt-0.5 text-brand-600" /> Personalised curriculum after demo</li>
                <li className="flex gap-2 items-start"><Calendar className="h-4 w-4 mt-0.5 text-brand-600" /> Flexible scheduling, reschedule anytime</li>
                <li className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 mt-0.5 text-brand-600" /> KYC-verified tutors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="container-page py-12 grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="prose prose-slate max-w-none">
          <h2>About this course</h2>
          {course.description
            ? <div dangerouslySetInnerHTML={{ __html: course.description }} />
            : <p className="text-slate-500">Course description coming soon.</p>}

          <h2>What you'll learn</h2>
          <ul>
            <li>Strong conceptual foundations aligned to your board (CBSE / ICSE / IB / IGCSE / State)</li>
            <li>Regular homework, doubt-clearing, and progress reviews</li>
            <li>Class-by-class curriculum tracker updated by your tutor after every session</li>
          </ul>

          <h2>How it works</h2>
          <ol>
            <li>Book a free 30-minute demo — tell us the subject, grade, and preferred timing.</li>
            <li>Meet a matched tutor. Confirm if the fit is right.</li>
            <li>Enroll, pick a plan, and start regular classes on your schedule.</li>
          </ol>
        </div>

        <div className="hidden lg:block">
          {/* Right-column intentionally blank — reserved for teacher card in Phase 3 */}
        </div>
      </div>
    </>
  );
}
