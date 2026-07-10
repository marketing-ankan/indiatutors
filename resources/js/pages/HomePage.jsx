import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, CheckCircle2, Star, ChevronLeft, ChevronRight, MapPin, BadgeCheck, Users, Video, BookOpen, PlayCircle, Award } from 'lucide-react';
import { fetchCategoriesTree, fetchCourses, fetchTutors, inr } from '../lib/api.js';


const SUBJECTS = [
  { label:'AI & ML', tag:'TRENDING', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/AIML.webp' },
  { label:'Python Programming', tag:'POPULAR', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/PythonCarouselCover.webp' },
  { label:'Robotics', tag:'NEW', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/RoboticsCarouselCover.webp' },
  { label:'AP Courses', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/APBiologyCarousel.webp' },
  { label:'AP Physics', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/APPhysicsCarousel.webp' },
  { label:'Piano', tag:'POPULAR', img:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Piano-1.jpg' },
  { label:'Chess', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/Chess.jpg' },
  { label:'SAT Math', tag:'TRENDING', img:'https://indiatutorsonline.com/wp-content/uploads/2026/04/SATEnglishThumbnail.webp' },
  { label:'Data Science', tag:'NEW', img:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Data-Science.jpg' },
  { label:'Bharatnatyam', tag:'', img:'https://indiatutorsonline.com/wp-content/uploads/2026/05/Bharatnatyam.jpg.jpeg' },
];

const STATS = [
  { n:'15+', l:'Countries Served' }, { n:'120+', l:'Courses Offered' }, { n:'75+', l:'Expert Tutors' },
  { n:'8,000+', l:'Students Trained' }, { n:'200+', l:'Free Workshops Run' }, { n:'4.9 ★', l:'Google Rating' },
];

const WHY = [
  { icon:BadgeCheck, t:'Live Interactive Sessions', d:'Every class is live — no pre-recorded content. Interact directly with your tutor, ask questions in real time.' },
  { icon:Award,      t:'Power Class Monitoring', d:'Each class is tracked. Your tutor updates the curriculum progress after every session.' },
  { icon:Star,       t:'Flexible Refund Policy', d:'Not happy after the first class? Full refund. No questions.' },
  { icon:Users,      t:'Expert Commitment', d:'Every tutor is verified, background-checked, and qualification-confirmed before they teach.' },
  { icon:BookOpen,   t:'Certifications', d:'Earn completion certificates for finished courses — shareable on LinkedIn.' },
  { icon:CheckCircle2,t:'Value for Money', d:'Starting at ₹3,499/month, quality education accessible to every Indian family.' },
];

const PLANS = [
  { name:'🌱 Starter', sub:'Strong Foundations', price:3499, badge:'', features:['One-on-one live interactive sessions','Individually tailored curriculum','Post-class doubt clearing','Monthly progress report','Free trial class'] },
  { name:'⚡ Advanced', sub:'Focused Learning', price:6999, badge:'Most Popular', features:['Group sessions for collaborative learning','Specialised SAT/PSAT preparation','AP course support','Bi-weekly parent progress calls','Certificate on completion'] },
  { name:'🏆 Premium', sub:'Holistic Growth', price:11999, badge:'Best Value', features:['Sessions with top-rated educators','Weekly one-on-one mentor sessions','Unlimited doubt clearing via chat','Priority scheduling','Recorded session playback'] },
];

// Hero image slider — mirrors the live site's Swiper (.ito-ud-swiper-hero):
// 3 slides, loop, 5s autoplay, pagination dots, horizontal slide transition.
const HERO_SLIDES = [
  { src:'https://indiatutorsonline.com/wp-content/themes/indiatutorsonline-theme/hero-carousel-images/CarouselImage1.webp', alt:'AI and ML live classes' },
  { src:'https://indiatutorsonline.com/wp-content/themes/indiatutorsonline-theme/hero-carousel-images/CarouselImage2.webp', alt:'Python coding classes' },
  { src:'https://indiatutorsonline.com/wp-content/themes/indiatutorsonline-theme/hero-carousel-images/CarouselImage3.webp', alt:'Robotics classes for kids' },
];

function HeroSlider() {
  const n = HERO_SLIDES.length;
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    // Stop at the clone (i === n); the reset effect snaps back to 0. Never overrun into a blank frame.
    const t = setInterval(() => setIdx(i => (i >= n ? i : i + 1)), 5000);
    return () => clearInterval(t);
  }, [paused]);

  // Seamless forward loop: an appended clone of slide 0 lets 2→0 slide forward,
  // then we snap back to the real slide 0 without a transition.
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

  const go = i => { setAnim(true); setIdx(i); };
  const active = idx % n;

  return (
    <div
      className="hidden lg:block relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 h-[520px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex h-full" style={{ transform:`translateX(-${idx*100}%)`, transition: anim ? 'transform 650ms ease-in-out' : 'none' }}>
        {[...HERO_SLIDES, HERO_SLIDES[0]].map((s,i) => (
          <img key={i} src={s.src} alt={s.alt} className="w-full h-full shrink-0 object-cover" loading="eager"/>
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {HERO_SLIDES.map((_,i) => (
          <button key={i} onClick={()=>go(i)} aria-label={`Go to slide ${i+1}`}
            className={`h-2 rounded-full transition-all ${active===i?'w-6 bg-white':'w-2 bg-white/60 hover:bg-white/90'}`}/>
        ))}
      </div>
    </div>
  );
}

function useCarousel(total, perView) {
  const [idx, setIdx] = useState(0);
  const maxIdx = Math.max(0, total - perView);
  return { idx, prev:()=>setIdx(i=>Math.max(0,i-1)), next:()=>setIdx(i=>Math.min(maxIdx,i+1)), canPrev:idx>0, canNext:idx<maxIdx };
}

function MiniCourseCard({ course }) {
  const fb = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="14" fill="white">${(course.name||'').slice(0,28)}</text></svg>`)}`;
  return (
    <Link to={`/courses/${course.slug}`} className="group flex-shrink-0 w-48 rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="h-28 bg-slate-100 overflow-hidden">
        <img src={course.image_url||fb} alt={course.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e=>{e.currentTarget.src=fb}} loading="lazy"/>
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold line-clamp-2 text-slate-800 leading-snug min-h-[2rem]">{course.name}</p>
        <div className="mt-2 flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400"/><span className="text-xs text-slate-500">4.8</span></div>
        <p className="mt-1 text-sm font-bold text-brand-700">{inr(course.sale_price||course.regular_price)}</p>
        <button className="mt-2 w-full rounded bg-brand-600 text-white text-xs py-1 font-semibold hover:bg-brand-700">View course</button>
      </div>
    </Link>
  );
}

function HomeTutorCard({ t }) {
  const fb = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><rect width="200" height="240" fill="#1e3a8a"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Inter,sans-serif" font-size="70" fill="white">${(t.name||'?')[0]}</text></svg>`)}`;
  const subjects = Array.isArray(t.subjects) ? t.subjects : [];
  return (
    <div className="flex-shrink-0 w-52 rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all text-center p-4">
      <Link to={`/tutors/${t.slug}`} className="block">
        <div className="relative mx-auto w-20 h-20 rounded-full overflow-hidden ring-2 ring-brand-100 mb-3">
          <img src={t.image_url || fb} alt={t.name} className="w-full h-full object-cover object-top" onError={e=>{e.currentTarget.src=fb}} loading="lazy"/>
        </div>
        {t.verified && <div className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-xs font-semibold mb-2"><BadgeCheck className="h-3 w-3"/>Verified</div>}
        <h3 className="font-bold text-slate-900">{t.name}</h3>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 min-h-[2rem]">{t.tagline}</p>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3"/>{t.city}</p>
        <p className="text-sm font-bold text-brand-700 mt-2">₹{Number(t.fee_hourly).toLocaleString('en-IN')}/hr</p>
      </Link>
      <Link to={`/book-demo?tutor=${t.slug}`} className="mt-2 block w-full rounded-lg bg-brand-600 text-white text-xs py-1.5 font-semibold hover:bg-brand-700">Book Trial</Link>
    </div>
  );
}

function CarouselWrap({ car, itemW, children }) {
  return (
    <div className="relative">
      <button onClick={car.prev} disabled={!car.canPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
      <div className="overflow-hidden">
        <div className="flex gap-4 transition-transform duration-300" style={{transform:`translateX(-${car.idx*itemW}px)`}}>{children}</div>
      </div>
      <button onClick={car.next} disabled={!car.canNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-white shadow ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
    </div>
  );
}

export default function HomePage() {
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const { data: categories = [] } = useQuery({ queryKey:['categories','tree'], queryFn: fetchCategoriesTree });
  const { data: allCourses } = useQuery({ queryKey:['courses',{per_page:48}], queryFn:()=>fetchCourses({per_page:48}) });
  const courses = allCourses?.data ?? [];
  const { data: tutors = [] } = useQuery({ queryKey:['tutors','home'], queryFn:()=>fetchTutors() });

  const courseCar = useCarousel(courses.length, 5);
  const tutorCar  = useCarousel(tutors.length, 4);
  const subCar    = useCarousel(SUBJECTS.length, 6);

  return (
    <>
      {/* HERO */}
      <section className="relative bg-brand-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 opacity-90"/>
        <div className="relative container-wide py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-4 py-1.5 text-xs font-semibold tracking-wider mb-5">LIVE CLASSES · VIDEO COURSES · 1-ON-1 TUTORING</div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight">All The Expert Tutors You Need, In One Place</h1>
            <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed">Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages & more — taught by India's top tutors.</p>
            <form onSubmit={e=>{e.preventDefault();if(q.trim())nav(`/courses?search=${encodeURIComponent(q.trim())}`);}} className="mt-7 flex gap-2 max-w-lg">
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search for a subject, e.g. Python, Violin, SAT Math…" className="flex-1 rounded-lg bg-white/95 text-slate-900 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white/60"/>
              <button type="submit" className="rounded-lg bg-brand-500 hover:bg-brand-400 px-5 py-3 text-sm font-bold flex items-center gap-2 whitespace-nowrap"><Search className="h-4 w-4"/>Search</button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/book-demo" className="rounded-lg bg-white text-brand-800 hover:bg-slate-100 px-5 py-2.5 text-sm font-bold">Book a Free Trial</Link>
              <Link to="/courses" className="rounded-lg border border-white/30 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold">Explore All Courses</Link>
            </div>
            <p className="mt-5 text-sm text-slate-400">🛡️ No credit card · No commitment · Cancel anytime</p>
            <div className="mt-4 flex items-center gap-3" aria-label="Rated 4.7 on Google and Trustpilot">
              <div className="flex">{[...Array(5)].map((_,i)=><Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400"/>)}</div>
              <span className="text-sm text-slate-200 font-bold">4.7</span>
              <span className="text-slate-400 text-xs">on Google</span>
              <span className="text-slate-600">|</span>
              <span className="text-sm text-slate-300 font-semibold flex items-center gap-1"><Star className="h-3.5 w-3.5 text-green-400 fill-green-400"/>Trustpilot</span>
            </div>
          </div>
          <HeroSlider />
        </div>
      </section>

      {/* CHOOSE HOW TO LEARN */}
      <section className="py-14 bg-white"><div className="container-wide">
        <h2 className="text-2xl font-extrabold text-center mb-8 tracking-tight">Choose How You Want to Learn</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[{icon:'👤',title:'1-on-1 Live Classes',color:'bg-blue-50 text-blue-700',desc:'Private sessions with a dedicated tutor. Fully personalised pace, curriculum, and scheduling.',features:['Personalised curriculum','Flexible scheduling','Post-class mentoring'],cta:'Book Free Trial',href:'/book-demo'},{icon:'👥',title:'Live Group Classes',color:'bg-purple-50 text-purple-700',desc:'Interactive small-group sessions. Learn with peers, ask questions live, and build friendships.',features:['Small batches (5–10 students)','Structured curriculum','Affordable group pricing'],cta:'Browse Group Classes',href:'/courses'},{icon:'📹',title:'Self-Paced Video Courses',color:'bg-orange-50 text-orange-700',desc:'Pre-recorded expert lessons you can watch anytime. Learn at your own pace, on your own schedule.',features:['Watch anytime, on any device','Quizzes and assignments','Certificate on completion'],cta:'Browse Video Courses',href:'/courses'}].map(f=>(
            <div key={f.title} className="rounded-2xl border border-slate-100 p-6 hover:shadow-md transition">
              <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl text-2xl ${f.color} mb-4`}>{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">{f.desc}</p>
              <ul className="space-y-2 text-sm text-slate-600">{f.features.map(feat=><li key={feat} className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0"/>{feat}</li>)}</ul>
              <Link to={f.href} className="mt-5 block text-center rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700">{f.cta}</Link>
            </div>
          ))}
        </div>
      </div></section>

      {/* STATS */}
      <div className="bg-brand-900 text-white py-8">
        <div className="container-wide grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          {STATS.map(s=><div key={s.l}><div className="text-2xl font-extrabold text-brand-200">{s.n}</div><div className="text-xs text-slate-400 mt-0.5">{s.l}</div></div>)}
        </div>
      </div>

      {/* ALL COURSES */}
      <section className="py-14 bg-slate-50"><div className="container-wide">
        <div className="flex items-end justify-between mb-6"><h2 className="text-2xl font-extrabold tracking-tight">All The Courses You Need In One Place</h2><Link to="/courses" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View all courses →</Link></div>
        <div className="flex gap-2 flex-wrap mb-6">{categories.slice(0,10).map(c=><Link key={c.id} to={`/courses?category=${c.slug}`} className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700 transition">{c.name}</Link>)}</div>
        <CarouselWrap car={courseCar} itemW={208}>{courses.map(c=><MiniCourseCard key={c.id} course={c}/>)}</CarouselWrap>
      </div></section>

      {/* ABOUT + HOW IT WORKS */}
      <section className="py-14 bg-white"><div className="container-wide grid lg:grid-cols-2 gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">About Indiatutors Online</p>
          <h2 className="text-2xl font-extrabold mb-4">India's most trusted live tutoring platform</h2>
          <div className="relative rounded-2xl overflow-hidden mb-5 h-52">
            <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/AboutUsImage1.webp" alt="About us" className="w-full h-full object-cover"/>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">Indiatutors Online is a leading EdTech platform connecting students with expert educators for live interactive classes. We cover 100+ subjects — from CBSE Math to Bharatnatyam to Python.</p>
          <div className="grid grid-cols-2 gap-3">{[['8,000+','Students Taught'],['75+','Verified Tutors'],['15+','Years Experience'],['4.9 ★','Google Rating']].map(([n,l])=><div key={l} className="rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-100"><div className="text-xl font-extrabold text-brand-700">{n}</div><div className="text-xs text-slate-500 mt-0.5">{l}</div></div>)}</div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">How It Works</p>
          <h2 className="text-2xl font-extrabold mb-6">Start learning in 3 easy steps</h2>
          <div className="space-y-5">{[{n:'01',t:'Find Your Course',d:'Browse 120+ live courses or search by subject. Filter by grade, board, or learning mode.'},{n:'02',t:'Book a Free Trial',d:'Book a free 30-min demo class. Meet your tutor. No payment required.'},{n:'03',t:'Start Learning',d:'Enrol, get your personalised curriculum, and start regular classes on your schedule.'}].map(s=>(
            <div key={s.n} className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold">{s.n}</div>
              <div><h3 className="font-bold">{s.t}</h3><p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.d}</p></div>
            </div>
          ))}</div>
          <Link to="/book-demo" className="mt-7 inline-flex rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700">Book Your Free Trial</Link>
        </div>
      </div></section>

      {/* MOST POPULAR SUBJECTS */}
      <section className="py-14 bg-slate-50"><div className="container-wide">
        <div className="flex items-end justify-between mb-7"><h2 className="text-2xl font-extrabold tracking-tight">Most Popular Subjects</h2><Link to="/courses" className="text-sm font-semibold text-brand-600 hover:text-brand-700">View All Subjects →</Link></div>
        <CarouselWrap car={subCar} itemW={160}>{SUBJECTS.map(s=>(
          <Link key={s.label} to={`/courses?search=${encodeURIComponent(s.label)}`} className="group flex-shrink-0 w-36 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-100 hover:shadow-md transition">
            <div className="h-20 overflow-hidden relative">
              <img src={s.img} alt={s.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/>
              {s.tag && <span className={`absolute top-1.5 left-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${s.tag==='TRENDING'?'bg-red-500 text-white':s.tag==='POPULAR'?'bg-brand-600 text-white':'bg-green-500 text-white'}`}>{s.tag}</span>}
            </div>
            <div className="p-2.5 bg-white"><p className="text-xs font-bold text-slate-800 truncate">{s.label}</p></div>
          </Link>
        ))}</CarouselWrap>
      </div></section>

      {/* MEET OUR TEACHERS */}
      <section className="py-14 bg-white"><div className="container-wide">
        <div className="flex items-end justify-between mb-7"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Verified Educators</p><h2 className="text-2xl font-extrabold tracking-tight">Meet Our Teachers</h2></div><Link to="/find-tutors" className="text-sm font-semibold text-brand-600 hover:text-brand-700">All teachers →</Link></div>
        <CarouselWrap car={tutorCar} itemW={220}>{tutors.map(t=><HomeTutorCard key={t.slug} t={t}/>)}</CarouselWrap>
      </div></section>

      {/* TESTIMONIALS */}
      <section className="py-14 bg-slate-50"><div className="container-wide">
        <div className="flex items-end justify-between mb-7"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Real Students · Real Parents</p><h2 className="text-2xl font-extrabold tracking-tight">What Students & Parents Say</h2></div></div>
        <div className="grid md:grid-cols-3 gap-5">{[{rating:5,text:"The no commitment policy was what convinced us to try Indiatutors Online. Best decision — our daughter's Math improved two grades in 3 months.",name:'Priya Sharma',role:'Parent, Class 9 student'},{rating:5,text:"We've tried many online platforms but none matched the live interaction and personal curriculum here. Rahul Sir explains Python brilliantly.",name:'Arjun Mehta',role:'Class 11 student'},{rating:5,text:"Our son has been taking Chess and Python classes for 6 months. The progress tracker after every class is what sets this platform apart.",name:'Lakshmi Krishnamurthy',role:'Parent, Class 7 student'}].map(t=>(
          <div key={t.name} className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
            <div className="flex mb-3">{[...Array(t.rating)].map((_,i)=><Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400"/>)}</div>
            <p className="text-sm text-slate-600 leading-relaxed italic">"{t.text}"</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">{t.name[0]}</div>
              <div><p className="text-sm font-bold text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.role}</p></div>
            </div>
          </div>
        ))}</div>
      </div></section>

      {/* WHY FAMILIES CHOOSE US */}
      <section className="py-14 bg-white"><div className="container-wide">
        <div className="flex items-end justify-between mb-7"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">Why 8,000+ families trust us</p><h2 className="text-2xl font-extrabold tracking-tight">Why Families Choose Us</h2></div></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{WHY.map(f=><div key={f.t} className="rounded-xl p-5 ring-1 ring-slate-100 hover:shadow-sm transition"><f.icon className="h-7 w-7 text-brand-600 mb-3"/><h3 className="font-bold text-slate-900 mb-1">{f.t}</h3><p className="text-sm text-slate-500 leading-relaxed">{f.d}</p></div>)}</div>
      </div></section>

      {/* PRICING */}
      <section className="py-14 bg-slate-50"><div className="container-wide">
        <div className="text-center mb-10"><p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">No hidden charges · Cancel any time</p><h2 className="text-3xl font-extrabold tracking-tight">Simple, Honest Pricing</h2><p className="text-slate-500 mt-2">First class is always free.</p></div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">{PLANS.map(p=>(
          <div key={p.name} className={`rounded-2xl bg-white p-6 ring-1 relative ${p.badge==='Most Popular'?'ring-brand-500 shadow-xl':'ring-slate-100'}`}>
            {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 text-white px-4 py-1 text-xs font-bold whitespace-nowrap">{p.badge}</div>}
            <h3 className="font-extrabold text-lg">{p.name}</h3><p className="text-sm text-slate-500">{p.sub}</p>
            <div className="my-4 flex flex-wrap items-baseline gap-1"><span className="text-3xl lg:text-4xl font-extrabold text-slate-900">₹{p.price.toLocaleString('en-IN')}</span><span className="text-slate-500 text-sm">/month</span></div>
            <ul className="space-y-2 mb-6">{p.features.map(f=><li key={f} className="flex gap-2 items-start text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>{f}</li>)}</ul>
            <Link to="/book-demo" className={`block text-center rounded-lg py-2.5 text-sm font-bold ${p.badge==='Most Popular'?'bg-brand-600 text-white hover:bg-brand-700':'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}>Get Started</Link>
          </div>
        ))}</div>
      </div></section>

      {/* CTA */}
      <section className="bg-brand-900 text-white py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold">Ready to start learning?</h2>
          <p className="mt-3 text-slate-300">Book a free 30-minute demo class — no payment, no commitment.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-demo" className="rounded-lg bg-white text-brand-800 hover:bg-slate-100 px-8 py-3 text-sm font-bold">Book Free Trial Now</Link>
            <Link to="/courses" className="rounded-lg border border-white/30 hover:bg-white/10 px-8 py-3 text-sm font-semibold">Browse All Courses</Link>
          </div>
        </div>
      </section>
    </>
  );
}
