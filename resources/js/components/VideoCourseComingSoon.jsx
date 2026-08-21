import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Clapperboard, CheckCircle2, Loader2, Send } from 'lucide-react';
import { requestVideoCourse } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

/**
 * What a visitor sees where the recorded-course player would be.
 *
 * The catalogue is not ready to sell, and the honest thing to do about that is
 * say so on the page rather than let someone reach a buy button that leads
 * nowhere. But a person who navigated this far has told us something worth
 * knowing, and simply apologising throws it away — so the page asks the one
 * question their visit answers: which subject should we record?
 *
 * Only the subject is required. Asking for a name, an email and a phone number
 * before accepting "please do Class 10 Physics" collects almost nothing, because
 * there is nothing to give back today. The cheap answer is the one worth having.
 */
export default function VideoCourseComingSoon({ course = null }) {
  const { isAuthed } = useAuth();

  // Pre-filled from the course they were looking at, and editable — the course
  // they clicked is a strong hint about what they want, not a certainty.
  const [form, setForm] = useState({
    subject: course?.title ?? '',
    level: '',
    name: '',
    email: '',
    phone: '',
    message: '',
    notify_me: false,
  });
  const [err, setErr] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const send = useMutation({
    mutationFn: () => requestVideoCourse({ ...form, video_course_id: course?.id ?? null }),
    onMutate: () => setErr(''),
    onError: (e) => setErr(
      e?.response?.data?.errors?.subject?.[0]
      || e?.response?.data?.message
      || 'Could not send that just now. Please try again.'
    ),
  });

  const inp = 'w-full rounded-lg border-0 px-3 py-2.5 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500';

  if (send.isSuccess) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-100">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900">Thank you — that is noted.</h2>
        <p className="mx-auto mt-2 max-w-lg text-slate-600">
          The more people ask for a subject, the sooner we record it.
          {form.notify_me && form.email
            ? ' We will email you when this one is ready.'
            : ''}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/courses" className="rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700">
            Browse live classes
          </Link>
          <Link to="/book-demo" className="rounded-full px-6 py-3 text-sm font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
            Book a free demo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
      <div className="bg-gradient-to-br from-[#0B1220] to-brand-800 px-6 py-8 text-white sm:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
          <Clapperboard className="h-3.5 w-3.5" /> Coming soon
        </span>
        <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">
          {course ? `“${course.title}” is being made` : 'Recorded courses are being made'}
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
          We are recording our video courses properly rather than rushing them out — filmed
          lessons, notes and practice, by the same teachers who take our live classes.
          Nothing here is on sale yet.
        </p>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <h3 className="text-lg font-extrabold text-slate-900">Which subject should we record first?</h3>
        <p className="mt-1 text-sm text-slate-500">
          Tell us and we will count it. Only the subject is needed — everything else is optional.
        </p>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={e => { e.preventDefault(); if (form.subject.trim()) send.mutate(); }}
        >
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Subject you want <span className="text-red-500">*</span>
            </label>
            <input value={form.subject} onChange={set('subject')} required maxLength={190}
              placeholder="e.g. Class 10 Physics, Spoken English, Tabla" className={inp} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Class or level</label>
            <input value={form.level} onChange={set('level')} maxLength={60}
              placeholder="e.g. Class 9, Beginner" className={inp} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Your name</label>
            <input value={form.name} onChange={set('name')} maxLength={120}
              placeholder={isAuthed ? 'From your account' : 'Optional'} className={inp} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
            <input type="email" value={form.email} onChange={set('email')} maxLength={190}
              placeholder={isAuthed ? 'From your account' : 'Optional'} className={inp} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Phone</label>
            <input value={form.phone} onChange={set('phone')} maxLength={30}
              placeholder="Optional" className={inp} />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">Anything specific you need covered?</label>
            <textarea rows={3} value={form.message} onChange={set('message')} maxLength={2000}
              placeholder="Optional — topics, board, exam you are preparing for" className={inp} />
          </div>

          <div className="sm:col-span-2">
            {/* Consent needs somewhere to deliver to. The server refuses to
                record this against a blank address, so the checkbox says so
                rather than silently doing nothing. */}
            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.notify_me} onChange={set('notify_me')}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <span>
                Email me when this course is ready.
                {/* Only nag someone we have no way of reaching. A signed-in
                    visitor's account address is used, so telling them to type
                    one in would be asking for something we already hold. */}
                {form.notify_me && !form.email.trim() && !isAuthed && (
                  <em className="ml-1 not-italic font-semibold text-amber-700">Add your email above and we will.</em>
                )}
                {form.notify_me && !form.email.trim() && isAuthed && (
                  <em className="ml-1 not-italic text-slate-500">We'll use your account email.</em>
                )}
              </span>
            </label>
          </div>

          {err && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
          )}

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={send.isPending || !form.subject.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50">
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send my request
            </button>
            <Link to="/book-demo" className="text-sm font-semibold text-brand-700 underline-offset-2 hover:underline">
              Or book a free live demo instead →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
