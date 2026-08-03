import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, ShoppingBag } from 'lucide-react';
import { fetchMyVideoCourses } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

// The buyer's library. /my/video-courses has existed since the video-course
// module shipped, but nothing rendered it — so a student could buy a course
// with "Lifetime access" and have nowhere to go back to it from.

export default function MyCoursesPage() {
  const { isAuthed, isLoading: authLoading } = useAuth();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['my-video-courses'],
    queryFn: fetchMyVideoCourses,
    enabled: isAuthed,
  });

  if (authLoading) return <div className="container-wide py-20 text-slate-500">Loading…</div>;
  if (!isAuthed) return <Navigate to="/login" replace />;

  return (
    <div className="bg-[#f9f9fc] min-h-[60vh]">
      <div className="container-wide py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600">My Account</p>
        <h1 className="font-heading mt-1 text-3xl font-extrabold text-[#0B1220]">My Courses</h1>
        <p className="mt-2 text-sm text-slate-500">Every course you own, yours to rewatch whenever you like.</p>

        {isLoading ? (
          <p className="py-16 text-center text-slate-400">Loading your courses…</p>
        ) : courses.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map(c => (
              <Link key={c.slug} to={`/video-courses/${c.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(30,64,175,.08)] ring-1 ring-slate-100 transition hover:shadow-[0_8px_28px_rgba(30,64,175,.16)]">
                <div className="relative aspect-video bg-slate-100">
                  {c.thumbnail
                    ? <img src={c.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
                    : <div className="flex h-full items-center justify-center text-slate-300"><PlayCircle className="h-10 w-10" /></div>}
                  <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Owned</span>
                </div>
                <div className="p-4">
                  {c.level && <span className="text-[11px] font-bold uppercase tracking-wide text-brand-700">{c.level}</span>}
                  <h2 className="font-heading mt-0.5 text-base font-extrabold leading-snug text-[#0B1220] group-hover:text-brand-700">{c.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">{c.lesson_count} lesson{c.lesson_count === 1 ? '' : 's'}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600">
                    <PlayCircle className="h-4 w-4" /> Continue watching
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <ShoppingBag className="mx-auto h-9 w-9 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">You haven't bought a course yet.</p>
            <p className="mt-1 text-sm text-slate-500">Self-paced courses come with lifetime access — buy once, rewatch forever.</p>
            <Link to="/video-courses" className="mt-5 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#0B1220]">
              Browse video courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
