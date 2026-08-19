import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { submitDemoRequest, fetchCourse, fetchTutor, fetchStudents, fetchTutorSuggestions } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const empty = { name:'',email:'',phone_country_code:'+91',phone:'',subject:'',grade:'',board:'',mode:'online',city:'',country:'India',timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,message:'',whatsapp_consent:true,marketing_consent:false,course_id:null,student_id:null,requested_tutor_id:null };
const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

const WHY_LABEL = { subject: 'teaches this subject', grade: 'teaches this grade', 'home-visits': 'visits homes', 'same-city': 'in your city' };

/**
 * Pick your teacher, inside the booking flow (B1/B2 in docs/ECOSYSTEM-PLAN.md).
 *
 * The founder's system page draws the journey as search → suggestion → select →
 * demo, with the demo BEING the lead — so the shortlist belongs here rather than
 * only on the directory page, and choosing is what fills requested_tutor_id.
 *
 * Choosing stays OPTIONAL. A parent who does not know who they want should not
 * be blocked from asking for help; leaving it blank is the existing behaviour,
 * where a coordinator assigns someone.
 *
 * Each card says WHY it is suggested and links to the full profile, because the
 * requirement is that a family can check qualifications, availability and
 * reviews before committing. What it deliberately does NOT show is the ranking
 * score or conversion rate — those order the list, they are not a grade to
 * publish beside somebody's name.
 */
function TeacherShortlist({ subject, grade, city, mode, picked, onPick, onClear, lockedTo }) {
  // Debounced so typing a subject does not fire a request per keystroke.
  const [q, setQ] = useState({ subject, grade, city, mode });
  useEffect(() => {
    const id = setTimeout(() => setQ({ subject, grade, city, mode }), 400);
    return () => clearTimeout(id);
  }, [subject, grade, city, mode]);

  // A city alone only scores for HOME enquiries — TutorMatcher weighs city
  // inside the home branch, so an online enquiry with just a city can never
  // return anyone. Asking for the subject in that case beats promising
  // suggestions that will never arrive.
  const hasSubject = (q.subject?.trim()?.length ?? 0) >= 3;
  const wantsHome  = q.mode === 'home';
  const enabled    = !lockedTo && (hasSubject || (wantsHome && !!q.city?.trim()));
  const { data, isFetching } = useQuery({
    queryKey: ['tutor-suggestions', q],
    queryFn: () => fetchTutorSuggestions(q),
    enabled,
    staleTime: 60_000,
  });

  // Drop a pick the current criteria no longer support. Without this, choosing
  // a Physics teacher and then changing the subject to Piano left the old id in
  // the form — invisible (their card is gone) and unclearable (you cannot
  // re-click a card that is not rendered) — and it is load-bearing: it decides
  // whose conversion denominator this demo lands in and who the family is later
  // allowed to review.
  //
  // Must sit ABOVE the early returns: hooks cannot run conditionally, and
  // putting it after them crashed the whole page with React error #310.
  useEffect(() => {
    if (lockedTo || isFetching || !picked || !data) return;
    if (!(data.data ?? []).some(t => t.id === picked)) onClear();
    // Keyed on `data`, not on a derived rows array — that is rebuilt every
    // render and would re-run this forever.
  }, [lockedTo, isFetching, data, picked, onClear]);

  // Arrived from a tutor's own profile — the choice is already made.
  if (lockedTo) return null;

  if (!enabled) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 ring-1 ring-slate-100">
        {wantsHome
          ? "Enter a subject or your city above and we'll suggest teachers who fit"
          : "Enter a subject above and we'll suggest teachers who fit"}
        {' '}— or leave it to us and a coordinator will match you.
      </p>
    );
  }

  const rows = data?.data ?? [];

  // Nobody fits. This used to return null and vanish, on the reasoning that
  // silence beats a bad guess — right about the bad guess, wrong about the
  // silence, and it was a rare state only because the matcher used to fill the
  // list with anyone who taught the right CLASS. Now that a named subject is
  // genuinely required, "we list no Chess teacher yet" is an ordinary outcome,
  // and a section that quietly disappears mid-form reads as a broken page.
  //
  // Say it plainly instead, and keep the booking moving: a coordinator matches
  // these by hand anyway, so an unlisted subject is not a dead end — and this
  // is the lead-capture form, where an unexplained blank is the one thing that
  // makes someone give up.
  if (!isFetching && rows.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500 ring-1 ring-slate-100">
        We don't have a teacher listed for that yet — go ahead and book, and a coordinator
        will find you the right person.
      </p>
    );
  }

  return (
    <fieldset>
      <legend className="mb-1 block text-xs font-semibold text-slate-700">
        Choose a teacher <span className="font-normal text-slate-400">— optional, we'll match you if you skip it</span>
      </legend>
      {isFetching && rows.length === 0 ? (
        <p className="text-xs text-slate-400">Finding teachers who fit…</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map(t => {
            const on = picked === t.id;
            return (
              <li key={t.id}>
                <div className={`h-full rounded-xl border p-3 transition ${on ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-300' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
                  <button type="button" onClick={() => onPick(t.id)} aria-pressed={on}
                    className="flex w-full items-start gap-3 text-left">
                    {t.image_url
                      ? <img src={t.image_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" loading="lazy" />
                      : <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{t.name.slice(0, 1)}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-1.5">
                        <b className="text-sm text-slate-900">{t.name}</b>
                        {t.review_count > 0 && (
                          <span className="text-xs font-semibold text-amber-600">★ {t.review_avg} <span className="font-normal text-slate-400">({t.review_count})</span></span>
                        )}
                        {on && <span className="text-xs font-bold text-brand-700">✓ selected</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {(t.subjects || []).slice(0, 3).join(', ')}
                        {t.experience_years ? ` · ${t.experience_years} yrs` : ''}
                        {t.city ? ` · ${t.city}` : ''}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {(t.why || []).map(w => (
                          <span key={w} className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{WHY_LABEL[w] || w}</span>
                        ))}
                      </span>
                    </span>
                  </button>
                  <Link to={`/tutors/${t.slug}`} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700">
                    View full profile ↗
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}

// The live page's five booking flows — same form engine, different framing.
const BOOKING_TYPES = [
  { key:'demo',     pill:'Free Demo',       heading:'Book a Free Demo Class',       sub:'One-on-one session with world-class tutors.',            mode:'online', cta:'Request Free Demo' },
  { key:'group',    pill:'Group Classes',   heading:'Book a Free Group-Class Demo', sub:'Learn together in small, interactive batches.',          mode:'online', cta:'Request Group-Class Demo' },
  { key:'workshop', pill:'Workshops',       heading:'Book a Free Workshop',         sub:'Hands-on workshops, bootcamps & masterclasses.',         mode:'online', cta:'Reserve Workshop Seat' },
  { key:'free',     pill:'Free Classes',    heading:'Book a Free Class',            sub:'Try a complimentary class — zero cost, no card.',        mode:'online', cta:'Request Free Class' },
  { key:'physical', pill:'Physical Tutor',  heading:'Find a Physical Home Tutor',   sub:'Get a verified in-person tutor in your locality.',       mode:'home',   cta:'Find My Home Tutor' },
];

export default function BookDemoPage() {
  const [params] = useSearchParams();
  const courseSlug = params.get('course');
  const tutorSlug = params.get('tutor');
  const { user, isAuthed } = useAuth();
  // ?subject= prefill (exam dropdown, plan cards, course accordion CTAs)
  const [form, setForm] = useState({ ...empty, subject: params.get('subject') || '' });
  const [ok, setOk] = useState(false);
  // ?type= deep-links a specific flow (e.g. /book-demo?type=group)
  const [typeKey, setTypeKey] = useState(
    BOOKING_TYPES.some(t => t.key === params.get('type')) ? params.get('type') : 'demo'
  );
  const bookingType = BOOKING_TYPES.find(t => t.key === typeKey);
  const switchType = (t) => { setTypeKey(t.key); setForm(f => ({ ...f, mode: t.mode })); };

  // If arriving from a course or tutor page, resolve it to prefill nicely + link it.
  const { data: course } = useQuery({ queryKey:['course', courseSlug], queryFn:()=>fetchCourse(courseSlug), enabled: !!courseSlug });
  const { data: tutor }  = useQuery({ queryKey:['tutor', tutorSlug], queryFn:()=>fetchTutor(tutorSlug), enabled: !!tutorSlug });
  const { data: students = [] } = useQuery({ queryKey:['students'], queryFn: fetchStudents, enabled: isAuthed });
  useEffect(() => { if (course) setForm(f => ({ ...f, subject: f.subject || course.name, course_id: course.id })); }, [course]);
  // Arriving from a tutor's profile IS choosing that teacher — record it as the
  // requested tutor, not just as prose in the message box. Otherwise the most
  // deliberate choice a parent can make (they read the profile, then clicked
  // "book a demo") would be the one case that left requested_tutor_id empty.
  useEffect(() => {
    if (tutor) setForm(f => ({
      ...f,
      requested_tutor_id: f.requested_tutor_id ?? tutor.id,
      message: f.message || `I'd like to request a demo with ${tutor.name}.`,
    }));
  }, [tutor]);
  // Arriving from the Physical Classes / Home-Tuition or Board pages: switch to
  // the home-tutor flow and note the pincode/board in the message.
  useEffect(() => {
    const pincode = params.get('pincode'), board = params.get('board');
    if (pincode) { setTypeKey('physical'); setForm(f => ({ ...f, mode: 'home' })); }
    if (pincode || board) setForm(f => ({ ...f, message: f.message || [board && `Board: ${board}`, pincode && `Home tuition — my pincode is ${pincode}`].filter(Boolean).join('. ') }));
  }, [params]);
  // Prefill contact details for a signed-in user.
  useEffect(() => { if (user) setForm(f => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || '' })); }, [user]);

  const pickStudent = (id) => {
    const s = students.find(x => String(x.id) === String(id));
    setForm(f => ({ ...f, student_id: id ? Number(id) : null,
      grade: s?.grade || f.grade, board: s?.board || f.board, subject: s?.subjects || f.subject }));
  };

  // Record which flow was requested so the staff console can filter by it. The
  // message prefix stays for the rows that predate the `type` column and for
  // anyone reading the enquiry text on its own.
  const mutation = useMutation({
    mutationFn: () => submitDemoRequest({
      ...form,
      type: typeKey,
      message: typeKey === 'demo' ? form.message : `[${bookingType.heading}] ${form.message}`.trim(),
    }),
    // Reset, but keep what the URL asserted. On a ?tutor= page the banner still
    // says "Booking a demo for X", and the ?tutor= effect will not re-fire (its
    // dependency has not changed) — so a plain setForm(empty) left the second
    // booking silently crediting nobody while the page claimed otherwise.
    onSuccess: ()=>{ setOk(true); setForm({ ...empty, requested_tutor_id: tutor?.id ?? null, course_id: course?.id ?? null }); },
  });
  const set = k => e => setForm({...form, [k]: e.target.type==='checkbox'?e.target.checked:e.target.value});
  // Stable identities: TeacherShortlist runs an effect keyed on these, and a
  // fresh arrow every render would re-fire it on every keystroke.
  const pickTutor  = useCallback(id => setForm(f => ({ ...f, requested_tutor_id: f.requested_tutor_id === id ? null : id })), []);
  const clearTutor = useCallback(() => setForm(f => (f.requested_tutor_id === null ? f : { ...f, requested_tutor_id: null })), []);

  if (ok) return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto h-16 w-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl">✓</div>
      <h1 className="mt-6 text-2xl font-extrabold">Request received!</h1>
      <p className="mt-2 text-slate-600">Our team will reach out on WhatsApp within 24 hours to match a tutor and schedule your free demo.</p>
      <button onClick={()=>setOk(false)} className="mt-6 text-brand-600 font-semibold">Book another demo →</button>
    </div>
  );

  return (
    <div className="container-wide py-12">
      {/* Booking-flow pills, like the live page */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {BOOKING_TYPES.map(t => (
          <button key={t.key} type="button" onClick={()=>switchType(t)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${typeKey===t.key?'bg-brand-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {t.pill}
          </button>
        ))}
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">{bookingType.heading}</h1>
      <p className="text-slate-500 mt-2">{bookingType.sub} Fill this in and we'll match you with a verified tutor — it's free with no commitment.</p>
      {(course || tutor) && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-50 text-brand-700 px-3 py-1.5 text-sm font-medium ring-1 ring-brand-100">
          Booking a demo for <b>{course?.name || tutor?.name}</b>
        </div>
      )}
      <form onSubmit={e=>{e.preventDefault();mutation.mutate();}} className="mt-8 space-y-4 bg-white p-6 rounded-xl ring-1 ring-slate-100">
        {isAuthed && students.length > 0 && (
          <div className="rounded-lg bg-brand-50 ring-1 ring-brand-100 p-3">
            <label className="block text-xs font-semibold text-brand-800 mb-1">Which student is this demo for?</label>
            <select value={form.student_id ?? ''} onChange={e=>pickStudent(e.target.value)} className={inp}>
              <option value="">Not sure yet / myself</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}{s.grade?` · ${s.grade}`:''}</option>)}
            </select>
          </div>
        )}
        {/* One flowing grid, not four fixed two-field rows: the page is now
            full-bleed, and rows of two would have stretched each field across
            half a wide monitor. Flowing lets the columns multiply instead. */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Full name*</label><input required value={form.name} onChange={set('name')} className={inp}/></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Email*</label><input required type="email" value={form.email} onChange={set('email')} className={inp}/></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Phone*</label><input required value={form.phone} onChange={set('phone')} className={inp}/></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label><input value={form.subject} onChange={set('subject')} placeholder="e.g. Class 10 Math" className={inp}/></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
            <select value={form.grade} onChange={set('grade')} className={inp}>
              <option value="">Select…</option>
              {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','College','Adult'].map(g=><option key={g}>{g}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Board</label>
            <select value={form.board} onChange={set('board')} className={inp}>
              <option value="">Select…</option>
              {['CBSE','ICSE','IB','IGCSE','State','US','UK','Other'].map(b=><option key={b}>{b}</option>)}
            </select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
            <select value={form.mode} onChange={set('mode')} className={inp}><option value="online">Online</option><option value="home">Home tutor</option></select></div>
          <div><label className="block text-xs font-semibold text-slate-700 mb-1">City</label><input value={form.city} onChange={set('city')} className={inp}/></div>
        </div>
        <TeacherShortlist
          subject={form.subject} grade={form.grade} city={form.city} mode={form.mode}
          picked={form.requested_tutor_id}
          onPick={pickTutor}
          onClear={clearTutor}
          lockedTo={tutor}
        />

        <div><label className="block text-xs font-semibold text-slate-700 mb-1">Anything specific we should know?</label><textarea rows={3} value={form.message} onChange={set('message')} className={inp}/></div>
        <div className="space-y-2 text-sm text-slate-600">
          <label className="flex gap-2 items-start"><input type="checkbox" checked={form.whatsapp_consent} onChange={set('whatsapp_consent')} className="mt-1"/>You may contact me on WhatsApp about this demo.</label>
          <label className="flex gap-2 items-start"><input type="checkbox" checked={form.marketing_consent} onChange={set('marketing_consent')} className="mt-1"/>Send me occasional updates on new courses and offers.</label>
        </div>
        {mutation.isError && <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">{mutation.error?.response?.data?.message||'Something went wrong. Please try again.'}</div>}
        <button disabled={mutation.isPending} className="w-full rounded-lg bg-brand-600 text-white py-3 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
          {mutation.isPending?'Submitting…':bookingType.cta}
        </button>
      </form>
    </div>
  );
}
