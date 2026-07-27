import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, MessageCircle, Instagram } from 'lucide-react';
import { fetchSocialInstagram } from '../lib/api.js';
import {
  TEACHERS, STUDENT_WINS, ACHIEVEMENT_PHOTOS, PARENTS, FAMILY_NOTES,
  WHATSAPP_TESTIMONIALS, BLOG_POSTS, INSTAGRAM,
} from '../data/courseDetail.js';

// The shared WinQuest-parity social-proof block shown below the fold on both
// the product pages AND the /courses shop page (WinQuest renders the same
// sections on its /shop): Meet our Teachers → Recent Student Wins → Student
// Achievements → What Our Parents Say About Us → What Families Say → WhatsApp
// Testimonials → Latest News and Resources → Instagram Feed.

const SectionHead = ({ children }) => (
  <div className="text-center mb-9">
    <h2 className="font-heading text-2xl font-extrabold text-[#1A1A1A]">{children}</h2>
    <span className="mt-3 mx-auto block h-1 w-16 rounded bg-[#D4AF37]" />
  </div>
);

// Scroll-snap rail with prev/next arrows (hidden on touch, shown from md up).
function Rail({ label, gapClass = 'gap-4', children }) {
  const rail = useRef(null);
  const page = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: 'smooth' });
  const Arrow = ({ dir, side, Icon, text }) => (
    <button type="button" onClick={() => page(dir)} aria-label={text}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-1 ring-black/5 transition hover:bg-[#D4AF37] hover:text-[#0B1220] md:flex ${side}`}>
      <Icon className="h-5 w-5" />
    </button>
  );
  return (
    <div className="relative">
      <Arrow dir={-1} side="-left-3" Icon={ChevronLeft} text={`Previous ${label}`} />
      <div ref={rail} className={`flex ${gapClass} overflow-x-auto scroll-smooth snap-x pb-2 scrollbar-hide`}>{children}</div>
      <Arrow dir={1} side="-right-3" Icon={ChevronRight} text={`Next ${label}`} />
    </div>
  );
}

// Meet our Teachers — portrait carousel, WinQuest card geometry (229×308 @40px gaps).
function TeachersCarousel() {
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>Meet our Teachers</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">Expert educators who connect, guide, and prepare students with special personalised care ❤️📚✨</p>
        <Rail label="teachers" gapClass="gap-4 sm:gap-10">
          {TEACHERS.map(t => (
            <figure key={t.name} className="group flex-shrink-0 snap-start w-[46%] sm:w-[229px] overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white shadow-[0_4px_18px_rgba(6,30,67,.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300">
              <img src={t.img} alt={t.name} loading="lazy" className="aspect-[223/300] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
              <figcaption className="py-3.5 text-center font-heading text-[15px] font-bold text-[#0B1220]">{t.name}</figcaption>
            </figure>
          ))}
        </Rail>
      </div>
    </section>
  );
}

// Recent Student Wins — gold-top cards with emoji + headline + student + detail.
function StudentWinsCarousel() {
  return (
    <section className="py-14 bg-[#FAFBFE]">
      <div className="container-wide">
        <SectionHead>Recent Student Wins</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">Real, verified results from Indiatutors students this year 🇮🇳🏆</p>
        <Rail label="wins" gapClass="gap-4 sm:gap-5">
          {STUDENT_WINS.map(w => (
            <div key={w.title} className="flex-shrink-0 snap-start w-[80%] sm:w-[290px] rounded-2xl border-t-[3px] border-[#D4AF37] bg-white p-5 shadow-[0_4px_18px_rgba(6,30,67,.08)] ring-1 ring-[#E7E7EF] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <span className="block text-2xl">{w.icon}</span>
              <h3 className="mt-2 font-heading text-[17px] font-extrabold leading-snug text-brand-700">{w.title}</h3>
              <p className="mt-2 text-sm font-bold text-slate-900">{w.name}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{w.detail}</p>
            </div>
          ))}
        </Rail>
      </div>
    </section>
  );
}

// Student Achievements — photo carousel (placeholder photos until real ones arrive).
function AchievementsCarousel() {
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>Student Achievements</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">Making an Impact: 🏆 Student Achievements That Shine | 🌱 Your Growth. Our Mission.</p>
        <Rail label="achievements" gapClass="gap-4 sm:gap-6">
          {ACHIEVEMENT_PHOTOS.map((src, i) => (
            <figure key={src} className="group flex-shrink-0 snap-start w-[72%] sm:w-[340px] overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white shadow-[0_4px_18px_rgba(6,30,67,.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <img src={src} alt={`Student achievement ${i + 1}`} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </figure>
          ))}
        </Rail>
      </div>
    </section>
  );
}

function ParentsSpotlight() {
  return (
    <section className="py-14 bg-[#FAFBFE]">
      <div className="container-wide">
        <SectionHead>What Our Parents Say About Us</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">👨‍👩‍👧 Real Results. Real Parent Voices. 🏆 Futures Built with Care</p>
        <div className="flex gap-5 overflow-x-auto snap-x pb-2 scrollbar-hide">
          {PARENTS.map(p => (
            <figure key={p.name} className="relative flex-shrink-0 snap-start w-[86%] sm:w-[46%] lg:w-[31.5%] rounded-2xl bg-white border border-[#E7E7EF] p-6 shadow-[0_4px_18px_rgba(6,30,67,.08)]">
              <figcaption className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 font-heading text-lg font-bold text-white ring-2 ring-[#D4AF37] ring-offset-2">{p.init}</span>
                <span>
                  <strong className="block font-heading text-slate-900">{p.name}</strong>
                  <span className="block text-xs text-slate-500">{p.role}</span>
                </span>
              </figcaption>
              <div className="mt-3 text-[#D4AF37]" aria-label="5/5">★★★★★</div>
              <blockquote className="mt-2 rounded-xl border-l-4 border-[#D4AF37] bg-[#FAFBFE] p-4 text-sm italic leading-relaxed text-slate-600">{p.quote}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FamiliesSay() {
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>What Families Say</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">In their own words — recent notes from Indiatutors parents &amp; students 💙</p>
        <div className="flex gap-4 overflow-x-auto snap-x pb-2 scrollbar-hide">
          {FAMILY_NOTES.map(f => (
            <figure key={f.name} className="flex-shrink-0 snap-start w-[80%] sm:w-[340px] rounded-2xl border border-[#E7E7EF] bg-white p-6 shadow-sm">
              <div className="text-[#D4AF37]" aria-label="5/5">★ ★ ★ ★ ★</div>
              <blockquote className="mt-3 border-l-2 border-slate-200 pl-4 text-sm italic leading-relaxed text-slate-600">“{f.quote}”</blockquote>
              <figcaption className="mt-3 pl-4 text-xs font-semibold text-slate-500">— {f.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatsAppTestimonials() {
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>WhatsApp Testimonials</SectionHead>
        <p className="text-center text-slate-500 -mt-6 mb-9">Real voices from our WhatsApp community 💚📚</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHATSAPP_TESTIMONIALS.map(w => (
            <div key={w.name + w.time} className="rounded-2xl bg-[#ECE5DD] p-4">
              <div className="relative rounded-xl rounded-tl-sm bg-white p-3 shadow-sm">
                <span className="absolute -left-1.5 top-0 h-3 w-3 bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]" aria-hidden="true" />
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-xs font-bold text-white">{w.init}</span>
                  <strong className="text-[13px] text-[#075E54]">{w.name}</strong>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{w.text}</p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                  {w.time}
                  <svg viewBox="0 0 18 18" className="h-3.5 w-3.5 text-[#34B7F1]" fill="currentColor" aria-label="read"><path d="M17.4 5.5l-1-.9-6.9 8-1.3-1.2-1 .9 2.3 2.4zM12.6 5.5l-1-.9-6.9 8L2 10.3l-1 1L4 14.5z"/></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href="https://wa.me/919330811581" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-2.5 text-sm font-bold text-white hover:brightness-105">
            <MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function LatestNews() {
  return (
    <section className="py-14 bg-[#FAFBFE]">
      <div className="container-wide">
        <SectionHead>Latest News and Resources</SectionHead>
        <p className="-mt-6 mb-9 text-center text-sm font-semibold text-slate-600">📰 Learning Updates <span className="text-slate-300">|</span> 📘 Tips <span className="text-slate-300">|</span> 🎓 Resources <span className="text-slate-300">|</span> 💻 Online Courses</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BLOG_POSTS.map(b => (
            <Link key={b.title} to="/blog" className="group rounded-[14px] bg-white border border-[#E7E7EF] overflow-hidden flex flex-col shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <span className="block h-[190px] overflow-hidden">
                <img src={b.img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              </span>
              <span className="p-5 flex flex-col flex-1">
                <span className="text-xs font-bold text-brand-600">{b.date}</span>
                <span className="mt-1.5 font-heading font-bold leading-snug text-slate-900">{b.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-slate-500">{b.excerpt}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Instagram Feed — real latest posts via /api/social/instagram when the token
// is configured (auto-refresh hourly); placeholder tiles until then.
function InstagramFeed() {
  const { data } = useQuery({ queryKey: ['social-instagram'], queryFn: fetchSocialInstagram, staleTime: 3600_000 });
  const posts = data?.configured ? (data.data || []) : [];
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>Instagram Feed</SectionHead>
        <p className="text-center text-slate-500 -mt-6 mb-9">A glimpse into our classes, creativity &amp; student success — straight from our Instagram 📷✨</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {posts.length > 0
            ? posts.slice(0, 8).map(p => (
              <a key={p.id} href={p.permalink} target="_blank" rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <img src={p.image} alt={p.caption || 'Instagram post'} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <Instagram className="h-6 w-6 text-white" />
                </span>
              </a>
            ))
            : INSTAGRAM.posts.map((p, i) => (
              <a key={i} href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
                className={`group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${p.tint} text-4xl transition-transform duration-300 hover:scale-[1.03]`}>
                <span>{p.emoji}</span>
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                  <Instagram className="h-6 w-6 text-white" />
                </span>
              </a>
            ))}
        </div>
        <div className="mt-8 text-center">
          <a href={INSTAGRAM.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] px-6 py-2.5 text-sm font-bold text-white hover:brightness-105">
            <Instagram className="h-4 w-4" /> Follow @{INSTAGRAM.handle}
          </a>
        </div>
      </div>
    </section>
  );
}

export default function SocialProofSections() {
  return (
    <>
      <TeachersCarousel />
      <StudentWinsCarousel />
      <AchievementsCarousel />
      <ParentsSpotlight />
      <FamiliesSay />
      <WhatsAppTestimonials />
      <LatestNews />
      <InstagramFeed />
    </>
  );
}
