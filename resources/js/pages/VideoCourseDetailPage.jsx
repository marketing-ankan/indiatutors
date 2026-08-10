import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, Lock, CheckCircle2, ShoppingCart } from 'lucide-react';
import { fetchVideoCourse } from '../lib/api.js';
import { cart, videoCartItem, useCart } from '../lib/cart.js';
import { useAuth } from '../lib/auth.jsx';
import LessonPlayer from '../components/LessonPlayer.jsx';
import LessonAssistant from '../components/LessonAssistant.jsx';

// Video course detail — the gated playlist. Free-preview and owned lessons play
// in the embedded player; locked lessons show a padlock and a buy prompt. Buying
// requires an account (entitlements attach to a user), then adds to the cart and
// goes to checkout, reusing the Razorpay-ready order flow.

const inr = n => '₹' + Number(n).toLocaleString('en-IN');
const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function VideoCourseDetailPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { isAuthed } = useAuth();
  const inCart = useCart().some(i => i.slug === slug && i.kind === 'video');
  const { data, isLoading, isError } = useQuery({ queryKey: ['video-course', slug, isAuthed], queryFn: () => fetchVideoCourse(slug) });

  const lessons = data?.lessons ?? [];
  const firstPlayable = lessons.find(l => l.unlocked);
  const [activeId, setActiveId] = useState(null);
  const [ended, setEnded] = useState(false);

  // F2 "stop & ask": the moment a student engages the assistant, the video
  // stops talking over them. One function covers every provider we embed —
  // the R2 <video> is paused directly; YouTube (enablejsapi) and Bunny
  // (player.js protocol) are paused by postMessage. Unknown iframes ignore
  // the messages harmlessly, which is the right failure: never break the
  // page to pause a player.
  const playerWrap = useRef(null);
  const pauseActiveVideo = useCallback(() => {
    const root = playerWrap.current;
    if (!root) return;
    root.querySelectorAll('video').forEach(v => { try { v.pause(); } catch { /* ignore */ } });
    root.querySelectorAll('iframe').forEach(f => {
      try {
        f.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*'); // YouTube
        f.contentWindow?.postMessage(JSON.stringify({ context: 'player.js', version: '0.0.11', method: 'pause' }), '*'); // Bunny
      } catch { /* cross-origin refusals are fine */ }
    });
  }, []);
  useEffect(() => { if (firstPlayable && activeId == null) setActiveId(firstPlayable.id); }, [firstPlayable, activeId]);
  // Clear the finished banner whenever the lesson changes — including a switch
  // from the playlist, not just the Continue button, or it would hang over a
  // video the student has only just started.
  useEffect(() => { setEnded(false); }, [activeId]);

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading course…</div>;
  if (isError || !data?.data) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Course not found</h1>
      <Link to="/video-courses" className="mt-4 inline-block text-brand-600">← All video courses</Link>
    </div>
  );

  const course = data.data;
  const owned = course.owned;
  const active = lessons.find(l => l.id === activeId);
  // The next lesson they can actually watch — skipping locked ones, so
  // "Continue" never lands on a padlock.
  const nextPlayable = lessons.slice(lessons.findIndex(l => l.id === activeId) + 1).find(l => l.unlocked);
  const previews = lessons.filter(l => l.is_preview).length;

  const buy = () => {
    if (!isAuthed) { nav('/login'); return; }
    if (!inCart) cart.add(videoCartItem(course));
    nav('/cart');
  };

  return (
    <div className="bg-[#f9f9fc]">
      <div className="container-wide py-4 text-xs text-slate-500">
        <Link to="/" className="hover:text-brand-600">Home</Link> / <Link to="/video-courses" className="hover:text-brand-600">Video Courses</Link> / <span className="text-slate-700">{course.title}</span>
      </div>

      <div className="container-wide grid grid-cols-1 items-start gap-8 pb-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* PLAYER + PLAYLIST */}
        <div ref={playerWrap}>
          {active?.playback && active.playback_kind === 'video' ? (
            // R2 serves a bare presigned MP4, so we supply the controls: speed,
            // ±10s and keyboard shortcuts. iframe providers keep their own.
            <LessonPlayer src={active.playback} title={active.title} lessonId={active.id} onEnded={() => setEnded(true)} />
          ) : (
            <div className="overflow-hidden rounded-2xl bg-black shadow-lg">
              <div className="aspect-video">
                {active?.playback ? (
                  <iframe key={active.id} title={active.title} src={active.playback} className="h-full w-full" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                ) : active?.unlocked ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-white/80">
                    <PlayCircle className="h-10 w-10" />
                    <p className="text-sm">This lesson's video is being prepared — it will play here once the secure video host is connected.</p>
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white/80">
                    <Lock className="h-10 w-10" />
                    <p className="text-sm">Buy this course to watch the full playlist.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {active && <h2 className="font-heading mt-4 text-xl font-extrabold text-[#0B1220]">{active.title}</h2>}

          {/* F6 — the end of a lesson is a fork, not a dead stop: carry on, or
              ask about what you just watched. Both offered, neither assumed;
              auto-advancing would drag a confused student past the thing that
              confused them. */}
          {ended && active && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
              <p className="min-w-0 flex-1 text-sm font-semibold text-[#0B1220]">
                Finished “{active.title}”. {nextPlayable ? 'Ready for the next one?' : 'That is the last lesson in this course.'}
              </p>
              {nextPlayable && (
                <button onClick={() => { setEnded(false); setActiveId(nextPlayable.id); }}
                  className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-[#0B1220]">
                  Continue → {nextPlayable.title.length > 28 ? nextPlayable.title.slice(0, 28) + '…' : nextPlayable.title}
                </button>
              )}
              {active.has_ai && (
                <button onClick={() => { setEnded(false); document.getElementById('lesson-assistant')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
                  Ask anything about it
                </button>
              )}
            </div>
          )}

          {active?.has_ai && (
            <div id="lesson-assistant">
              <LessonAssistant courseId={course.id} lessonId={active.id} lessonTitle={active.title} onEngage={pauseActiveVideo} />
            </div>
          )}

          <div className="mt-6">
            <h3 className="font-heading mb-1 text-lg font-extrabold text-[#0B1220]">Course content</h3>
            <p className="mb-3 text-sm text-slate-500">{lessons.length} lessons · {previews} free preview{previews === 1 ? '' : 's'}</p>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white">
              {lessons.map((l, i) => {
                const isActive = l.id === activeId;
                return (
                  <button key={l.id} type="button" onClick={() => l.unlocked && setActiveId(l.id)} disabled={!l.unlocked}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${isActive ? 'bg-brand-50' : l.unlocked ? 'hover:bg-slate-50' : 'cursor-not-allowed'}`}>
                    <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}</span>
                    {l.unlocked
                      ? <PlayCircle className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                      : <Lock className="h-4 w-4 shrink-0 text-slate-400" />}
                    <span className={`flex-1 text-sm ${l.unlocked ? 'font-semibold text-slate-800' : 'text-slate-400'}`}>{l.title}</span>
                    {l.is_preview && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">FREE</span>}
                    {l.duration > 0 && <span className="text-xs text-slate-400">{mmss(l.duration)}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {course.description && (
            <div className="mt-8">
              <h3 className="font-heading mb-2 text-lg font-extrabold text-[#0B1220]">About this course</h3>
              <p className="leading-relaxed text-slate-600">{course.description}</p>
            </div>
          )}
        </div>

        {/* BUY RAIL */}
        <aside className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)] ring-1 ring-slate-100 lg:sticky lg:top-24">
          {course.level && <span className="mb-2 inline-block rounded-full bg-[#F3F6FC] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">{course.level}</span>}
          <h1 className="font-heading text-xl font-extrabold text-[#0B1220]">{course.title}</h1>
          {course.subtitle && <p className="mt-1 text-sm text-slate-500">{course.subtitle}</p>}

          {owned ? (
            <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">
              ✅ You own this course — every lesson is unlocked. Enjoy!
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-heading text-3xl font-extrabold text-brand-600">{inr(course.price)}</span>
                <span className="text-sm text-slate-400">one-time</span>
              </div>
              <button type="button" onClick={buy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-3.5 font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(30,64,175,.32)] transition hover:bg-[#0B1220]">
                <ShoppingCart className="h-4 w-4" /> {!isAuthed ? 'Log in to buy' : inCart ? 'In cart — go to checkout' : 'Buy this course'}
              </button>
              {!isAuthed && <p className="mt-2 text-center text-xs text-slate-400">A free account keeps your courses in one place.</p>}
            </>
          )}

          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            {['Lifetime access — watch anytime', 'Rewatch every lesson as often as you like', `${previews} free preview lesson${previews === 1 ? '' : 's'}`, 'Learn at your own pace'].map(t => (
              <li key={t} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{t}</li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
