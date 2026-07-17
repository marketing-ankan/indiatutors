import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Calendar, Clock, Users, Globe, CheckCircle2 } from 'lucide-react';
import { fetchEvent, submitContact } from '../lib/api.js';

// Event detail (WinQuest-approved feature, modelled on their Eventin pages):
// date-range hero with a live countdown, description, details grid, a register
// form (leads land in contact_messages), add-to-calendar links and related
// events.

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
const pad = n => String(n).padStart(2, '0');

function Countdown({ to }) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  if (!to) return null;
  return (
    <div className="mt-6 flex justify-center gap-3" aria-label="Countdown to event start">
      {[[d, 'days'], [h, 'hrs'], [m, 'min'], [s, 'sec']].map(([v, l]) => (
        <div key={l} className="w-[70px] rounded-xl border border-white/[.22] bg-white/[.12] py-2.5 text-center">
          <div className="font-heading text-2xl font-extrabold">{pad(v)}</div>
          <div className="text-[0.7rem] uppercase tracking-wider text-white/70">{l}</div>
        </div>
      ))}
    </div>
  );
}

const gcalDate = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');

function RegisterForm({ event }) {
  const [f, setF] = useState({ name: '', email: '', phone: '' });
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));
  const send = useMutation({
    mutationFn: () => submitContact({
      name: f.name, email: f.email, phone: f.phone || undefined,
      subject: `Event registration: ${event.title}`,
      message: `Registered interest for the event "${event.title}" (${event.slug}).`,
    }),
  });
  if (send.isSuccess) return (
    <div className="rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-800 ring-1 ring-green-100">
      🎉 You're registered! We'll confirm your batch dates on the email/phone you shared.
    </div>
  );
  const inp = 'w-full rounded-xl border-[1.5px] border-[#e6e8f0] px-4 py-3 text-[0.95rem] focus:border-brand-600 focus:outline-none';
  return (
    <form onSubmit={e => { e.preventDefault(); send.mutate(); }} className="space-y-3.5">
      <input required value={f.name} onChange={set('name')} placeholder="Your Name *" aria-label="Your name" className={inp} />
      <input required type="email" value={f.email} onChange={set('email')} placeholder="Email *" aria-label="Email" className={inp} />
      <input type="tel" value={f.phone} onChange={set('phone')} placeholder="WhatsApp / Phone" aria-label="Phone" className={inp} />
      <button type="submit" disabled={send.isPending}
        className="w-full rounded-full bg-brand-600 py-3.5 font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgba(30,64,175,.32)] transition hover:bg-[#0B1220] disabled:opacity-60">
        {send.isPending ? 'Registering…' : 'Register — it’s free'}
      </button>
      {send.isError && <p className="text-xs text-red-600">Could not register — please check the fields and try again.</p>}
    </form>
  );
}

export default function EventPage() {
  const { slug } = useParams();
  const { data, isLoading, isError } = useQuery({ queryKey: ['event', slug], queryFn: () => fetchEvent(slug) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading event…</div>;
  if (isError || !data?.data) return (
    <div className="container-wide py-20 text-center">
      <h1 className="text-2xl font-bold">Event not found</h1>
      <Link to="/events-workshops" className="mt-4 inline-block text-brand-600">← All events & workshops</Link>
    </div>
  );

  const ev = data.data;
  const related = data.related ?? [];
  const upcoming = ev.status === 'upcoming';
  const gcal = ev.starts_at && ev.ends_at
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title + ' — Indiatutors Online')}&dates=${gcalDate(ev.starts_at)}/${gcalDate(ev.ends_at)}&details=${encodeURIComponent(ev.description || '')}&location=${encodeURIComponent(ev.mode || 'Online')}`
    : null;

  return (
    <div className="bg-[#f9f9fc]">
      {/* HERO */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#0B1220,#1E40AF)' }}>
        <div aria-hidden="true" className="absolute -right-[50px] -top-[50px] h-[220px] w-[220px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.32),transparent 70%)' }} />
        <div className="container-wide relative py-14 text-center">
          <span className="mb-3.5 inline-block rounded-full border border-white/[.22] bg-white/[.14] px-3.5 py-1.5 text-[0.82rem] font-bold">
            {ev.icon} {upcoming ? 'Upcoming · Free live event' : 'Event'}
          </span>
          <h1 className="font-heading mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{ev.title}</h1>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[#cbd5e1]">
            {ev.starts_at && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{fmtDate(ev.starts_at)}{ev.ends_at ? ` – ${fmtDate(ev.ends_at)}` : ''}</span>}
            <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4" />{ev.mode || 'Online'}</span>
          </p>
          {upcoming && ev.starts_at && <Countdown to={ev.starts_at} />}
        </div>
      </section>

      {/* BODY */}
      <div className="container-wide grid max-w-5xl grid-cols-1 items-start gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 sm:p-8">
            <h2 className="font-heading mb-3 text-xl font-extrabold text-[#0B1220]">About this event</h2>
            <p className="leading-relaxed text-slate-700">{ev.description}</p>

            <h3 className="font-heading mb-3 mt-8 text-lg font-extrabold text-[#0B1220]">Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [Users, 'Batch size', ev.batch_size],
                [Clock, 'Session duration', ev.session_duration],
                [Calendar, 'Dates', ev.schedule_note],
                [Clock, 'Time', ev.time_note],
              ].filter(([, , v]) => v).map(([Icon, label, value]) => (
                <div key={label} className="rounded-xl border border-[#e6e8f0] bg-[#F4F7FE] p-4">
                  <div className="flex items-center gap-1.5 text-[0.72rem] font-bold uppercase tracking-[.07em] text-slate-500"><Icon className="h-3.5 w-3.5" />{label}</div>
                  <div className="mt-1 text-sm font-semibold text-[#0B1220]">{value}</div>
                </div>
              ))}
            </div>

            {gcal && (
              <p className="mt-6 text-sm text-slate-600">
                Add to calendar:{' '}
                <a href={gcal} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">Google Calendar →</a>
              </p>
            )}
          </div>

          {related.length > 0 && (
            <div className="mt-8">
              <h3 className="font-heading mb-4 text-lg font-extrabold text-[#0B1220]">Related events</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {related.map(r => (
                  <Link key={r.slug} to={`/events/${r.slug}`} className="rounded-2xl border border-[#E7E7EF] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                    <span className="text-2xl">{r.icon}</span>
                    <span className="font-heading mt-2 block font-bold text-[#0B1220]">{r.title}</span>
                    {r.starts_at && <span className="mt-1 block text-xs text-slate-500"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-green-500" />{fmtDate(r.starts_at)} · {r.mode}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* REGISTER RAIL */}
        <aside className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(30,64,175,.10)] ring-1 ring-slate-100 lg:sticky lg:top-24">
          <h2 className="font-heading mb-1 text-lg font-extrabold text-[#0B1220]">{upcoming ? 'Register your interest' : 'This event has ended'}</h2>
          {upcoming
            ? <><p className="mb-4 text-sm text-slate-500">Free to attend — batch dates are shared once registrations are in.</p><RegisterForm event={ev} /></>
            : <p className="text-sm text-slate-500">Missed it? <Link to="/events-workshops" className="font-semibold text-brand-600">See upcoming events →</Link></p>}
        </aside>
      </div>
    </div>
  );
}
