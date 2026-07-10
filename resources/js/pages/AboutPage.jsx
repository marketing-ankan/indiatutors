import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Mail, Star } from 'lucide-react';
import { fetchCourses, inr } from '../lib/api.js';

// Mirrors the live /about-us page (ito-about): navy/gold hero + collage,
// floating stat cards, content + sticky facts aside, course grid, CTA band.

const STATS = [
  ['100+', 'Subjects'], ['100%', 'Verified tutors'],
  ['10,000+', 'Classes delivered'], ['20+', 'Countries served'],
];

const OFFERS = [
  ['Live one-on-one sessions', 'personalised curriculum, direct mentorship'],
  ['Group classes', 'collaborative learning at affordable rates'],
  ['Home tuition', 'verified tutors who visit your home in your city'],
  ['Post-class mentoring', 'doubt clearing and homework support'],
  ['Certification', 'recognised course completion certificates'],
  ['No fixed commitment', 'flexible scheduling, easy rescheduling'],
  ['Free trial class', 'try before you commit'],
];

const FACTS = [
  'Background-verified, expert tutors',
  'Live 1-on-1 & small group classes',
  'Transparent, affordable pricing',
  'Flexible scheduling across time zones',
  'First demo class is free',
];

const COLLAGE = [
  'https://indiatutorsonline.com/wp-content/uploads/2026/05/Chess-1024x768.jpg',
  'https://indiatutorsonline.com/wp-content/uploads/2026/05/Carnatic-3-1024x768.jpg',
  'https://indiatutorsonline.com/wp-content/uploads/2026/05/App-Developement-8-1024x768.jpg',
];

function SectionH2({ children }) {
  return <h2 className="text-2xl font-extrabold text-slate-900 border-l-4 border-[#D4AF37] pl-3.5 mt-9 mb-3 first:mt-0">{children}</h2>;
}

export default function AboutPage() {
  const { data: coursesRes } = useQuery({ queryKey:['courses',{per_page:8}], queryFn:()=>fetchCourses({per_page:8}) });
  const courses = coursesRes?.data ?? [];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden text-white bg-gradient-to-br from-[#0B1220] to-brand-800">
        <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.22),transparent_70%)]"/>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-block rounded-full bg-white/15 ring-1 ring-white/25 px-3.5 py-1.5 text-xs font-bold mb-4">💎 About Us</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.07]">About Indiatutors Online</h1>
            <p className="mt-4 text-slate-300 max-w-xl text-lg leading-relaxed">India's trusted online tutoring marketplace — live, personalised learning that makes quality education accessible to every family, anywhere in the world.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/book-demo" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-6 py-3 text-sm font-bold shadow-lg shadow-[#D4AF37]/30 hover:brightness-105">🎯 Book a Free Demo</Link>
              <Link to="/find-tutors" className="rounded-xl border border-white/60 px-6 py-3 text-sm font-bold hover:bg-white/10">Find Tutors</Link>
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-3.5 min-h-[360px]">
            <img src={COLLAGE[0]} alt="Chess classes" className="row-span-2 w-full h-full object-cover rounded-2xl shadow-2xl"/>
            <img src={COLLAGE[1]} alt="Carnatic music classes" className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-[#D4AF37]/60"/>
            <img src={COLLAGE[2]} alt="Coding classes" className="w-full h-full object-cover rounded-2xl shadow-2xl"/>
          </div>
        </div>
      </section>

      {/* FLOATING STATS */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 -mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(([n,l]) => (
          <div key={l} className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl p-5 text-center">
            <div className="text-2xl font-extrabold text-brand-700">{n}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{l}</div>
          </div>
        ))}
      </div>

      {/* BODY + ASIDE */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-14 grid lg:grid-cols-[1fr_340px] gap-10 items-start">
        <div>
          <SectionH2>Our Mission</SectionH2>
          <p className="text-slate-700 leading-relaxed text-[1.04rem]">At India Tutors Online, we believe that meaningful teacher-student interaction is the foundation of effective learning. Our mission is to make live, personalised education accessible to every family in India — without financial burden, without compromise on quality.</p>

          <SectionH2>What We Offer</SectionH2>
          <p className="text-slate-700 leading-relaxed text-[1.04rem]">We connect students with verified, experienced tutors across 100+ subjects spanning academics, music, dance, coding, languages, yoga, chess, and competitive exam preparation. Every session is live and interactive — tailored to the individual child's pace, learning style, and goals.</p>
          <ul className="mt-4 space-y-1.5 text-slate-700 leading-relaxed list-disc pl-6">
            {OFFERS.map(([t,d]) => <li key={t}><strong className="text-slate-900">{t}</strong> — {d}</li>)}
          </ul>

          <SectionH2>Why Choose India Tutors Online?</SectionH2>
          <p className="text-slate-700 leading-relaxed text-[1.04rem]">Every tutor on our platform is background-verified, qualification-checked, and rated by real students and parents. We believe education should be goal-oriented — every session takes your child one step closer to their academic or skill goal. Our fees are transparent, our tutors are passionate, and our platform is designed around the needs of Indian families.</p>

          <SectionH2>Our Reach</SectionH2>
          <p className="text-slate-700 leading-relaxed text-[1.04rem]">We serve students across India and internationally — in the USA, Canada, Australia, Singapore, and the United Kingdom. Our online tutors are available across all time zones. Our home tutors are available in major Indian cities including Kolkata, Delhi, Mumbai, Bangalore, Chennai, Hyderabad, and Pune.</p>

          <SectionH2>Subject Categories</SectionH2>
          <p className="text-slate-700 leading-relaxed text-[1.04rem]">Academics (CBSE, ICSE, IB, IGCSE, State Board) · AP Courses · SAT / PSAT / ACT · JEE / NEET Prep · Music (Piano, Violin, Guitar, Tabla, Vocal) · Dance (Bharatnatyam, Kathak, Bollywood, Contemporary) · IT & Coding (Python, AI/ML, Robotics, Java, Web Dev) · Languages (Spanish, French, German, Hindi, Sanskrit) · Chess · Yoga · Creative Arts</p>

          <SectionH2>Contact Us</SectionH2>
          <div className="space-y-2 text-slate-700">
            <p className="flex gap-2"><MapPin className="h-4 w-4 text-brand-600 shrink-0 mt-1"/>Astra Tower, ANR-201, 2nd Floor, North Block, AA-II, New Town, Kolkata, West Bengal, India</p>
            <p className="flex gap-2 items-center"><Phone className="h-4 w-4 text-brand-600"/>+91 93308 11581</p>
            <p className="flex gap-2 items-center"><Mail className="h-4 w-4 text-brand-600"/>contact@indiatutorsonline.com</p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4">
          <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/Algebra1Carousel.webp" alt="" className="w-full h-48 object-cover rounded-2xl shadow-xl"/>
          <div className="rounded-2xl ring-1 ring-slate-200 bg-[#F4F7FE] p-6">
            <h3 className="font-extrabold text-slate-900 mb-3">Why families choose us</h3>
            <ul className="space-y-2 text-sm text-slate-700 mb-5">
              {FACTS.map(f => <li key={f}>✅ {f}</li>)}
            </ul>
            <Link to="/book-demo" className="block text-center rounded-xl bg-brand-600 text-white py-3 text-sm font-bold hover:bg-brand-700">Book a Free Demo</Link>
            <Link to="/plans" className="mt-2 block text-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-600 py-3 text-sm font-bold hover:bg-slate-50">See Plans & Pricing</Link>
          </div>
        </aside>
      </div>

      {/* EXPLORE WHAT WE TEACH */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-extrabold text-center">Explore What We Teach</h2>
        <p className="text-slate-500 text-center mt-1 mb-8">Live, expert-led classes across academics, music, coding, languages, the arts and more.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {courses.map(c => (
            <Link key={c.id} to={`/courses/${c.slug}`} className="group rounded-xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="h-28 bg-slate-100 overflow-hidden">
                {c.image_url && <img src={c.image_url} alt={c.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"/>}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-slate-800 line-clamp-2 min-h-[2rem]">{c.name}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-brand-700">{inr(c.sale_price||c.regular_price)}</span>
                  <span className="flex items-center gap-0.5 text-xs text-slate-500"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400"/>4.8</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/courses" className="text-sm font-bold text-brand-600 hover:text-brand-700">Browse All Courses →</Link>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-gradient-to-br from-[#0B1220] to-brand-800 text-white py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold">Start your child's learning journey today</h2>
          <p className="mt-3 text-slate-300">Try a free demo class, or explore our flexible plans built for every learner.</p>
          <div className="mt-7 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-demo" className="rounded-xl bg-[#D4AF37] text-[#0B1220] px-8 py-3 text-sm font-bold hover:brightness-105">🎯 Book a Free Demo</Link>
            <Link to="/plans" className="rounded-xl border border-white/60 px-8 py-3 text-sm font-bold hover:bg-white/10">💰 See Plans & Pricing</Link>
          </div>
        </div>
      </section>
    </>
  );
}
