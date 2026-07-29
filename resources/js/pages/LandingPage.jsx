import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../lib/api.js';

// The four category-bar landing pages, ported from the live site's shared
// template: hero (eyebrow · title · tagline · demo/pricing CTAs), card grid
// (priced course cards or "Upcoming · Register Interest" cards), CTA band.
// The events page additionally lists real dated events (Staff Console-managed)
// above the interest grid, each linking to its /events/{slug} detail page.

const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

function DatedEvents() {
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: fetchEvents });
  const upcoming = events.filter(e => e.status === 'upcoming');
  if (!upcoming.length) return null;
  return (
    <section>
      <h2 className="text-2xl font-extrabold tracking-tight mb-5">Scheduled Events</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {upcoming.map(ev => (
          <Link key={ev.slug} to={`/events/${ev.slug}`}
            className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-5 flex flex-col gap-2 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-3xl">{ev.icon}</span>
              <span className="rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-[11px] font-bold">Free · Live</span>
            </div>
            <h3 className="font-bold text-slate-900">{ev.title}</h3>
            {ev.starts_at && <p className="text-sm text-slate-500">📅 {fmtDate(ev.starts_at)}{ev.ends_at ? ` – ${fmtDate(ev.ends_at)}` : ''} · {ev.mode}</p>}
            <span className="mt-auto pt-1 text-sm font-bold text-brand-600">View & register →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

const LANDINGS = {
  'video-courses': {
    eyebrow: '🎬 Self-paced · Watch anytime',
    title: 'Video Courses',
    tagline: 'Structured, self-paced video courses — learn anytime, revisit lessons and practise at your own speed.',
    section: 'Available Video Courses',
    cards: [
      { ic:'🎨', name:'Art & Painting', desc:'Colour theory, sketching and creative self-expression, lesson by lesson.', price:200, was:350, to:'/courses/arts-painting' },
      { ic:'✂️', name:'Art & Craft', desc:'Hands-on craft projects that build imagination and fine motor skills.', price:200, was:350, to:'/courses/art-and-craft' },
      { ic:'📐', name:'Vedic Maths', desc:'Mental-calculation shortcuts, lesson by lesson, at your own pace.', price:600, was:1000, to:'/courses/vedic-maths-grade-3-6' },
    ],
  },
  'events-workshops': {
    eyebrow: '🎉 Hands-on · Live',
    title: 'Events & Workshops',
    tagline: "Short, hands-on live workshops and competitions across our most popular subjects. Register your interest and we'll share the next batch dates.",
    section: 'Upcoming Workshops',
    cards: [
      { ic:'🎨', name:'Art & Painting', to:'/courses/arts-painting', upcoming:true },
      { ic:'✂️', name:'Art & Craft', to:'/courses/art-and-craft', upcoming:true },
      { ic:'🇪🇸', name:'Spanish Language', to:'/courses/spanish', upcoming:true },
      { ic:'🇫🇷', name:'French Language', to:'/courses/french', upcoming:true },
      { ic:'♟️', name:'Chess', to:'/courses/chess', upcoming:true },
      { ic:'🧩', name:"Rubik's Cube", to:'/courses/rubiks-cube', upcoming:true },
      { ic:'🐱', name:'Scratch', to:'/courses/scratch', upcoming:true },
      { ic:'🐍', name:'Python', to:'/courses/python', upcoming:true },
      { ic:'🏅', name:'Maths Olympiad (IMO)', to:'/courses/olympiad-preparation', upcoming:true },
      { ic:'🧮', name:'Abacus', to:'/courses/abacus', upcoming:true },
      { ic:'🦾', name:'Robotics', to:'/courses/robotics', upcoming:true },
      { ic:'🗣️', name:'Public Speaking', to:'/courses/public-speaking', upcoming:true },
    ],
  },
  'competitive-exams': {
    eyebrow: '🏅 Exam prep',
    title: 'Competitive Exams',
    tagline: "Focused, strategy-led coaching for India's entrance exams — built around the current exam patterns, NCERT fundamentals and timed practice.",
    section: 'Exam Coaching',
    cards: [
      { ic:'⚡', name:'JEE Main', desc:'Physics, Chemistry and Maths built up from the NCERT, with timed mocks.', price:1500, was:2500, to:'/courses/jee-main' },
      { ic:'🎯', name:'JEE Advanced', desc:'Advanced problem-solving and paper technique for the IIT entrance.', price:1800, was:3000, to:'/courses/jee-advanced' },
      { ic:'🧬', name:'NEET (UG)', desc:'Botany, Zoology, Physics and Chemistry with line-by-line NCERT mastery.', price:1500, was:2500, to:'/courses/neet-ug' },
      { ic:'📝', name:'CUET (UG)', desc:'General Test, language section and your chosen domain subjects.', price:1200, was:2000, to:'/courses/cuet-ug' },
      { ic:'🏅', name:'Olympiads (IMO / NSO / IEO)', desc:'Reasoning, subject depth and the Achievers section, Classes 1-10.', price:900, was:1500, to:'/courses/olympiad-preparation' },
    ],
  },
  'skill-programmes': {
    eyebrow: '💼 Future-ready skills',
    title: 'Skill Programmes',
    tagline: 'Career- and future-focused skill tracks for older learners. New cohorts are being scheduled — register your interest to be notified first.',
    section: 'Skill Tracks',
    cards: [
      { ic:'🧠', name:'AI & Machine Learning', to:'/courses/ai-ml', upcoming:true },
      { ic:'💬', name:'AI Prompting', to:'/courses/ai-prompting', upcoming:true },
      { ic:'📊', name:'Data Science', to:'/courses/data-science', upcoming:true },
      { ic:'🎨', name:'Graphics Design', to:'/courses/graphics-design', upcoming:true },
      { ic:'☁️', name:'AWS Cloud', to:'/courses/aws', upcoming:true },
      { ic:'⚙️', name:'DevOps', to:'/courses/devops', upcoming:true },
      { ic:'🎬', name:'Animation & VFX', to:'/courses/animation', upcoming:true },
      { ic:'🎤', name:'Public Speaking', to:'/courses/public-speaking', upcoming:true },
    ],
  },
};

const inr = n => '₹' + n.toLocaleString('en-IN');

export default function LandingPage({ page }) {
  const d = LANDINGS[page];
  if (!d) return null;
  return (
    <div className="bg-slate-50">
      <div className="container-wide py-8 space-y-8">
        {/* HERO */}
        <section className="rounded-3xl bg-gradient-to-br from-brand-800 to-[#0B1220] text-white p-8 sm:p-12">
          <p className="text-sm font-bold text-[#D4AF37] mb-2">{d.eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">{d.title}</h1>
          <p className="mt-3 text-slate-300 max-w-2xl leading-relaxed">{d.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book-demo" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-6 py-3 text-sm font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">🎯 Book a Free Demo</Link>
            <Link to="/plans" className="rounded-xl border border-white/60 px-6 py-3 text-sm font-bold hover:bg-white/10">See Plans & Pricing</Link>
          </div>
        </section>

        {/* REAL DATED EVENTS (events page only) */}
        {page === 'events-workshops' && <DatedEvents />}

        {/* CARD GRID */}
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight mb-5">{d.section}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {d.cards.map(c => (
              <article key={c.name} className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{c.ic}</span>
                  {c.upcoming && <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-[11px] font-bold">Upcoming</span>}
                </div>
                <h3 className="font-bold text-slate-900">{c.name}</h3>
                {c.desc && <p className="text-sm text-slate-500 leading-relaxed flex-1">{c.desc}</p>}
                {c.price && (
                  <p className="text-sm">
                    <span className="font-extrabold text-slate-900">{inr(c.price)}</span>{' '}
                    <span className="text-slate-400 line-through">{inr(c.was)}</span>{' '}
                    <span className="rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[11px] font-bold">40% OFF</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-auto pt-1">
                  {c.upcoming ? (
                    <>
                      <Link to="/book-demo" className="rounded-lg bg-brand-600 text-white px-3.5 py-2 text-xs font-bold hover:bg-brand-700">Register Interest</Link>
                      <Link to={c.to} className="rounded-lg ring-1 ring-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Details</Link>
                    </>
                  ) : (
                    <>
                      <Link to={c.to} className="rounded-lg bg-brand-600 text-white px-3.5 py-2 text-xs font-bold hover:bg-brand-700">View Details</Link>
                      <Link to="/book-demo" className="rounded-lg ring-1 ring-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Book Demo</Link>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA BAND */}
        <section className="rounded-2xl bg-gradient-to-br from-brand-800 to-[#0B1220] text-white p-8 text-center">
          <p className="text-lg text-slate-200 mb-4">Not sure where to start? Book a free demo and we'll guide you to the right course.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/book-demo" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-6 py-3 text-sm font-bold hover:brightness-105">🎯 Book a Free Demo</Link>
            <Link to="/contact" className="rounded-xl border border-white/60 px-6 py-3 text-sm font-bold hover:bg-white/10">Talk to Us</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
