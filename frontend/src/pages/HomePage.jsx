import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle2, Star, ChevronLeft, ChevronRight, MapPin, Clock, BadgeCheck, Users, Video, BookOpen, PlayCircle, Award } from 'lucide-react';
import { fetchCategoriesTree, fetchCourses, inr } from '../lib/api.js';

// ─── Real data from WordPress XML ─────────────────────────────────────────────
const TUTORS = [
  { name:'Rahul', slug:'rahul', tagline:'B.Tech · Python, AI/ML, Web Dev', subjects:'Python Programming, AI & Machine Learning', fee:700, city:'Kolkata', verified:true, categories:['Artificial Intelligence','Python Programming'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-68-760x1024-1.png' },
  { name:'Prashasti', slug:'prashasti', tagline:'University of Mumbai · Piano', subjects:'Piano', fee:650, city:'Kolkata', verified:true, categories:['Piano'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-67-760x1024-1.png' },
  { name:'Kainaaz', slug:'kainaaz', tagline:'Gold Medallist · Bharatnatyam, Ballet', subjects:'Bharatnatyam, Ballet, Contemporary Dance', fee:1000, city:'Kolkata', verified:true, categories:['Dance','Bharatnatyam'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-60-760x1024-1.png' },
  { name:'Anney', slug:'anney', tagline:'MBA · IELTS, Spoken English', subjects:'English, IELTS Training, Spoken English', fee:750, city:'Kolkata', verified:true, categories:['English Literature','Spoken English'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-59-760x1024-1.png' },
  { name:'Angeline', slug:'angeline', tagline:'Trinity College London · Piano & Violin', subjects:'Piano, Violin', fee:700, city:'Kolkata', verified:true, categories:['Piano','Violin / Viola'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-63-760x1024-1.png' },
  { name:'Pinki', slug:'pinki', tagline:'Gold Medallist · World Yoga Championships', subjects:'Yoga, Naturopathy, Wellness', fee:800, city:'Kolkata', verified:true, categories:['Yoga'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-61-760x1024-1.png' },
  { name:'Vipul', slug:'vipul', tagline:'B.Sc CS Delhi · Python, Java, Data Science', subjects:'Computer Science, Python, Java, Web Development', fee:750, city:'Kolkata', verified:true, categories:['Computer Science','Python Programming'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-71-760x1024-2.png' },
  { name:'Shamim', slug:'shamim', tagline:'Georgia State Conservatoire · Violin', subjects:'Violin, Music Theory, Piano', fee:800, city:'Kolkata', verified:true, categories:['Music Theory','Violin / Viola'], image:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Untitled-design-62-760x1024-2.png' },
];

const SUBJECTS = [
  { label:'AI & ML', icon:'🤖', tag:'TRENDING', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/AIML.webp' },
  { label:'Python Programming', icon:'🐍', tag:'POPULAR', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/PythonCarouselCover.webp' },
  { label:'Robotics', icon:'🦾', tag:'NEW', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/RoboticsCarouselCover.webp' },
  { label:'AP Courses', icon:'📚', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/APBiologyCarousel.webp' },
  { label:'AP Physics', icon:'⚛️', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/APPhysicsCarousel.webp' },
  { label:'AP Biology', icon:'🧬', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/APBiologyCarousel.webp' },
  { label:'Piano', icon:'🎹', tag:'POPULAR', img:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Piano-1.jpg' },
  { label:'Chess', icon:'♟️', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/Chess.jpg' },
  { label:'SAT Math', icon:'📐', tag:'TRENDING', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/SATEnglishThumbnail.webp' },
  { label:'Data Science', icon:'📊', tag:'NEW', img:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Data-Science.jpg' },
];

const STATS = [
  { n:'15+', l:'Years Experience' },
  { n:'120+', l:'Live Courses' },
  { n:'75+', l:'Expert Tutors' },
  { n:'8,000+', l:'Students Taught' },
  { n:'200+', l:'Workshops Held' },
  { n:'4.9 ★', l:'Average Rating' },
];

const WHY = [
  { icon: BadgeCheck,  t:'Live Interactive Sessions',     d:'Every class is live — no pre-recorded content. Interact directly with your tutor, ask questions in real time.' },
  { icon: Award,       t:'Power Class Monitoring',        d:'Each class is tracked. Your tutor updates the curriculum progress after every session so you always know where you stand.' },
  { icon: Star,        t:'Flexible Refund Policy',        d:'Not happy after the first class? Full refund. No questions. We believe you should try before you commit.' },
  { icon: Users,       t:'By Expert Commitment',          d:'Every tutor is verified, background-checked, and qualification-confirmed before they teach a single class on our platform.' },
  { icon: BookOpen,    t:'Certifications',                d:'Earn completion certificates for finished courses — shareable on LinkedIn and recognised by schools and colleges.' },
  { icon: CheckCircle2,t:'Value for Money',               d:'Starting at ₹3,499/month, our pricing is designed so quality education is accessible to every Indian family.' },
];

const PLANS = [
  { name:'🌱 Starter', sub:'Strong Foundations', price:3499, badge:'', features:['One-on-one live interactive sessions','Individually tailored curriculum','Covers academic and non-academic courses','Post-class doubt clearing support','Monthly progress report','Free trial class included'] },
  { name:'⚡ Advanced', sub:'Focused Learning', price:6999, badge:'Most Popular', features:['Small group sessions for collaborative learning','Specialised SAT / PSAT preparation','High school academic & AP course support','Bi-weekly parent progress calls','Certificate on completion','Free trial class included'] },
  { name:'🏆 Premium', sub:'Holistic Growth', price:11999, badge:'Best Value', features:['Live sessions with top-rated educators','Weekly one-on-one mentor sessions','Unlimited doubt clearing via chat','Priority scheduling and tutor selection','Recorded session playback','Certificate + LinkedIn credential'] },
];

// ─── Carousel hook ─────────────────────────────────────────────────────────────
function useCarousel(total, perView = 4, autoPlay = false) {
  const [idx, setIdx] = useState(0);
  const maxIdx = Math.max(0, total - perView);
  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(maxIdx, i + 1));
  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => setIdx(i => (i >= maxIdx ? 0 : i + 1)), 3500);
    return () => clearInterval(t);
  }, [maxIdx, autoPlay]);
  return { idx, prev, next, canPrev: idx > 0, canNext: idx < maxIdx };
}

// ─── Course card (compact) ─────────────────────────────────────────────────────
function MiniCourseCard({ course }) {
  const fallback = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="14" fill="white">${(course.name||'').slice(0,30)}</text></svg>`)}`;
  return (
    <Link to={`/courses/${course.slug}`} className="group flex-shrink-0 w-48 rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="h-28 bg-slate-100 overflow-hidden">
        <img src={course.image_url || fallback} alt={course.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => { e.currentTarget.src = fallback; }} loading="lazy" />
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold line-clamp-2 text-slate-800 leading-snug">{course.name}</p>
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-slate-500">4.8</span>
        </div>
        <p className="mt-1 text-sm font-bold text-brand-700">{inr(course.sale_price || course.regular_price)}</p>
        <button className="mt-2 w-full rounded bg-brand-600 text-white text-xs py-1 font-semibold hover:bg-brand-700">View course</button>
      </div>
    </Link>
  );
}

// ─── Tutor card ───────────────────────────────────────────────────────────────
function TutorCard({ tutor }) {
  return (
    <div className="flex-shrink-0 w-52 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all text-center p-4">
      <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden ring-2 ring-brand-100 mb-3">
        <img src={tutor.image} alt={tutor.name} className="w-full h-full object-cover object-top" loading="lazy" />
      </div>
      {tutor.verified && (
        <div className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs font-semibold mb-2">
          <BadgeCheck className="h-3 w-3" /> Verified
        </div>
      )}
      <h3 className="font-bold text-slate-900">{tutor.name}</h3>
      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{tutor.tagline}</p>
      <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{tutor.city}</p>
      <p className="text-sm font-bold text-brand-700 mt-2">₹{tutor.fee}/hr</p>
      <Link to="/book-demo" className="mt-2 block w-full rounded-lg bg-brand-600 text-white text-xs py-1.5 font-semibold hover:bg-brand-700">Book Trial</Link>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ className = '', children }) {
  return <section className={`py-14 ${className}`}><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div></section>;
}

function SectionHead({ eyebrow, title, sub, action, actionLabel = 'See all' }) {
  return (
    <div className="flex items-end justify-between mb-7">
      <div>
        {eyebrow && <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">{eyebrow}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        {sub && <p className="text-sm text-slate-500 mt-1">{sub}</p>}
      </div>
      {action && <Link to={action} className="text-sm font-semibold text-brand-600 hover:text-brand-700 whitespace-nowrap ml-4">{actionLabel} →</Link>}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const { data: categories = [] } = useQuery({ queryKey: ['categories', 'tree'], queryFn: fetchCategoriesTree });
  const { data: allCourses } = useQuery({ queryKey: ['courses', { per_page: 48 }], queryFn: () => fetchCourses({ per_page: 48 }) });
  const courses = allCourses?.data ?? [];

  const trendingCar = useCarousel(courses.length, 5, true);
  const tutorCar    = useCarousel(TUTORS.length, 4);
  const subjectCar  = useCarousel(SUBJECTS.length, 6);

  const onSearch = e => { e.preventDefault(); if (q.trim()) nav(`/courses?search=${encodeURIComponent(q.trim())}`); };

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 opacity-90" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-4 py-1.5 text-xs font-semibold tracking-wider mb-5">
              LIVE CLASSES · VIDEO COURSES · 1-ON-1 TUTORING
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight">
              All The Expert Tutors You Need, In One Place
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed">
              Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages &amp; more — taught by India's top tutors.
            </p>

            <form onSubmit={onSearch} className="mt-7 flex gap-2 max-w-lg">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search for a subject, e.g. Python, Violin, SAT Math…"
                className="flex-1 rounded-lg bg-white/95 text-slate-900 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60" />
              <button type="submit" className="rounded-lg bg-brand-500 hover:bg-brand-400 px-5 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                <Search className="h-4 w-4" /> Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/book-demo" className="rounded-lg bg-white text-brand-800 hover:bg-slate-100 px-5 py-2.5 text-sm font-bold">Book a Free Trial</Link>
              <Link to="/courses" className="rounded-lg border border-white/30 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold">Explore All Courses</Link>
            </div>

            {/* Trustpilot-style strip */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              <span className="text-sm text-slate-300 font-semibold">4.9 on Google</span>
              <span className="text-slate-500 text-xs">· 200+ verified reviews</span>
            </div>
          </div>

          {/* Hero image carousel */}
          <div className="hidden lg:block relative">
            <div className="absolute -inset-6 bg-brand-400/10 blur-3xl rounded-full" />
            <div className="relative grid grid-cols-2 gap-3">
              {[
                'https://indiatutorsonline.com/wp-content/uploads/2026/04/CarouselImage1.webp',
                'https://indiatutorsonline.com/wp-content/uploads/2026/04/CarouselImage2.webp',
                'https://indiatutorsonline.com/wp-content/uploads/2026/04/CarouselImage3-1-scaled.webp',
                'https://indiatutorsonline.com/wp-content/uploads/2026/04/CarouselImage3-3-scaled.webp',
              ].map((src, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden shadow-xl ${i === 0 ? 'col-span-2 h-48' : 'h-32'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" loading="eager" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── LEARN FORMAT CARDS ─────────────────────────────────────────────── */}
      <Section className="bg-white">
        <h2 className="text-2xl font-extrabold text-center mb-8 tracking-tight">Choose How You Want to Learn</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon:'👤', title:'1-on-1 Live Classes', color:'bg-blue-50 text-blue-700', features:['Fully personalised curriculum','Direct tutor attention','Flexible schedule','Post-class mentoring'], cta:'Book Free Trial', href:'/book-demo' },
            { icon:'👥', title:'Live Group Classes', color:'bg-purple-50 text-purple-700', features:['Small groups (4–8 students)','Collaborative learning','Affordable group pricing','Certificate on completion'], cta:'Browse Group Classes', href:'/courses?category=group-classes' },
            { icon:'📹', title:'Self-Paced Video Courses', color:'bg-orange-50 text-orange-700', features:['Watch anytime, anywhere','Structured curriculum','Take at your own pace','Lifetime access'], cta:'Browse Video Courses', href:'/courses?category=video-courses' },
          ].map(f => (
            <div key={f.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-md transition">
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-2xl ${f.color} mb-4`}>{f.icon}</div>
              <h3 className="font-bold text-lg mb-3">{f.title}</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {f.features.map(feat => (
                  <li key={feat} className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{feat}</li>
                ))}
              </ul>
              <Link to={f.href} className="mt-5 block text-center rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">{f.cta}</Link>
            </div>
          ))}
        </div>
      </Section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <div className="bg-brand-900 text-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
            {STATS.map(s => (
              <div key={s.l}>
                <div className="text-2xl font-extrabold text-brand-200">{s.n}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ALL COURSES (tabbed) ───────────────────────────────────────────── */}
      <Section className="bg-slate-50">
        <SectionHead title="All The Courses You Need In One Place" action="/courses" actionLabel="View all courses" />
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {categories.slice(0, 10).map(c => (
            <Link key={c.id} to={`/courses?category=${c.slug}`}
              className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700 transition">
              {c.name}
            </Link>
          ))}
        </div>
        {/* Course scroll */}
        <div className="relative">
          <button onClick={trendingCar.prev} disabled={!trendingCar.canPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="overflow-hidden">
            <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${trendingCar.idx * 208}px)` }}>
              {courses.map(c => <MiniCourseCard key={c.id} course={c} />)}
            </div>
          </div>
          <button onClick={trendingCar.next} disabled={!trendingCar.canNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Section>

      {/* ── TRENDING COURSES ──────────────────────────────────────────────── */}
      <Section className="bg-white">
        <SectionHead eyebrow="Live 1-on-1 Sessions" title="Trending Courses" action="/courses" actionLabel="See all" />
        <div className="relative">
          <button onClick={trendingCar.prev} disabled={!trendingCar.canPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="overflow-hidden">
            <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${trendingCar.idx * 208}px)` }}>
              {courses.slice(0, 16).map(c => <MiniCourseCard key={c.id} course={c} />)}
            </div>
          </div>
          <button onClick={trendingCar.next} disabled={!trendingCar.canNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Section>

      {/* ── ABOUT + HOW IT WORKS ──────────────────────────────────────────── */}
      <Section className="bg-slate-50">
        <div className="grid lg:grid-cols-2 gap-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">About Indiatutors Online</p>
            <h2 className="text-2xl font-extrabold mb-4">India's most trusted live tutoring platform</h2>
            <div className="relative rounded-2xl overflow-hidden mb-5 h-52">
              <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/AboutUsImage1.webp" alt="About us" className="w-full h-full object-cover" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              Indiatutors Online is a leading EdTech platform connecting students with expert educators for live interactive classes. We cover 100+ subjects — from CBSE Math to Bharatnatyam to Python — with verified tutors across India and for NRI families abroad.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[['8,000+','Students Taught'],['75+','Verified Tutors'],['15+','Years Experience'],['4.9 ★','Google Rating']].map(([n,l]) => (
                <div key={l} className="rounded-xl bg-white p-4 text-center ring-1 ring-slate-100">
                  <div className="text-xl font-extrabold text-brand-700">{n}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">How It Works</p>
            <h2 className="text-2xl font-extrabold mb-6">Start learning in 3 easy steps</h2>
            <div className="space-y-5">
              {[
                { n:'01', icon: Search, t:'Find Your Course', d:'Browse 120+ live courses or search by subject. Filter by grade, board, or learning mode.' },
                { n:'02', icon: PlayCircle, t:'Book a Free Trial', d:'Book a free 30-min demo class. Meet your tutor. No payment required.' },
                { n:'03', icon: CheckCircle2, t:'Start Learning', d:'Enrol, get your personalised curriculum, and start regular classes on your schedule.' },
              ].map(s => (
                <div key={s.n} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">{s.n}</div>
                  <div>
                    <h3 className="font-bold">{s.t}</h3>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/book-demo" className="mt-7 inline-flex rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700">Book Your Free Trial</Link>
          </div>
        </div>
      </Section>

      {/* ── MOST POPULAR SUBJECTS ─────────────────────────────────────────── */}
      <Section className="bg-white">
        <SectionHead title="Most Popular Subjects" action="/courses" actionLabel="View All Subjects" />
        <div className="relative">
          <button onClick={subjectCar.prev} disabled={!subjectCar.canPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="overflow-hidden">
            <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${subjectCar.idx * 160}px)` }}>
              {SUBJECTS.map(s => (
                <Link key={s.label} to={`/courses?search=${encodeURIComponent(s.label)}`}
                  className="group flex-shrink-0 w-36 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-100 hover:shadow-md transition">
                  <div className="h-20 overflow-hidden relative">
                    <img src={s.img} alt={s.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    {s.tag && (
                      <span className={`absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.tag==='TRENDING'?'bg-red-500 text-white':s.tag==='POPULAR'?'bg-brand-600 text-white':'bg-green-500 text-white'}`}>{s.tag}</span>
                    )}
                  </div>
                  <div className="p-2.5 bg-white">
                    <p className="text-xs font-bold text-slate-800 truncate">{s.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <button onClick={subjectCar.next} disabled={!subjectCar.canNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Section>

      {/* ── MEET OUR TEACHERS ─────────────────────────────────────────────── */}
      <Section className="bg-slate-50">
        <SectionHead eyebrow="Verified Educators" title="Meet Our Teachers" action="/find-tutors" actionLabel="All teachers →" />
        <div className="relative">
          <button onClick={tutorCar.prev} disabled={!tutorCar.canPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="overflow-hidden">
            <div className="flex gap-4 transition-transform duration-300" style={{ transform: `translateX(-${tutorCar.idx * 220}px)` }}>
              {TUTORS.map(t => <TutorCard key={t.slug} tutor={t} />)}
            </div>
          </div>
          <button onClick={tutorCar.next} disabled={!tutorCar.canNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </Section>

      {/* ── WATCH FREE DEMO CLASSES ───────────────────────────────────────── */}
      <Section className="bg-white">
        <SectionHead eyebrow="Try Before You Buy" title="Watch Free Demo Classes" />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { title:'Arts & Painting — Demo Class', thumb:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Arts-And-Painting-1.jpg', vid:'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { title:'Python for Beginners — Free Trial', thumb:'https://indiatutorsonline.com/wp-content/uploads/2026/04/PythonCarouselCover.webp', vid:'https://www.youtube.com/embed/dQw4w9WgXcQ' },
            { title:'Creative Writing — Sample Session', thumb:'https://indiatutorsonline.com/wp-content/uploads/2026/05/content-writing-course1s.jpg', vid:'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          ].map(v => (
            <div key={v.title} className="rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-100">
              <div className="relative aspect-video bg-slate-900">
                <img src={v.thumb} alt={v.title} className="w-full h-full object-cover opacity-70" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <PlayCircle className="h-8 w-8 text-brand-600" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm text-slate-800">{v.title}</p>
                <Link to="/book-demo" className="mt-2 text-xs text-brand-600 font-semibold hover:text-brand-700">Book your own free demo →</Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <Section className="bg-slate-50">
        <SectionHead eyebrow="Real Students · Real Parents" title="What Students & Parents Say" />
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { rating:5, text:'The no commitment policy was what convinced us to try Indiatutors Online. Best decision we made — our daughter\'s Math improved two grades in 3 months.', name:'Priya Sharma', role:'Parent, Class 9 student' },
            { rating:5, text:'We\'ve tried many online platforms but none matched the live interaction and personal curriculum here. Rahul Sir explains Python concepts brilliantly.', name:'Arjun Mehta', role:'Class 11 student' },
            { rating:5, text:'Our son has been taking Chess and Python classes for 6 months now. The progress tracker after every class is what sets this platform apart completely.', name:'Lakshmi Krishnamurthy', role:'Parent, Class 7 student' },
          ].map(t => (
            <div key={t.name} className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
              <div className="flex mb-3">
                {[...Array(t.rating)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">"{t.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">{t.name[0]}</div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── WHY FAMILIES CHOOSE US ────────────────────────────────────────── */}
      <Section className="bg-white">
        <SectionHead eyebrow="Why 8,000+ families trust us" title="Why Families Choose Us" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY.map(f => (
            <div key={f.t} className="rounded-xl p-5 ring-1 ring-slate-100 hover:shadow-sm transition">
              <f.icon className="h-7 w-7 text-brand-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-1">{f.t}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── SIMPLE HONEST PRICING ────────────────────────────────────────── */}
      <Section className="bg-slate-50">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">No hidden charges · Cancel any time</p>
          <h2 className="text-3xl font-extrabold tracking-tight">Simple, Honest Pricing</h2>
          <p className="text-slate-500 mt-2">First class is always free.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map(p => (
            <div key={p.name} className={`rounded-2xl bg-white p-6 ring-1 ${p.badge === 'Most Popular' ? 'ring-brand-500 shadow-xl' : 'ring-slate-100'} relative`}>
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 text-white px-4 py-1 text-xs font-bold whitespace-nowrap">{p.badge}</div>
              )}
              <h3 className="font-extrabold text-lg">{p.name}</h3>
              <p className="text-sm text-slate-500">{p.sub}</p>
              <div className="my-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex gap-2 items-start text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link to="/book-demo" className={`block text-center rounded-lg py-2.5 text-sm font-bold ${p.badge === 'Most Popular' ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>Get Started</Link>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">All prices in INR. GST extra where applicable. Individual hourly sessions also available.</p>
      </Section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-brand-900 text-white py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold">Ready to start learning?</h2>
          <p className="mt-3 text-slate-300">Book a free 30-minute demo class — no payment, no commitment. Meet your tutor and see if it's the right fit.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-demo" className="rounded-lg bg-white text-brand-800 hover:bg-slate-100 px-8 py-3 text-sm font-bold">Book Free Trial Now</Link>
            <Link to="/courses" className="rounded-lg border border-white/30 hover:bg-white/10 px-8 py-3 text-sm font-semibold">Browse All Courses</Link>
          </div>
        </div>
      </section>
    </>
  );
}
