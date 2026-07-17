import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, Clock } from 'lucide-react';
import { fetchVideoCourses } from '../lib/api.js';

// Self-paced video-course catalog (point #4). Udemy-style: buy once, watch the
// whole playlist anytime. Free preview lessons hook the sale; paid lessons are
// gated until purchase (see VideoCourseDetailPage).

const inr = n => '₹' + Number(n).toLocaleString('en-IN');

function VideoCard({ c }) {
  return (
    <Link to={`/video-courses/${c.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative flex h-[150px] items-center justify-center bg-gradient-to-br from-[#0B1220] to-[#1E40AF] text-white">
        {c.thumbnail ? <img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover" loading="lazy" /> : <PlayCircle className="h-12 w-12 opacity-90" />}
        {c.level && <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">{c.level}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-[15px] font-bold leading-snug text-[#1A1A1A] group-hover:text-brand-600">{c.title}</h3>
        {c.subtitle && <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-slate-500">{c.subtitle}</p>}
        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" />{c.lesson_count} lessons</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />self-paced</span>
        </div>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-heading text-lg font-extrabold text-brand-600">{inr(c.price)}</span>
          <span className="text-[11px] text-slate-400">one-time · lifetime access</span>
        </div>
      </div>
    </Link>
  );
}

export default function VideoCoursesPage() {
  const { data: courses = [], isLoading } = useQuery({ queryKey: ['video-courses'], queryFn: fetchVideoCourses });

  return (
    <div className="mx-auto max-w-[1440px] px-[clamp(16px,4vw,40px)] pb-20 pt-7 text-slate-900">
      {/* HERO */}
      <section className="relative mb-7 overflow-hidden rounded-[22px] px-[clamp(24px,5vw,56px)] py-[46px] text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="relative max-w-[760px]">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">🎬 Self-paced · Watch anytime</span>
          <h1 className="font-heading mb-3 text-[1.9rem] font-extrabold leading-[1.08] min-[561px]:text-[2.5rem]">Video Courses</h1>
          <p className="mb-[22px] text-[1.05rem] leading-relaxed text-[#cbd5e1]">Structured lesson playlists you can watch anytime and rewatch as often as you like. Preview a few lessons free, then buy once for lifetime access.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/book-demo" className="rounded-[11px] bg-[#D4AF37] px-[22px] py-3 text-[0.92rem] font-bold text-[#0B1220] shadow-[0_8px_20px_rgba(212,175,55,.3)] transition hover:brightness-105">🎯 Book a Free Demo</Link>
            <Link to="/plans" className="rounded-[11px] border-[1.5px] border-white/60 px-[22px] py-3 text-[0.92rem] font-bold text-white transition hover:bg-white/[.12]">See Plans &amp; Pricing</Link>
          </div>
        </div>
      </section>

      <h2 className="font-heading mb-5 text-2xl font-extrabold tracking-tight text-[#0B1220]">Available Video Courses</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />)}</div>
      ) : courses.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {courses.map(c => <VideoCard key={c.slug} c={c} />)}
        </div>
      ) : (
        <p className="rounded-xl bg-[#F4F7FE] px-6 py-10 text-center text-slate-500">New video courses are coming soon — <Link to="/book-demo" className="font-semibold text-brand-600">book a free demo</Link> to learn live in the meantime.</p>
      )}
    </div>
  );
}
