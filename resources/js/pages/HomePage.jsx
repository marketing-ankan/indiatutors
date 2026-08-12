import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Heart, ChevronLeft, ChevronRight, UserRound, Users, PlayCircle,
  Laptop, Home as HomeIcon, CalendarCheck, Rocket, Video, MessagesSquare,
  RotateCcw, CalendarX, Award, IndianRupee, Calculator, Code2, Music, Brain,
  Bot, Atom, Dna, PenTool, Radical, Castle, PersonStanding, Phone, Mail,
  ShieldCheck, Info, Pause, Play,
} from 'lucide-react';
import {
  COURSE_TABS, COURSE_PANELS, GROUP_TABS, GROUP_PANELS, TRENDING, VIDEO_COURSES,
  POPULAR_SUBJECTS, SUBJECT_TAGS, TEACHERS, TESTIMONIALS, WHY_ITEMS, PRICING,
  ABOUT_LEAD, ABOUT_LIST, ABOUT_STATS, HOW_STEPS, DEMO_VIDEOS,
} from '../data/homeLive.js';
import { BOARDS } from '../data/boards.js';

// Mirrors the live indiatutorsonline.com homepage (WP theme "ito-ud" / "ito-cb"
// sections) — same content, colors and layout, rebuilt in React + Tailwind.

const ICONS = {
  brain: Brain, code: Code2, bot: Bot, calculator: Calculator, atom: Atom, dna: Dna,
  music: Music, pen: PenTool, radical: Radical, castle: Castle, person: PersonStanding,
  video: Video, comments: MessagesSquare, refund: RotateCcw, nolock: CalendarX,
  cert: Award, rupee: IndianRupee, laptop: Laptop, home: HomeIcon, play: PlayCircle,
  search: Search, calendar: CalendarCheck, rocket: Rocket,
};

const CREAM = '#F9F9FC';
const BRAND_SOFT = '#F3F6FC';

const Eyebrow = ({ children, center }) => (
  <p className={`text-[13px] font-bold uppercase tracking-[.1em] text-brand-600 mb-1 ${center ? 'text-center' : ''}`}>{children}</p>
);
const H2 = ({ children, center, id }) => (
  <h2 id={id} className={`font-heading text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-[#1A1A1A] tracking-tight ${center ? 'text-center' : ''}`}>{children}</h2>
);
const Stars = ({ className = '' }) => (
  <span aria-hidden="true" className={`text-[#D4AF37] text-sm tracking-tight ${className}`}>★★★★★</span>
);

// ---------------------------------------------------------------- HERO ------
const HERO_SLIDES = [
  { src: '/build/images/home/carousel-1.webp', alt: 'AI and ML live classes' },
  { src: '/build/images/home/carousel-2.webp', alt: 'Python coding classes' },
  { src: '/build/images/home/carousel-3.webp', alt: 'Robotics classes for kids' },
];

function HeroSlider() {
  const n = HERO_SLIDES.length;
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(true);
  // Same split as TestimonialSlider: `stopped` is the explicit, sticky control,
  // `hovering` the transient courtesy pause. One shared flag would let a
  // mouseleave resume the slideshow the visitor had just pressed pause on.
  const [stopped, setStopped] = useState(false);
  const [hovering, setHovering] = useState(false);
  // Restarts the interval when a dot is chosen, so the visitor gets a full 5s on
  // the slide they picked rather than however much was left on the clock.
  const [nudge, setNudge] = useState(0);

  useEffect(() => {
    if (stopped || hovering) return;
    const t = setInterval(() => setIdx(i => (i >= n ? i : i + 1)), 5000);
    return () => clearInterval(t);
  }, [stopped, hovering, nudge]);

  // Seamless forward loop: an appended clone of slide 0 lets last→first slide
  // forward, then we snap back to the real slide 0 without a transition.
  useEffect(() => {
    if (idx === n) {
      const t = setTimeout(() => { setAnim(false); setIdx(0); }, 650);
      return () => clearTimeout(t);
    }
    if (!anim) {
      const r = requestAnimationFrame(() => setAnim(true));
      return () => cancelAnimationFrame(r);
    }
  }, [idx, anim, n]);

  const go = i => { setAnim(true); setIdx(i); setNudge(v => v + 1); };
  const active = idx % n;

  return (
    <div
      className="hidden lg:block relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 h-[520px]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      // Focus pauses too, not just hover. A keyboard user tabbing the dots below
      // otherwise watched the slide move out from under them.
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div className="flex h-full" style={{ transform: `translateX(-${idx * 100}%)`, transition: anim ? 'transform 650ms ease-in-out' : 'none' }}>
        {[...HERO_SLIDES, HERO_SLIDES[0]].map((s, i) => (
          // Only the first slide is eager. The container is `hidden lg:block`,
          // and an eager <img> inside a display:none subtree is still fetched by
          // every major browser — so mobile paid 705 KB for zero rendered
          // pixels. Lazy images in a display:none subtree are not fetched.
          <img key={i} src={s.src} alt={s.alt} className="w-full h-full shrink-0 object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {HERO_SLIDES.map((_, i) => (
          <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${active === i ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'}`} />
        ))}
        {/* The actual 2.2.2 mechanism. Pausing on hover/focus does nothing for a
            visitor who is simply looking at the slide, which is who the criterion
            exists for. items-center above keeps the 5px control aligned with the
            2px dots instead of letting the row top-align them. */}
        <button type="button" onClick={() => setStopped(s => !s)} aria-pressed={stopped}
          aria-label={stopped ? 'Play slideshow' : 'Pause slideshow'}
          className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-white/70 text-[#0B1220] transition-colors hover:bg-white">
          {stopped ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------- RICH COURSE CARD (ito-cb) -
function RichCourseCard({ c }) {
  return (
    <article className="group relative flex-shrink-0 w-[248px] sm:w-[263px] snap-start rounded-xl bg-white border border-[#E7E7EF] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-300">
      <Link to={`/courses/${c.slug}`} className="block h-[160px] sm:h-[185px] shrink-0 overflow-hidden">
        {c.img
          ? <span className="block h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${c.img}')` }} />
          : <span className="flex h-full w-full items-center justify-center text-[38px] text-white/90 font-heading font-bold bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] transition-transform duration-500 group-hover:scale-105">{c.title[0]}</span>}
      </Link>
      <button type="button" aria-label="Save to wishlist" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center text-slate-500 hover:text-red-500">
        <Heart className="h-4 w-4" />
      </button>
      <div className="p-3.5 flex flex-col flex-1">
        <h3 className="font-heading text-[15px] font-extrabold text-[#1A1A1A] leading-snug">
          <Link to={`/courses/${c.slug}`}>{c.title}</Link>
        </h3>
        <p className="mt-1 text-sm">
          <Stars /> <strong className="text-[#1A1A1A]">{c.rating}</strong> <span className="text-slate-500 text-xs">({c.reviews})</span>
        </p>
        <p className="mt-1.5 text-[13px] text-slate-500 leading-snug line-clamp-2">{c.desc}</p>
        <ul className="mt-2 space-y-1">
          {c.feats.map(f => (
            <li key={f} className="text-[12px] text-slate-600 flex gap-1.5 items-start"><i aria-hidden="true" className="not-italic text-brand-600 font-bold">✓</i>{f}</li>
          ))}
        </ul>
        <p className="mt-2.5 flex items-center flex-wrap gap-x-1.5 gap-y-1">
          <span className="text-[17px] font-extrabold text-brand-600">{c.now}</span>
          <span className="text-[11px] text-slate-500 line-through">{c.was}</span>
          <span className="text-[11px] font-bold text-green-600 bg-green-100 rounded-md px-1.5 py-0.5">40% OFF</span>
          <span className="text-[11px] text-slate-500">{c.per}</span>
        </p>
        <div className="mt-auto pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Link to={`/courses/${c.slug}`} className="text-center rounded-md border border-brand-600 text-brand-600 text-[12px] font-bold py-1.5 hover:bg-brand-50">View Details</Link>
            <Link to="/book-demo" className="text-center rounded-md border border-brand-600 text-brand-600 text-[12px] font-bold py-1.5 hover:bg-brand-50">Book Demo</Link>
          </div>
          <Link to={`/courses/${c.slug}`} className="mt-2 block text-center rounded-md bg-[#0B1220] text-white text-[12px] font-bold py-2 hover:bg-slate-800">Download Curriculum</Link>
        </div>
      </div>
    </article>
  );
}

// Tabbed course browser (All Courses / Group Classes), scraped 1:1 from live.
function CourseBrowser({ title, sub, viewAll, viewAllLabel, tabs, panels }) {
  const [cat, setCat] = useState(tabs[0].cat);
  const [subFilter, setSubFilter] = useState('All');
  const railRef = useRef(null);
  const panel = panels[cat];
  const slugify = s => s.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const cards = subFilter === 'All' ? panel.cards : panel.cards.filter(c => c.sub === slugify(subFilter));
  const scroll = dir => railRef.current?.scrollBy({ left: dir * 283, behavior: 'smooth' });

  return (
    <section className="py-12 bg-white">
      <div className="container-wide">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <H2>{title}</H2>
            <p className="mt-1 text-slate-500 text-sm">{sub}</p>
          </div>
          <Link to={viewAll} className="text-sm font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap">{viewAllLabel}</Link>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {tabs.map(t => (
            <button key={t.cat} type="button" onClick={() => { setCat(t.cat); setSubFilter('All'); }}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold border transition ${cat === t.cat
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-[#F3F6FC] text-brand-600 border-[#D7DAE0] hover:border-brand-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {panel.subs.map(s => (
            <button key={s} type="button" onClick={() => setSubFilter(s)}
              className={`rounded-md px-3 py-1 text-[12px] font-semibold border transition ${subFilter === s
                ? 'bg-brand-800 text-white border-brand-800'
                : 'bg-white text-slate-500 border-[#E7E7EF] hover:border-brand-300'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <button type="button" onClick={() => scroll(-1)} aria-label="Previous courses"
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-[34px] h-[34px] rounded-full bg-brand-600 text-white items-center justify-center shadow hover:bg-brand-700">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div ref={railRef} className="flex gap-5 overflow-x-auto snap-x pb-2 scrollbar-hide">
            {cards.map(c => <RichCourseCard key={c.slug} c={c} />)}
          </div>
          <button type="button" onClick={() => scroll(1)} aria-label="Next courses"
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-[34px] h-[34px] rounded-full bg-brand-600 text-white items-center justify-center shadow hover:bg-brand-700">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

// -------------------------------------------- DEMO CARD ROWS (trending etc.) -
function DemoCourseRow({ eyebrow, title, seeAllTo, cards, bg }) {
  return (
    <section className="py-12" style={{ background: bg }}>
      <div className="container-wide">
        <Eyebrow>{eyebrow}</Eyebrow>
        <div className="flex items-end justify-between mb-6">
          <H2>{title}</H2>
          <Link to={seeAllTo} className="text-sm font-bold text-brand-600 hover:text-brand-700 whitespace-nowrap">See all →</Link>
        </div>
        <div className="flex gap-5 overflow-x-auto snap-x pb-2 scrollbar-hide">
          {cards.map(c => (
            <div key={c.slug + c.title} className="group relative flex-shrink-0 w-[240px] sm:w-[260px] snap-start rounded-[14px] bg-white border border-[#E8E4FF] shadow-[0_2px_10px_rgba(0,0,0,.06)] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-300">
              {c.badge && <span className="absolute top-2.5 left-2.5 z-10 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">{c.badge}</span>}
              <div className="h-[150px] bg-[#F3F6FC] overflow-hidden">
                {c.img && <img src={c.img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />}
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-heading text-[15px] font-bold text-[#1A1A1A] leading-snug">{c.title}</h3>
                <p className="mt-1 text-[13px] text-slate-500 leading-snug">{c.desc}</p>
                <p className="mt-2 flex items-center flex-wrap gap-x-1.5 gap-y-1">
                  <span className="text-[16px] font-extrabold text-brand-600">{c.now}</span>
                  <span className="text-[11px] text-slate-500 line-through">{c.was}</span>
                  <span className="text-[11px] font-bold text-green-600 bg-green-100 rounded-md px-1.5 py-0.5">40% OFF</span>
                </p>
                <div className="mt-auto pt-3">
                  <Link to={`/courses/${c.slug}`} className="block text-center rounded-lg bg-brand-600 text-white text-[13px] font-bold py-2 hover:bg-brand-700">View course</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------- TESTIMONIAL SLIDER -
function TestimonialSlider() {
  const railRef = useRef(null);
  // Two separate pauses, deliberately. `stopped` is the explicit control WCAG
  // 2.2.2 actually asks for and it is sticky; `hovering` is the transient
  // courtesy pause. One shared flag would have resumed the carousel the moment
  // the pointer left the Pause button the visitor had just pressed.
  const [stopped, setStopped] = useState(false);
  const [hovering, setHovering] = useState(false);
  // Bumped on a manual prev/next so the interval restarts — otherwise the timer
  // could fire a fraction of a second after the visitor chose a slide themselves.
  const [nudge, setNudge] = useState(0);
  const scroll = dir => {
    const el = railRef.current; if (!el) return;
    const step = el.querySelector('blockquote')?.parentElement?.offsetWidth + 20 || 400;
    const atEnd = dir > 0 && el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
    el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + dir * step, behavior: 'smooth' });
  };
  const go = dir => { scroll(dir); setNudge(n => n + 1); };
  useEffect(() => {
    if (stopped || hovering) return;
    const t = setInterval(() => scroll(1), 6000);
    return () => clearInterval(t);
  }, [stopped, hovering, nudge]);
  return (
    // onFocus/onBlur are focusin/focusout in React, so they bubble — focusing
    // any control or card inside the group pauses, which is what a keyboard
    // user needs while reading.
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div ref={railRef} className="flex gap-5 overflow-x-auto snap-x pb-2 scrollbar-hide">
        {TESTIMONIALS.map(t => (
          <div key={t.name} className="flex-shrink-0 snap-start w-[86%] sm:w-[46%] lg:w-[31.5%]">
            <blockquote className="h-full rounded-[18px] bg-white border border-[#EEF1F6] shadow-[0_10px_30px_rgba(11,18,32,.06)] p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(11,18,32,.12)] hover:border-brand-200">
              <span aria-hidden="true" className="font-heading text-4xl leading-none text-brand-200">“</span>
              <Stars className="mt-1" />
              <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{t.text}</p>
              <footer className="mt-4 flex items-center gap-3">
                <span aria-hidden="true" className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm" style={{ background: t.color }}>{t.init}</span>
                <span>
                  <strong className="block text-sm text-slate-900">{t.name}</strong>
                  <span className="block text-xs text-slate-500">{t.role}</span>
                </span>
              </footer>
            </blockquote>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-center gap-3">
        <button type="button" onClick={() => go(-1)} aria-label="Previous testimonials" className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-brand-400"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => setStopped(s => !s)} aria-pressed={stopped}
          aria-label={stopped ? 'Play testimonials' : 'Pause testimonials'}
          className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-brand-400">
          {stopped ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Next testimonials" className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:border-brand-400"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------- PAGE ---
export default function HomePage() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const teacherRail = useRef(null);
  const scrollTeachers = dir => teacherRail.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  const FORMATS = [
    { Icon: UserRound, chip: 'bg-[#F3F6FC] text-brand-600', title: '1-on-1 Live Classes',
      desc: 'Private sessions with a dedicated tutor. Fully personalised pace, curriculum, and scheduling.',
      perks: ['Personalised curriculum', 'Flexible scheduling', 'Post-class mentoring'], cta: 'Book Free Trial', href: '/book-demo' },
    { Icon: Users, chip: 'bg-[#E0F7FB] text-[#00B4D8]', title: 'Live Group Classes',
      desc: 'Interactive small-group sessions. Learn with peers, ask questions live, and build friendships.',
      perks: ['Small batches (5–10 students)', 'Structured curriculum', 'Affordable group pricing'], cta: 'Browse Group Classes', href: '/group-classes' },
    { Icon: PlayCircle, chip: 'bg-[#FFF3E0] text-[#F77F00]', title: 'Self-Paced Video Courses',
      desc: 'Pre-recorded expert lessons you can watch anytime. Learn at your own pace, on your own schedule.',
      perks: ['Watch anytime, on any device', 'Quizzes and assignments', 'Certificate on completion'], cta: 'Browse Video Courses', href: '/video-courses' },
  ];

  const TRUST = [
    // "15+ Countries Served" removed 2026-08-10: the owner confirmed the
    // business is India-only, so it was a checkable claim that is not true.
    // Not replaced with a substitute number — five true stats beat six with a
    // padded one.
    ['120+', 'Courses Offered'], ['75+', 'Expert Tutors'],
    ['8,000+', 'Students Trained'], ['200+', 'Free Workshops Run'], ['100%', 'Free First Demo'],
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative bg-brand-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 opacity-90" />
        <div className="relative container-wide py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-white/90 mb-4">Live Classes · Video Courses · 1-on-1 Tutoring</p>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.3rem] font-extrabold leading-[1.12] tracking-tight">All The Expert Tutors You Need, In One Place</h1>
            <p className="mt-5 text-base sm:text-lg text-white/90 max-w-lg leading-relaxed">Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages & more — taught by India's top tutors.</p>
            <form onSubmit={e => { e.preventDefault(); if (q.trim()) nav(`/courses?search=${encodeURIComponent(q.trim())}`); }} role="search" aria-label="Search courses" className="mt-7 flex max-w-lg rounded-lg bg-white/95 overflow-hidden focus-within:ring-2 focus-within:ring-white/60">
              <span className="pl-4 self-center text-slate-400" aria-hidden="true"><Search className="h-4 w-4" /></span>
              {/* The form's aria-label names the search LANDMARK; this names the
                  field itself. Without it the input announces as an unnamed
                  "search edit text" — the placeholder is not an accessible name
                  and disappears as soon as anyone types into it. */}
              <input value={q} onChange={e => setQ(e.target.value)} type="search" aria-label="Search for a subject" placeholder="Search for a subject, e.g. Python, Violin, JEE Maths…" className="flex-1 bg-transparent text-slate-900 px-3 py-3 text-sm placeholder-slate-400 focus:outline-none min-w-0" />
              <button type="submit" className="bg-brand-600 hover:bg-brand-500 px-5 text-sm font-bold">Search</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/book-demo" className="rounded-lg bg-brand-500 hover:bg-brand-400 px-5 py-2.5 text-sm font-bold">Book a Free Trial</Link>
              <Link to="/courses" className="rounded-lg border border-white/40 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold">Explore All Courses</Link>
            </div>
            <p className="mt-5 text-sm text-white/75 flex items-center gap-2"><ShieldCheck className="h-4 w-4" aria-hidden="true" />No credit card · No commitment · Cancel anytime</p>
          </div>
          <HeroSlider />
        </div>
      </section>

      {/* CHOOSE HOW YOU WANT TO LEARN */}
      <section className="py-12 bg-white"><div className="container-wide">
        <H2 center>Choose How You Want to Learn</H2>
        <div className="mt-8 grid md:grid-cols-3 gap-5">
          {FORMATS.map(f => (
            <div key={f.title} className="group rounded-2xl bg-white border border-slate-100 shadow-sm p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-200">
              <span className={`inline-flex items-center justify-center w-14 h-14 rounded-[14px] ${f.chip} mb-4 transition-transform duration-300 group-hover:scale-110`}><f.Icon className="h-7 w-7" /></span>
              <h3 className="font-heading font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">{f.desc}</p>
              <ul className="space-y-2 text-sm text-slate-600 mb-5">
                {f.perks.map(p => <li key={p} className="flex gap-2 items-start"><i aria-hidden="true" className="not-italic text-brand-600 font-bold">✓</i>{p}</li>)}
              </ul>
              <Link to={f.href} className="mt-auto block text-center rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">{f.cta}</Link>
            </div>
          ))}
        </div>
      </div></section>

      {/* TRUST NUMBERS */}
      <section className="py-10" style={{ background: CREAM }}>
        <div className="container-wide grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
          {TRUST.map(([n, l]) => (
            <div key={l}>
              <div className="font-heading text-2xl font-extrabold text-brand-600">{n}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ALL THE COURSES YOU NEED IN ONE PLACE */}
      <CourseBrowser
        title="All The Courses You Need In One Place"
        sub="Choose from our most popular live online courses — across music, academics, coding, languages & more."
        viewAll="/courses" viewAllLabel="View all Courses →"
        tabs={COURSE_TABS} panels={COURSE_PANELS}
      />

      {/* TRENDING COURSES */}
      <DemoCourseRow eyebrow="Live & On-demand" title="Trending Courses" seeAllTo="/courses" cards={TRENDING} bg={CREAM} />

      {/* POPULAR VIDEO COURSES */}
      <DemoCourseRow eyebrow="Self-paced · Watch anytime" title="Popular Video Courses" seeAllTo="/video-courses" cards={VIDEO_COURSES} bg="#fff" />

      {/* GROUP CLASSES */}
      <CourseBrowser
        title="Group Classes"
        sub="Learn together in small, interactive batches — expert-led, affordable, and fun."
        viewAll="/group-classes" viewAllLabel="View all Group Classes →"
        tabs={GROUP_TABS} panels={GROUP_PANELS}
      />

      {/* ABOUT + HOW IT WORKS */}
      <section className="py-14" style={{ background: BRAND_SOFT }}>
        <div className="container-wide grid lg:grid-cols-2 gap-12">
          <div>
            <Eyebrow>Who we are</Eyebrow>
            <H2>About Indiatutors Online</H2>
            <p className="mt-4 text-slate-600 text-[15px] leading-relaxed">{ABOUT_LEAD}</p>
            <ul className="mt-6 space-y-4">
              {ABOUT_LIST.map(item => {
                const Icon = ICONS[item.icon];
                return (
                  <li key={item.t} className="group flex gap-3.5 items-start rounded-xl p-2 -m-2 transition-colors duration-300 hover:bg-white/70">
                    <span className="shrink-0 w-11 h-11 rounded-xl bg-white text-brand-600 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><Icon className="h-5 w-5" /></span>
                    <span>
                      <strong className="block text-slate-900">{item.t}</strong>
                      <em className="not-italic text-sm text-slate-500">{item.d}</em>
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ABOUT_STATS.map(([n, l]) => (
                <div key={l} className="rounded-xl bg-white p-3.5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <strong className="block font-heading text-lg text-brand-600">{n}</strong>
                  <span className="text-xs text-slate-500">{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>Getting started</Eyebrow>
            <H2>How It Works</H2>
            <div className="mt-6 space-y-5">
              {HOW_STEPS.map(s => {
                const Icon = ICONS[s.icon];
                return (
                  <div key={s.n} className="group flex gap-4 items-start rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold transition-transform duration-300 group-hover:scale-110">{s.n}</div>
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 flex items-center gap-2"><Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />{s.t}</h3>
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/book-demo" className="mt-7 inline-flex rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700">Book Your Free Trial Now</Link>
          </div>
        </div>
      </section>

      {/* BROWSE BY BOARD */}
      <section className="py-14" style={{ background: CREAM }}><div className="container-wide">
        <H2 center>Browse by Board</H2>
        <p className="mt-3 text-center text-slate-500 max-w-2xl mx-auto">Tuition aligned to your child's exact board — syllabus, exam pattern and marking scheme, from primary to Class 12.</p>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {BOARDS.map(b => (
            <Link key={b.slug} to={`/board/${b.slug}`}
              className="group rounded-[14px] bg-white border border-[#E8E4FF] p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300">
              <span className="block text-4xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">{b.icon}</span>
              <span className="mt-3 block text-[15px] font-bold text-[#1A1A1A] leading-snug">{b.name}</span>
              <span className="mt-1 block text-[11.5px] text-slate-500 leading-snug">{b.full}</span>
            </Link>
          ))}
        </div>
      </div></section>

      {/* MOST POPULAR SUBJECTS */}
      <section className="py-14 bg-white"><div className="container-wide">
        <H2 center>Most Popular Subjects</H2>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_SUBJECTS.map(s => {
            const Icon = ICONS[s.icon];
            return (
              <Link key={s.name} to={`/courses?search=${encodeURIComponent(s.q)}`}
                className="group rounded-[14px] bg-white border border-[#E8E4FF] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300">
                {s.tag
                  ? <span className="inline-block rounded-full text-white text-[10px] font-bold uppercase px-2 py-0.5 mb-2" style={{ background: SUBJECT_TAGS[s.tag] }}>{s.tag}</span>
                  : <span className="block h-[18px] mb-2" aria-hidden="true" />}
                <Icon className="h-6 w-6 text-brand-600 transition-transform duration-300 group-hover:scale-125" aria-hidden="true" />
                <span className="mt-2 block text-[14px] font-semibold text-[#1A1A1A] leading-snug">{s.name}</span>
                <span className="mt-1 block text-[13px] font-bold text-green-500">{s.price}</span>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link to="/courses" className="inline-flex rounded-lg border-2 border-brand-600/35 text-brand-600 px-6 py-2.5 text-sm font-bold hover:bg-brand-50">View All Subjects →</Link>
        </div>
      </div></section>

      {/* MEET OUR TEACHERS */}
      <section className="py-14" style={{ background: CREAM }}><div className="container-wide">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-7">
          <div>
            <Eyebrow>Vetted · Expert · Caring</Eyebrow>
            <H2>Meet Our Teachers</H2>
          </div>
          <Link to="/find-tutors" className="text-sm font-bold text-brand-600 hover:text-brand-700">See all teachers →</Link>
        </div>
        <div className="relative">
          <button type="button" onClick={() => scrollTeachers(-1)} aria-label="Previous teachers"
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-[34px] h-[34px] rounded-full bg-brand-600 text-white items-center justify-center shadow hover:bg-brand-700"><ChevronLeft className="h-5 w-5" /></button>
          <div ref={teacherRail} className="flex gap-5 overflow-x-auto snap-x pb-2 scrollbar-hide">
            {TEACHERS.map(t => (
              <article key={t.slug} className="group flex-shrink-0 snap-start w-[240px] sm:w-[260px] rounded-2xl bg-[#EEF3FC] border border-brand-600/10 shadow-[0_2px_12px_rgba(0,0,0,.07)] p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-300">
                <img src={t.img} alt={t.name} width="80" height="80" className="mx-auto w-20 h-20 rounded-full object-cover ring-2 ring-transparent transition-all duration-300 group-hover:scale-105 group-hover:ring-brand-300" loading="lazy" />
                <h3 className="mt-3 font-heading font-bold text-slate-900">{t.name}</h3>
                <p className="mt-1 text-[13px] text-slate-500 leading-snug min-h-[2.4rem]">{t.subj}</p>
                <p className="mt-1 text-xs text-slate-500">{t.exp}</p>
                <Link to={`/tutor/${t.slug}`} className="mt-4 inline-flex rounded-lg border-2 border-brand-600/35 text-brand-600 px-5 py-1.5 text-[13px] font-bold hover:bg-white">Book Trial</Link>
              </article>
            ))}
          </div>
          <button type="button" onClick={() => scrollTeachers(1)} aria-label="Next teachers"
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-[34px] h-[34px] rounded-full bg-brand-600 text-white items-center justify-center shadow hover:bg-brand-700"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div></section>

      {/* WATCH FREE DEMO CLASSES */}
      <section className="py-14 bg-white"><div className="container-wide">
        <Eyebrow center>See before you enrol</Eyebrow>
        <H2 center>Watch Free Demo Classes</H2>
        <div className="mt-8 grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {DEMO_VIDEOS.map(v => (
            <div key={v.id} className="group">
              <div className="rounded-xl overflow-hidden aspect-video bg-slate-900 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
                <iframe title={v.title} loading="lazy" width="560" height="315"
                  src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen className="w-full h-full" />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-slate-700 text-center">{v.caption}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/free-classes" className="inline-flex rounded-lg border-2 border-brand-600/35 text-brand-600 px-6 py-2.5 text-sm font-bold hover:bg-brand-50">See Free Workshops →</Link>
        </div>
      </div></section>

      {/* TESTIMONIALS */}
      <section className="py-14" style={{ background: CREAM }}><div className="container-wide">
        <Eyebrow center>Real results, real families</Eyebrow>
        <H2 center>What Students & Parents Say</H2>
        <div className="mt-8">
          <TestimonialSlider />
        </div>
      </div></section>

      {/* WHY FAMILIES CHOOSE US */}
      <section className="py-14 bg-white"><div className="container-wide">
        <H2 center>Why Families Choose Us</H2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {WHY_ITEMS.map(f => {
            const Icon = ICONS[f.icon];
            return (
              <div key={f.t} className="group rounded-[14px] bg-[#F8F7FF] p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white">
                <Icon className="h-6 w-6 text-brand-600 mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true" />
                <h3 className="font-heading font-semibold text-[17px] text-[#1A1A1A] mb-1.5">{f.t}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
              </div>
            );
          })}
        </div>
      </div></section>

      {/* PRICING */}
      <section className="py-14" style={{ background: CREAM }}><div className="container-wide">
        <Eyebrow center>Transparent · No hidden fees</Eyebrow>
        <H2 center>Simple, Honest Pricing</H2>
        <div className="mt-9 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PRICING.map(p => {
            const Icon = ICONS[p.icon];
            return (
              <div key={p.cat} className={`group relative rounded-[18px] bg-white p-8 text-center transition-all duration-300 hover:-translate-y-1.5 ${p.featured ? 'border-2 border-brand-600 shadow-[0_4px_24px_rgba(30,64,175,.18)] hover:shadow-[0_12px_36px_rgba(30,64,175,.28)]' : 'border-2 border-[#E8E4FF] hover:border-brand-300 hover:shadow-xl'}`}>
                {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 text-white px-4 py-1 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">Most Popular</span>}
                <span className="mx-auto w-[60px] h-[60px] rounded-2xl bg-[#F3F6FC] text-brand-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110"><Icon className="h-7 w-7" /></span>
                <h3 className="mt-4 font-heading font-bold text-lg text-[#1A1A1A]">{p.cat}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{p.subjects}</p>
                <div className="mt-4 font-heading text-[32px] font-extrabold text-brand-600">{p.rate}<span className="text-base font-semibold text-slate-500">/hour</span></div>
                <Link to="/book-demo" className="mt-5 inline-flex rounded-lg bg-brand-600 text-white px-6 py-2.5 text-sm font-bold hover:bg-brand-700">Book Free Trial</Link>
              </div>
            );
          })}
        </div>
        <p className="mt-7 text-center text-sm text-slate-500 flex items-center justify-center gap-2"><Info className="h-4 w-4 shrink-0" aria-hidden="true" />Group class pricing is lower. Video courses are one-time purchases. Contact us for custom packages and bulk session discounts.</p>
      </div></section>

      {/* CTA */}
      <section className="py-16 text-white" style={{ background: 'linear-gradient(145deg,#0B1220 0%,#1E40AF 100%)' }}>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight">Start with a Free Trial Class Today</h2>
          <p className="mt-4 text-white/90">No payment. No commitment. One class to see if it's the perfect fit — for your child and your schedule.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-demo" className="rounded-lg bg-white text-brand-700 hover:bg-slate-100 px-8 py-3 text-sm font-bold">Book a Free Trial</Link>
            <Link to="/contact" className="rounded-lg border border-white/40 hover:bg-white/10 px-8 py-3 text-sm font-semibold">Contact Us</Link>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-x-8 gap-y-3 justify-center text-sm text-white/85">
            <a href="tel:+919330811581" className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" aria-hidden="true" />+91 93308 11581</a>
            <a href="tel:+13023065099" className="inline-flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" aria-hidden="true" />(+1) 302 306 5099</a>
            <a href="mailto:connect@indiatutorsonline.com" className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" aria-hidden="true" />connect@indiatutorsonline.com</a>
          </div>
        </div>
      </section>
    </>
  );
}
