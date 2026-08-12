import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTutor, submitContact, fetchTutorReviews, submitTutorReview } from '../lib/api.js';

// Tutor profile — 1:1 rebuild of the live /tutor/{slug} "ito-profile" template:
// gradient hero (✓ Verified Tutor badge, 180px circular photo, name, tagline,
// chips, Send Enquiry / Free Trial Class), a sticky quick-stats bar, then a
// two-column body: main sections (About, Subjects Taught, Availability &
// Location, Parent Reviews + review form) and a sidebar (fee card + enquiry
// form). Colours/typography follow the live --mp-* palette.

const NAVY = '#0B1220';
const BORDER = '#e8e8f0';
const MUTED = '#6b7280';

/** "16:00" → "4:00 PM". Times come from the server as 24h; parents read 12h. */
const fmtTime = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
};

const Section = ({ title, id, children }) => (
  <div id={id} className="mb-6 rounded-[14px] border bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)] sm:px-[30px] sm:py-7" style={{ borderColor: BORDER }}>
    <h2 className="font-heading mb-4 text-xl font-bold" style={{ color: NAVY }}>{title}</h2>
    {children}
  </div>
);

const SubjectTag = ({ children, soft }) => (
  <span className={`inline-block rounded-full border px-3.5 py-1.5 text-[0.85rem] font-semibold ${soft ? 'border-[#ddd] bg-[#f9f9fc] text-slate-600' : 'border-brand-100 bg-[#F3F6FC] text-brand-700'}`}>{children}</span>
);

const FormRow = ({ label, children }) => (
  <div className="mb-3.5">
    <label className="mb-1 block text-[0.83rem] font-semibold text-slate-700">{label}</label>
    {children}
  </div>
);
const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500';

const Stars = ({ n }) => (
  <span className="text-[#f59e0b]" aria-label={`${n} out of 5`}>{'★'.repeat(n)}<span className="text-slate-300">{'★'.repeat(5 - n)}</span></span>
);

/**
 * Parent Reviews — real, and only from families who actually had a demo.
 *
 * This section used to render a form whose submit handler called setSent(true)
 * and stored nothing, under an empty state that never fetched. Both are gone:
 * the list is live, and the form appears only when the API says this visitor
 * has a completed demo with this teacher to review.
 */
function TutorReviews({ slug }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['tutor-reviews', slug], queryFn: () => fetchTutorReviews(slug) });
  const reviews = data?.data ?? [];
  const summary = data?.summary;
  const gate = data?.can_review;

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);

  const submit = useMutation({
    mutationFn: () => submitTutorReview({ slug, rating, body, demo_id: gate?.demo_id }),
    onSuccess: () => { setSent(true); qc.invalidateQueries({ queryKey: ['tutor-reviews', slug] }); },
  });

  return (
    <>
      {summary?.rating_count > 0 && (
        <p className="mb-4 flex items-center gap-2 text-sm">
          <Stars n={Math.round(summary.rating_avg)} />
          <strong style={{ color: NAVY }}>{summary.rating_avg}</strong>
          <span style={{ color: MUTED }}>from {summary.rating_count} {summary.rating_count === 1 ? 'review' : 'reviews'}</span>
        </p>
      )}

      {reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map(r => (
            <li key={r.id} className="rounded-xl border p-4" style={{ borderColor: BORDER }}>
              <div className="flex flex-wrap items-center gap-2">
                <Stars n={r.rating} />
                <span className="text-sm font-bold" style={{ color: NAVY }}>{r.author_name}</span>
                <span className="text-xs" style={{ color: MUTED }}>{r.created_at}</span>
              </div>
              {r.body && <p className="mt-2 text-sm leading-relaxed text-slate-700">{r.body}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-500">No reviews yet — reviews here come only from families who have completed a demo class with this teacher.</p>
      )}

      {sent ? (
        <div className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">
          Thanks! Your review has been submitted for moderation.
        </div>
      ) : gate?.allowed ? (
        <div className="mt-5 rounded-xl border p-5" style={{ borderColor: BORDER, background: '#f9f9fc' }}>
          <h3 className="font-heading mb-3 font-bold" style={{ color: NAVY }}>Write a Review</h3>
          <form onSubmit={e => { e.preventDefault(); if (rating) submit.mutate(); }}>
            <FormRow label="Your Rating *">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} aria-label={`${i} star${i > 1 ? 's' : ''}`}
                    className={`text-2xl leading-none ${(hover || rating) >= i ? 'text-[#f59e0b]' : 'text-slate-300'}`}>★</button>
                ))}
              </div>
            </FormRow>
            <FormRow label="Your Review *">
              <textarea required rows={3} value={body} onChange={e => setBody(e.target.value)} className={inputCls}
                placeholder="How did the demo class go?" />
            </FormRow>
            <button type="submit" disabled={!rating || submit.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
              {submit.isPending ? 'Submitting…' : '⭐ Submit Review'}
            </button>
            {!rating && <p className="mt-2 text-xs" style={{ color: MUTED }}>Pick a star rating to submit.</p>}
            {submit.isError && (
              <p className="mt-2 text-xs text-red-600">
                {submit.error?.response?.data?.message || 'Could not submit your review — please try again.'}
              </p>
            )}
          </form>
        </div>
      ) : gate?.reason ? (
        // Say why, rather than silently hiding the form — a parent who took a
        // demo last week should understand what they are waiting for.
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm ring-1 ring-slate-100" style={{ color: MUTED }}>{gate.reason}</p>
      ) : null}
    </>
  );
}

function EnquiryForm({ tutor }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', subject_needed: '', message: '' });
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));
  const send = useMutation({
    mutationFn: () => submitContact({
      name: f.name,
      phone: f.phone,
      email: f.email || undefined,
      subject: `Tutor enquiry: ${tutor.name}`,
      message: [f.subject_needed && `Subject needed: ${f.subject_needed}`, f.message].filter(Boolean).join('\n') || `Enquiry for ${tutor.name}`,
    }),
  });
  if (send.isSuccess) return <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">📩 Enquiry sent — we'll connect you with {tutor.name} shortly.</div>;
  return (
    <form onSubmit={e => { e.preventDefault(); send.mutate(); }} noValidate={false}>
      <FormRow label="Your Name *"><input required value={f.name} onChange={set('name')} className={inputCls} placeholder="e.g. Ramesh Sharma" /></FormRow>
      <FormRow label="WhatsApp / Phone *"><input required type="tel" value={f.phone} onChange={set('phone')} className={inputCls} placeholder="+91 98765 43210" /></FormRow>
      <FormRow label="Email"><input type="email" value={f.email} onChange={set('email')} className={inputCls} placeholder="you@example.com" /></FormRow>
      <FormRow label="Subject Needed"><input value={f.subject_needed} onChange={set('subject_needed')} className={inputCls} placeholder="e.g. Class 10 Maths CBSE" /></FormRow>
      <FormRow label="Message"><textarea rows={3} value={f.message} onChange={set('message')} className={inputCls} placeholder="Briefly describe your requirement..." /></FormRow>
      <button type="submit" disabled={send.isPending} className="w-full justify-center rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
        {send.isPending ? 'Sending…' : '📩 Send Enquiry'}
      </button>
      {send.isError && <p className="mt-2 text-xs text-red-600">Could not send — please check the fields and try again.</p>}
    </form>
  );
}

export default function TutorProfilePage() {
  const { slug } = useParams();
  const { data: tutor, isLoading, isError } = useQuery({ queryKey: ['tutor', slug], queryFn: () => fetchTutor(slug) });
  // Both queries run BEFORE any early return — hooks cannot be conditional, and
  // putting this below the loading branch blanked the page with React #310.
  // Same cache key as TutorReviews below, so React Query serves one fetch and
  // the hero and the reviews section can never show different numbers.
  const { data: reviewData } = useQuery({ queryKey: ['tutor-reviews', slug], queryFn: () => fetchTutorReviews(slug) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading tutor…</div>;
  if (isError || !tutor) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Tutor not found</h1>
      <Link to="/find-tutors" className="mt-4 inline-block text-brand-600">← Back to all tutors</Link>
    </div>
  );

  const modeLabel = { online: 'Online', home: 'Home tuition', both: 'Online & Home' }[tutor.teaching_mode] || 'Online';
  const cityState = [tutor.city, tutor.state].filter(Boolean).join(', ');
  const fee = Number(tutor.fee_hourly || 0);
  const feeStr = `₹${fee.toLocaleString('en-IN')}`;
  const trialFree = !(Number(tutor.fee_trial) > 0);
  // Absent entirely when nobody has reviewed: a blank star row reads as a bad
  // score, and "no reviews yet" is the honest state for a new teacher.
  const ratingCount = reviewData?.summary?.rating_count ?? 0;
  const ratingAvg   = reviewData?.summary?.rating_avg;

  const stats = [
    [feeStr, 'Per Hour'],
    [modeLabel, 'Mode'],
    ...(ratingCount > 0 ? [[`★ ${ratingAvg}`, `${ratingCount} ${ratingCount === 1 ? 'review' : 'reviews'}`]] : []),
    ...(tutor.qualification ? [[tutor.qualification, 'Qualification']] : []),
    ...(tutor.verified ? [['✓ Yes', 'Verified']] : []),
  ];

  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO */}
      <section aria-label="Tutor profile" className="relative overflow-hidden text-white" style={{ background: `linear-gradient(145deg,${NAVY} 0%,#1E40AF 100%)` }}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-[420px] w-[420px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(30,64,175,.30) 0%,transparent 70%)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-[60px] -left-[60px] h-[280px] w-[280px] rounded-full" style={{ background: 'radial-gradient(circle,rgba(0,180,216,.16) 0%,transparent 70%)' }} />
        <div className="container-wide relative pt-[60px]">
          {tutor.verified && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-green-600/40 bg-green-600/[.18] px-3.5 py-[5px] text-[0.70rem] font-bold uppercase tracking-[.10em] text-green-300">✓ Verified Tutor</div>
          )}
          <div className="mt-[18px] grid items-end gap-9 sm:grid-cols-[200px_1fr]">
            <div>
              {tutor.image_url
                ? <img src={tutor.image_url} alt={tutor.name} width="180" height="180" className="block h-[180px] w-[180px] rounded-full border-4 border-white/25 bg-white/10 object-cover object-top" />
                : <div className="flex h-[180px] w-[180px] items-center justify-center rounded-full border-4 border-white/[.22] bg-white/10 text-[4rem]">👩‍🏫</div>}
            </div>
            <div className="pb-8">
              <h1 className="font-heading text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold leading-[1.15] tracking-tight">{tutor.name}</h1>
              {tutor.tagline && <p className="mt-2 max-w-[620px] text-white/[.78]">{tutor.tagline}</p>}
              <div className="mt-5 flex flex-wrap gap-2">
                {cityState && <span className="inline-flex items-center gap-1 rounded-full border border-white/[.18] bg-white/[.12] px-3 py-1 text-[0.78rem] font-medium text-white/[.88]">📍 {cityState}</span>}
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[.18] bg-white/[.12] px-3 py-1 text-[0.78rem] font-medium text-white/[.88]">🎓 {modeLabel}</span>
                {tutor.languages?.length > 0 && <span className="inline-flex items-center gap-1 rounded-full border border-white/[.18] bg-white/[.12] px-3 py-1 text-[0.78rem] font-medium text-white/[.88]">🗣️ {tutor.languages.join(', ')}</span>}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#enquire" className="font-heading inline-flex items-center gap-2 rounded-lg bg-white px-6 py-[11px] text-[0.88rem] font-semibold text-[#1E3A8A] transition hover:bg-[#F3F6FC]">📩 Send Enquiry</a>
                <a href="#enquire" className="font-heading inline-flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-[11px] text-[0.88rem] font-semibold text-white transition hover:bg-brand-800">🎉 Free Trial Class</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK STATS BAR */}
      <div role="region" aria-label="Quick stats" className="border-b bg-white shadow-[0_2px_12px_rgba(0,0,0,.06)]" style={{ borderColor: BORDER }}>
        <div className="container-wide">
          <div className="scrollbar-hide flex items-center overflow-x-auto">
            {stats.map(([val, label], i) => (
              <div key={label} className={`flex shrink-0 flex-col items-center whitespace-nowrap px-7 py-4 ${i < stats.length - 1 ? 'border-r' : ''}`} style={{ borderColor: BORDER }}>
                <span className={`font-heading text-lg font-bold leading-none ${label === 'Verified' ? 'text-green-600' : 'text-brand-600'}`}>{val}</span>
                <span className="mt-1 text-[0.72rem] uppercase tracking-[.06em]" style={{ color: MUTED }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="container-wide grid grid-cols-1 items-start gap-x-10 pb-24 pt-[52px] lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {tutor.bio && (
            <Section title="About">
              <p className="leading-[1.72] text-[#3d3d4e]">{tutor.bio}</p>
            </Section>
          )}

          <Section title="Subjects Taught">
            <div className="flex flex-wrap gap-2">
              {(tutor.subjects ?? []).map(s => <SubjectTag key={s}>{s}</SubjectTag>)}
            </div>
          </Section>

          <Section title="Availability & Location">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: '#f9f9fc' }}>
                <div className="text-[0.72rem] font-bold uppercase tracking-[.07em]" style={{ color: MUTED }}>Teaching Mode</div>
                <div className="mt-1 font-semibold" style={{ color: NAVY }}>{modeLabel}</div>
              </div>
              {cityState && (
                <div className="rounded-xl border p-4" style={{ borderColor: BORDER, background: '#f9f9fc' }}>
                  <div className="text-[0.72rem] font-bold uppercase tracking-[.07em]" style={{ color: MUTED }}>City</div>
                  <div className="mt-1 font-semibold" style={{ color: NAVY }}>{cityState}</div>
                </div>
              )}
            </div>
            {tutor.localities?.length > 0 && (
              <>
                <p className="mb-2 mt-5 text-[0.82rem] font-bold uppercase tracking-[.07em]" style={{ color: MUTED }}>Areas Served</p>
                <div className="flex flex-wrap gap-2">
                  {tutor.localities.map(l => <SubjectTag key={l} soft>{l}</SubjectTag>)}
                </div>
              </>
            )}

            {/* A2 — when they actually teach. Built from the structured weekly
                slots the teacher set, so a parent can check it fits before
                booking. Hidden entirely when a teacher has not set any: an
                invented timetable is worse than none. */}
            {tutor.availability?.length > 0 && (
              <>
                <p className="mb-2 mt-5 text-[0.82rem] font-bold uppercase tracking-[.07em]" style={{ color: MUTED }}>Weekly Availability</p>
                <ul className="divide-y rounded-xl border" style={{ borderColor: BORDER }}>
                  {tutor.availability.map(d => (
                    <li key={d.weekday} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                      <span className="text-sm font-bold" style={{ color: NAVY }}>{d.day}</span>
                      <span className="flex flex-wrap gap-1.5">
                        {d.ranges.map(r => (
                          <span key={`${r.from}-${r.to}`} className="rounded-full bg-[#F3F6FC] px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                            {fmtTime(r.from)} – {fmtTime(r.to)}
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs" style={{ color: MUTED }}>
                  Times shown in India Standard Time. Your coordinator will confirm the exact slot.
                </p>
              </>
            )}
          </Section>

          <Section title="Parent Reviews" id="reviews">
            <TutorReviews slug={slug} />
          </Section>
        </main>

        {/* SIDEBAR */}
        <aside id="enquire" aria-label="Fees and contact" className="mt-2 lg:mt-0">
          <div className="rounded-[14px] border bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)]" style={{ borderColor: BORDER }}>
            <div className="rounded-xl bg-[#F3F6FC] p-5 text-center">
              <div className="font-heading text-[2rem] font-extrabold leading-none text-brand-600">{feeStr}</div>
              <div className="mt-1 text-[0.78rem] uppercase tracking-[.06em]" style={{ color: MUTED }}>per hour</div>
            </div>
            <div className="mt-4 flex items-center justify-between border-b pb-3 text-sm" style={{ borderColor: BORDER }}>
              <span style={{ color: MUTED }}>Hourly Fee</span><span className="font-bold" style={{ color: NAVY }}>{feeStr}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span style={{ color: MUTED }}>Trial Class</span>
              <span className="font-bold text-green-600">{trialFree ? 'FREE' : `₹${Number(tutor.fee_trial).toLocaleString('en-IN')}`}</span>
            </div>
            {/* Both of these used to be href="#enquiry-form", which threw the
                visitor to the bottom of the page and recorded nothing — reading
                a profile and pressing Book is the most deliberate choice a
                parent makes, and it was being thrown away. /book-demo?tutor=
                already resolves the tutor and stores requested_tutor_id, so the
                choice now survives into the booking. */}
            <div className="mt-5 space-y-2.5">
              <Link to={`/book-demo?tutor=${tutor.slug}`}
                className="font-heading block rounded-lg bg-brand-600 px-8 py-3.5 text-center font-semibold text-white transition hover:bg-brand-800">Book a Trial Class</Link>
              {/* NOTE: this lands on the same flow as the button above. There is
                  no separate "paid ongoing session" booking type — the types are
                  demo / group / workshop / free / physical — so the two labels
                  promise a distinction the system does not make. Left for the
                  owner to decide: drop one, or add a real type behind it. */}
              <Link to={`/book-demo?tutor=${tutor.slug}`}
                className="font-heading block rounded-lg border-2 border-brand-600 px-6 py-[11px] text-center text-[0.88rem] font-semibold text-brand-600 transition hover:bg-[#F3F6FC]">Schedule Online Session</Link>
            </div>
          </div>

          <div id="enquiry-form" className="mt-6 rounded-[14px] border bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)]" style={{ borderColor: BORDER }}>
            <h3 className="font-heading mb-4 text-lg font-bold" style={{ color: NAVY }}>Send Enquiry to {tutor.name}</h3>
            <EnquiryForm tutor={tutor} />
          </div>
        </aside>
      </div>
    </div>
  );
}
