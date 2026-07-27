import { useState, useMemo, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, Video, Users, Calendar, Clock, Baby, Star, Heart, Download,
  Phone, Mail, Play, ShoppingCart, ChevronLeft, ChevronRight, MessageCircle, Instagram, Youtube,
} from 'lucide-react';
import { fetchCourse, fetchCourses, fetchSocialYoutube, fetchSocialInstagram, inr } from '../lib/api.js';
import { cart, wishlist, useWishlist, cartItemOf } from '../lib/cart.js';
import {
  buildPriceMatrix, CARD_FEATURES, WORKSHOPS, PARENTS, FAMILY_NOTES, TEACHERS,
  ACHIEVEMENT_PHOTOS, BLOG_POSTS, WHATSAPP_TESTIMONIALS, INSTAGRAM, STUDENT_WINS,
  TRUST_POINTS, WHY_CHOOSE, ACADEMIC_REQUIREMENTS, overviewFor,
  COURSE_FAQS, CHANNEL_VIDEOS, YOUTUBE_CHANNEL_URL, ABOUT_STATS, ABOUT_STEPS,
} from '../data/courseDetail.js';
import { imageFor, heroImageFor } from '../data/courseImages.js';

// Course detail — a 1:1 rebuild of the live /product/{slug} template:
// breadcrumb hero, a main column (title + pills + tabbed sections) and a sticky
// buy card (plan/level price matrix, add-to-cart, wishlist, demo, curriculum,
// contact, profile, videos), followed by the shared below-fold sections:
// FAQ, reviews, other courses, workshops, testimonials, teachers, demo,
// achievements and blog.

const TABS = ['About Indiatutors Online', 'Why Choose', 'Overview', "What You'll Learn", 'Curriculum', 'Requirements', 'Reviews', 'FAQ'];

// Deterministic per-course social proof — stable rating + enrolled count per slug.
const seed = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const ratingOf = (slug) => (46 + (seed(slug + 'r') % 5)) / 10;   // 4.6 – 5.0
const enrolledOf = (slug) => 180 + (seed(slug + 'e') % 720);      // 180 – 899

const SectionHead = ({ children }) => (
  <div className="text-center mb-9">
    <h2 className="font-heading text-2xl font-extrabold text-[#1A1A1A]">{children}</h2>
    <span className="mt-3 mx-auto block h-1 w-16 rounded bg-[#D4AF37]" />
  </div>
);

// Meet our Teachers — WinQuest-parity portrait carousel (navy/gold theme).
// A scroll-snap rail of the full mentor roster with prev/next arrows; arrows
// page the rail by ~85% of its width and are hidden on touch (swipe instead).
function TeachersCarousel() {
  const rail = useRef(null);
  const page = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: 'smooth' });
  const Arrow = ({ dir, side, Icon, label }) => (
    <button type="button" onClick={() => page(dir)} aria-label={label}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-1 ring-black/5 transition hover:bg-[#D4AF37] hover:text-[#0B1220] md:flex ${side}`}>
      <Icon className="h-5 w-5" />
    </button>
  );
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>Meet our Teachers</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">Expert educators who connect, guide, and prepare students with special personalised care ❤️📚✨</p>
        <div className="relative">
          <Arrow dir={-1} side="-left-3" Icon={ChevronLeft} label="Previous teachers" />
          {/* Card geometry matches WinQuest's slider at desktop: 229px-wide
              portrait cards (223:300 image ≈ 229×308) with ~40px between. */}
          <div ref={rail} className="flex gap-4 overflow-x-auto scroll-smooth snap-x pb-2 scrollbar-hide sm:gap-10">
            {TEACHERS.map(t => (
              <figure key={t.name} className="group flex-shrink-0 snap-start w-[46%] sm:w-[229px] overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white shadow-[0_4px_18px_rgba(6,30,67,.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300">
                <img src={t.img} alt={t.name} loading="lazy" className="aspect-[223/300] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]" />
                <figcaption className="py-3.5 text-center font-heading text-[15px] font-bold text-[#0B1220]">{t.name}</figcaption>
              </figure>
            ))}
          </div>
          <Arrow dir={1} side="-right-3" Icon={ChevronRight} label="Next teachers" />
        </div>
      </div>
    </section>
  );
}

// Instagram Feed — real latest posts via /api/social/instagram once the
// account's Graph API token is configured (they then auto-refresh hourly as
// new posts land); branded placeholder tiles linking to the profile until then.
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

// Recent Student Wins — WinQuest-parity carousel: white cards with a gold top
// edge, an emoji icon, the win as a bold brand-coloured headline, the student
// name line and a muted detail line, on a scroll-snap rail with arrows.
function StudentWinsCarousel() {
  const rail = useRef(null);
  const page = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: 'smooth' });
  const Arrow = ({ dir, side, Icon, label }) => (
    <button type="button" onClick={() => page(dir)} aria-label={label}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-1 ring-black/5 transition hover:bg-[#D4AF37] hover:text-[#0B1220] md:flex ${side}`}>
      <Icon className="h-5 w-5" />
    </button>
  );
  return (
    <section className="py-14 bg-[#FAFBFE]">
      <div className="container-wide">
        <SectionHead>Recent Student Wins</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">Real, verified results from Indiatutors students this year 🇮🇳🏆</p>
        <div className="relative">
          <Arrow dir={-1} side="-left-3" Icon={ChevronLeft} label="Previous wins" />
          <div ref={rail} className="flex gap-4 overflow-x-auto scroll-smooth snap-x pb-2 scrollbar-hide sm:gap-5">
            {STUDENT_WINS.map(w => (
              <div key={w.title} className="flex-shrink-0 snap-start w-[80%] sm:w-[290px] rounded-2xl border-t-[3px] border-[#D4AF37] bg-white p-5 shadow-[0_4px_18px_rgba(6,30,67,.08)] ring-1 ring-[#E7E7EF] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="block text-2xl">{w.icon}</span>
                <h3 className="mt-2 font-heading text-[17px] font-extrabold leading-snug text-brand-700">{w.title}</h3>
                <p className="mt-2 text-sm font-bold text-slate-900">{w.name}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{w.detail}</p>
              </div>
            ))}
          </div>
          <Arrow dir={1} side="-right-3" Icon={ChevronRight} label="Next wins" />
        </div>
      </div>
    </section>
  );
}

// Student Achievements — WinQuest-parity photo carousel: large portrait photo
// cards on a scroll-snap rail with prev/next arrows (same pattern as the
// teachers carousel). Photos are placeholders until real ones are provided.
function AchievementsCarousel() {
  const rail = useRef(null);
  const page = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: 'smooth' });
  const Arrow = ({ dir, side, Icon, label }) => (
    <button type="button" onClick={() => page(dir)} aria-label={label}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-1 ring-black/5 transition hover:bg-[#D4AF37] hover:text-[#0B1220] md:flex ${side}`}>
      <Icon className="h-5 w-5" />
    </button>
  );
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>Student Achievements</SectionHead>
        <p className="-mt-6 mb-9 text-center text-slate-500">Making an Impact: 🏆 Student Achievements That Shine | 🌱 Your Growth. Our Mission.</p>
        <div className="relative">
          <Arrow dir={-1} side="-left-3" Icon={ChevronLeft} label="Previous achievements" />
          <div ref={rail} className="flex gap-4 overflow-x-auto scroll-smooth snap-x pb-2 scrollbar-hide sm:gap-6">
            {ACHIEVEMENT_PHOTOS.map((src, i) => (
              <figure key={src} className="group flex-shrink-0 snap-start w-[72%] sm:w-[340px] overflow-hidden rounded-2xl border border-[#E7E7EF] bg-white shadow-[0_4px_18px_rgba(6,30,67,.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <img src={src} alt={`Student achievement ${i + 1}`} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              </figure>
            ))}
          </div>
          <Arrow dir={1} side="-right-3" Icon={ChevronRight} label="Next achievements" />
        </div>
      </div>
    </section>
  );
}

// YouTube facade for the buy-card Videos panel: shows the channel thumbnail
// with a play button; clicking swaps to an inline privacy-friendly autoplay
// embed. Cross-origin, so the service worker passes it through and (no CSP)
// nothing blocks it.
function VideoThumb({ id, title, len }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="group relative aspect-video overflow-hidden rounded-lg bg-slate-900">
      {play ? (
        <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
      ) : (
        <button type="button" onClick={() => setPlay(true)} aria-label={`Play: ${title}`} className="absolute inset-0 h-full w-full">
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-lg transition group-hover:scale-110">
              <Play className="h-5 w-5 translate-x-0.5 fill-white" />
            </span>
          </span>
          {len && <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-semibold text-white">{len}</span>}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- BUY CARD ---
function BuyCard({ course }) {
  const { matrix, plans, levels } = useMemo(
    () => buildPriceMatrix(course.effective_price || course.regular_price || 0, course.slug, course.name),
    [course.slug, course.name, course.effective_price, course.regular_price]
  );
  const [plan, setPlan] = useState(plans[0]);
  const [level, setLevel] = useState(0);
  const cell = matrix[plan]?.[levels[level]] || { net: 0, gross: 0 };
  const nav = useNavigate();
  const wished = useWishlist().some(w => w.slug === course.slug);
  // Top-viewed channel videos (server-ranked); static list until loaded.
  const { data: ytVideos } = useQuery({ queryKey: ['social-youtube'], queryFn: fetchSocialYoutube, staleTime: 3600_000 });
  const videos = (ytVideos?.length >= 3 ? ytVideos : CHANNEL_VIDEOS).slice(0, 5);

  return (
    <aside className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden lg:sticky lg:top-24">
      {imageFor(course) && (
        <div className="aspect-video bg-slate-100"><img src={imageFor(course)} alt={course.name} className="w-full h-full object-cover" /></div>
      )}
      <div className="p-5 space-y-4">
        {/* Plan tabs (only when a Group option exists) */}
        {plans.length > 1 && (
          <div className="flex gap-1 rounded-xl bg-[#F3F6FC] p-1.5">
            {plans.map(p => (
              <button key={p} type="button" onClick={() => setPlan(p)}
                className={`flex-1 rounded-[9px] py-2.5 text-sm font-bold transition ${plan === p ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Level selector */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Choose level</p>
          <div className="grid grid-cols-3 gap-2">
            {levels.map((lv, i) => (
              <button key={lv} type="button" onClick={() => setLevel(i)}
                className={`rounded-[9px] py-2 text-xs font-bold border transition ${level === i ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-[#E7E7EF] hover:border-brand-300'}`}>
                {lv}
              </button>
            ))}
          </div>
        </div>

        {/* Live price */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
          <span className="font-heading text-3xl font-extrabold text-brand-600">{inr(cell.net)}</span>
          <span className="text-sm text-slate-400 line-through">{inr(cell.gross)}</span>
          <span className="text-[11px] font-bold text-green-600 bg-green-100 rounded-md px-1.5 py-0.5">40% OFF</span>
          <span className="text-xs text-slate-500 ml-auto">per class</span>
        </div>

        {/* Feature bullets */}
        <ul className="space-y-2 text-sm text-slate-600">
          {CARD_FEATURES.map(f => (
            <li key={f} className="flex gap-2 items-start"><CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />{f}</li>
          ))}
        </ul>

        {/* Actions — Add to Cart adds the catalog product (base price, qty 1,
            like the live Woo store) and opens the cart. */}
        <button type="button" onClick={() => { cart.add(cartItemOf(course)); nav('/cart'); }}
          className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-brand-600 text-white py-3 text-sm font-bold hover:bg-brand-700">
          <ShoppingCart className="h-4 w-4" /> Add to Cart
        </button>
        <button type="button" onClick={() => wishlist.toggle(cartItemOf(course))} aria-pressed={wished}
          className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-white border border-[#E7E7EF] text-slate-600 py-2.5 text-sm font-bold hover:border-brand-300">
          <Heart className={`h-4 w-4 ${wished ? 'fill-red-500 text-red-500' : ''}`} /> {wished ? 'Saved to Wishlist' : 'Save to Wishlist'}
        </button>
        <Link to="/book-demo" className="block text-center rounded-[10px] bg-[#F3F6FC] text-brand-800 py-2.5 text-sm font-bold hover:bg-brand-100">Book a Free Demo</Link>
        <Link to={`/download-curriculum?course=${course.slug}`} className="flex items-center justify-center gap-2 rounded-[10px] text-[#0B1220] py-2 text-sm font-bold hover:text-brand-700">
          <Download className="h-4 w-4" /> Download Full Curriculum (PDF)
        </Link>

        {/* Contact */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Contact Us</p>
          <a href="tel:+919330811581" className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 py-0.5"><Phone className="h-4 w-4 text-brand-600" />+91 93308 11581</a>
          <a href="mailto:connect@indiatutorsonline.com" className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 py-0.5"><Mail className="h-4 w-4 text-brand-600" />connect@indiatutorsonline.com</a>
        </div>

        {/* Profile */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Our Profile</p>
          <div className="rounded-xl bg-[#F3F6FC] p-4">
            <strong className="block font-heading text-slate-900">India<span className="text-brand-600">Tutors</span>Online</strong>
            <span className="text-xs text-slate-500">Verified mentors · Live 1:1 · 10,000+ classes delivered</span>
          </div>
        </div>

        {/* Videos — the channel's top-viewed uploads, fetched live from
            /api/social/youtube (server-cached, re-ranked as views change);
            falls back to the baked CHANNEL_VIDEOS list until it loads. */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Videos</p>
          <VideoThumb id={videos[0].id} title={videos[0].title} len={videos[0].len} />
          <p className="mt-1.5 mb-3 text-[13px] font-semibold leading-snug text-slate-700">{videos[0].title}</p>
          <div className="grid grid-cols-2 gap-2">
            {videos.slice(1, 5).map(v => (
              <div key={v.id}>
                <VideoThumb id={v.id} title={v.title} len={v.len} />
                <p className="mt-1 text-[11px] font-semibold leading-snug text-slate-600 line-clamp-2">{v.title}</p>
              </div>
            ))}
          </div>
          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700">
            <Youtube className="h-4 w-4" /> Visit our YouTube channel →
          </a>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------- REVIEW FORM ------
function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [sent, setSent] = useState(false);

  if (sent) return <div className="rounded-2xl bg-green-50 ring-1 ring-green-100 p-6 text-center text-green-800 font-semibold">Thanks! Your review has been submitted for moderation.</div>;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-100 p-6 max-w-2xl mx-auto">
      <h3 className="font-heading font-bold text-lg mb-4">Write a Review</h3>
      <form onSubmit={e => { e.preventDefault(); setSent(true); }} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Your Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} aria-label={`${i} star`}>
                <Star className={`h-6 w-6 ${(hover || rating) >= i ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Your Name*</label>
            <input required className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Samesh Sharma" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email (not published)</label>
            <input type="email" className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Your Review*</label>
          <textarea required rows={4} className="w-full rounded-lg ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Share your experience with this course" />
        </div>
        <button type="submit" className="rounded-lg bg-brand-600 text-white px-6 py-2.5 text-sm font-bold hover:bg-brand-700">Submit Review</button>
      </form>
    </div>
  );
}

// ------------------------------------------------------ RELATED PRODUCT ------
function ProductCard({ c }) {
  const off = c.on_sale && c.regular_price > 0 ? Math.round((1 - c.effective_price / c.regular_price) * 100) : 40;
  return (
    <Link to={`/courses/${c.slug}`} className="group rounded-[14px] bg-white border border-[#E7E7EF] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-300">
      <div className="h-[150px] bg-[#F3F6FC] overflow-hidden">
        {imageFor(c)
          ? <img src={imageFor(c)} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          : <span className="flex h-full w-full items-center justify-center text-3xl text-white/90 font-heading font-bold bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A]">{c.name[0]}</span>}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading text-sm font-bold text-[#1A1A1A] leading-snug min-h-[2.5rem]">{c.name}</h3>
        <p className="mt-2 flex items-center flex-wrap gap-x-1.5 gap-y-1">
          <span className="text-[16px] font-extrabold text-brand-600">{inr(c.effective_price)}</span>
          {c.on_sale && <span className="text-[11px] text-slate-400 line-through">{inr(c.regular_price)}</span>}
          <span className="text-[11px] font-bold text-green-600 bg-green-100 rounded-md px-1.5 py-0.5">{off}% OFF</span>
        </p>
      </div>
    </Link>
  );
}

// ------------------------------------------------------------------ PAGE -----
export default function CourseDetailPage() {
  const { slug } = useParams();
  const [tab, setTab] = useState(0);
  const [boardTab, setBoardTab] = useState(0);   // curriculum board-variant chip
  const [openUnit, setOpenUnit] = useState(0);   // curriculum accordion (-1 = all closed)
  const [openCourseFaq, setOpenCourseFaq] = useState(0); // FAQ tab accordion (-1 = all closed)
  const { data: course, isLoading, isError } = useQuery({ queryKey: ['course', slug], queryFn: () => fetchCourse(slug) });
  const { data: coursesResp } = useQuery({ queryKey: ['courses', { per_page: 200 }], queryFn: () => fetchCourses({ per_page: 200 }) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading course…</div>;
  if (isError || !course) return <div className="container-wide py-20 text-center"><h1 className="text-2xl font-bold">Course not found</h1><Link to="/courses" className="text-brand-600 mt-4 inline-block">← Back to courses</Link></div>;

  const curriculum = course.curriculum ?? [];
  const learn = curriculum.flatMap(l => l.topics || []).slice(0, 8);

  // Board-variant curricula (WinQuest-parity chips): `curriculum` is the
  // CBSE/NCERT default; curriculum_variants holds e.g. ICSE (CISCE) units.
  const variantMap = {
    ...(curriculum.length ? { 'India · CBSE (NCERT)': curriculum } : {}),
    ...(course.curriculum_variants || {}),
  };
  const variantNames = Object.keys(variantMap);
  const activeUnits = variantMap[variantNames[Math.min(boardTab, variantNames.length - 1)]] || [];
  const totalHours = activeUnits.reduce((s, u) => s + (parseInt(u.duration) || 0), 0);
  const gradeLabel = (course.name.match(/Grade\s[\d\-–]+(?:-\d+)?/) || [])[0] || null;
  const tabLabel = i => i === 1 ? `Why Choose Online ${course.name} Classes` : TABS[i];
  const rating = ratingOf(course.slug);
  const enrolled = enrolledOf(course.slug);

  // Related "Other Courses": same-category siblings only (like WooCommerce
  // related products on the live site — never padded with unrelated courses).
  // The section is hidden when a course has no siblings, matching live.
  const allCourses = coursesResp?.data ?? [];
  const catSlugs = new Set((course.categories || []).map(c => c.slug));
  const isAcademic = [...catSlugs].some(s => s.startsWith('academics'));
  const related = allCourses
    .filter(c => c.slug !== course.slug && (c.categories || []).some(cc => catSlugs.has(cc.slug)))
    .slice(0, 8);

  return (
    <div className="bg-white">
      {/* BREADCRUMB HERO — WinQuest diagonal-split layout, IndiaTutors navy/gold.
          Boxed like WinQuest: max-w 1800px centred (side margins appear ≥1800px)
          and the hero height scales 431px@1300 → 457px@1920 via clamp. */}
      <section className="relative mx-auto max-w-[1800px] overflow-hidden text-white" style={{ background: 'linear-gradient(115deg,#0B1220 0%,#152a63 58%,#1E3A8A 100%)' }}>
        {heroImageFor(course) && (
          <>
            {/* Mobile: photo on top (full width) */}
            <img src={heroImageFor(course)} alt={course.name} className="h-52 w-full object-cover sm:h-64 lg:hidden" style={{ objectPosition: '50% 30%' }} />
            {/* Desktop: photo bleeds off the right with a gold diagonal band */}
            {/* Desktop: gold diagonal band + photo — exact WinQuest geometry
                (image 55% / gold 56.2%, clip 120px top slant flush at bottom). */}
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[56.2%] lg:block" aria-hidden="true" style={{ background: '#D4AF37', clipPath: 'polygon(120px 0, 100% 0, 100% 100%, 0 100%)' }} />
            <img src={heroImageFor(course)} alt="" aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[55%] object-cover lg:block" style={{ clipPath: 'polygon(120px 0, 100% 0, 100% 100%, 0 100%)', objectPosition: '50% 30%' }} />
          </>
        )}
        <div className="relative container-wide flex items-center py-10 lg:min-h-[clamp(431px,376px_+_4.2vw,457px)] lg:py-12">
          <div className="w-full lg:max-w-[43%]">
            <nav className="mb-3 text-xs text-slate-300">
              <Link to="/" className="hover:text-white">Home</Link> <span className="text-slate-500">›</span> <Link to="/courses" className="hover:text-white">Courses</Link> <span className="text-slate-500">›</span> <span className="text-white">{course.name}</span>
            </nav>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">{course.categories?.[0]?.name || 'Course Details'}</p>
            <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{course.name}</h1>
            {(course.subtitle || course.short_description) && <p className="mt-3 max-w-md leading-relaxed text-slate-300">{course.subtitle || course.short_description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#D4AF37] px-3.5 py-1.5 text-xs font-bold text-[#0B1220]">Bestseller</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20"><Star className="h-3.5 w-3.5 fill-[#D4AF37] text-[#D4AF37]" />{rating.toFixed(1)}/5</span>
              <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">{enrolled}+ enrolled</span>
              <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20">1:1 Personalised Session</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/book-demo?subject=${encodeURIComponent(course.name)}`} className="rounded-[11px] bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#0B1220] shadow-lg shadow-[#D4AF37]/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#D4AF37]/40 hover:brightness-105">Book a Free Demo</Link>
              <Link to="/plans-pricing" className="rounded-[11px] border-[1.5px] border-white/50 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-white/10 hover:shadow-lg hover:shadow-black/25">View Plans &amp; Pricing</Link>
            </div>
          </div>
        </div>
      </section>

      {/* TOP: MAIN + BUY CARD */}
      <div className="container-wide py-10 grid lg:grid-cols-[1fr_minmax(360px,440px)] gap-8 items-start">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">{course.name}</h2>
          {(course.subtitle || course.short_description) && <p className="mt-1 text-slate-600">{course.subtitle || course.short_description}</p>}
          {course.age && <div className="mt-3"><span className="text-sm text-slate-500 inline-flex items-center gap-1"><Baby className="h-4 w-4 text-brand-600" />{course.age}</span></div>}
          <div className="mt-3 flex flex-wrap gap-2">
            {course.categories?.map(c => <Link key={c.id} to={`/courses?category=${c.slug}`} className="rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold hover:bg-slate-200">{c.name}</Link>)}
            <span className="rounded-full bg-red-50 text-red-600 px-3 py-1 text-xs font-bold">Live</span>
          </div>

          {/* TABS */}
          <div id="course-tabs" className="mt-6 border-b border-slate-200 flex flex-wrap gap-x-5 gap-y-1 overflow-x-auto scrollbar-hide">
            {TABS.map((_, i) => (
              <button key={i} onClick={() => setTab(i)} className={`whitespace-nowrap py-2.5 text-sm font-semibold border-b-2 -mb-px ${tab === i ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>{tabLabel(i)}</button>
            ))}
          </div>

          <div className="mt-6 text-slate-700 leading-relaxed space-y-4">
            {tab === 0 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">About Indiatutors Online</h3>
                <p>Indiatutors Online is a live tutoring marketplace connecting students with verified, expert educators across 100+ subjects. Every class is live and interactive, with a personalised curriculum, regular practice and a progress tracker after each session — and your first demo class is always free.</p>

                {/* Stat tiles — fills the desktop column beside the tall buy card */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ABOUT_STATS.map(s => (
                    <div key={s.label} className="rounded-xl border border-[#E7E7EF] bg-white p-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                      <span className="block text-2xl">{s.icon}</span>
                      <span className="mt-1 block font-heading text-xl font-extrabold text-brand-700">{s.num}</span>
                      <span className="block text-xs text-slate-500">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* How it works — 3 numbered steps */}
                <h4 className="pt-2 font-bold text-slate-900">How it works</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  {ABOUT_STEPS.map((s, i) => (
                    <div key={s.t} className="rounded-xl border border-[#E7E7EF] bg-white p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 font-heading text-sm font-bold text-white">{i + 1}</span>
                      <h5 className="mt-2.5 text-sm font-bold text-slate-900">{s.t}</h5>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.d}</p>
                    </div>
                  ))}
                </div>

                <Link to={`/book-demo?subject=${encodeURIComponent(course.name)}`} className="inline-flex rounded-[10px] bg-[#D4AF37] px-6 py-2.5 text-sm font-bold text-[#0B1220] shadow-md shadow-[#D4AF37]/25 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105">Book your free demo →</Link>
              </>
            )}
            {tab === 1 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Why Choose Online {course.name} Classes?</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {WHY_CHOOSE.map(w => (
                    <div key={w.t} className="rounded-xl border border-[#E7E7EF] bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                      <h4 className="text-sm font-bold text-slate-900">{w.t}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{w.d}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === 2 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Overview</h3>
                {course.description
                  ? <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
                  : <p>{overviewFor(course.name)}</p>}
              </>
            )}
            {tab === 3 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">What You'll Learn</h3>
                <div className="rounded-xl border border-[#E7E7EF] bg-white p-5">
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                    {(learn.length ? learn : CARD_FEATURES).map((t, i) => (
                      <li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />{t}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {tab === 4 && (
              activeUnits.length ? (
                <div className="space-y-4">
                  {/* Pills */}
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#D4AF37] px-4 py-1.5 text-sm font-bold text-[#0B1220]">Curriculum</span>
                    {gradeLabel && <span className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-bold text-white">{gradeLabel}</span>}
                  </div>

                  {/* Grade banner */}
                  <div className="rounded-2xl px-6 py-5 text-white" style={{ background: 'linear-gradient(120deg,#0B1220,#1E3A8A)' }}>
                    <h4 className="font-heading text-xl font-extrabold">{gradeLabel || course.name}</h4>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                      {(course.age || activeUnits[0]?.age) && <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/25">{course.age || activeUnits[0].age}</span>}
                      {totalHours > 0 && <span className="rounded-full bg-white/15 px-3 py-1 ring-1 ring-white/25">{totalHours} hrs</span>}
                    </div>
                  </div>

                  {/* Board-variant chips */}
                  {variantNames.length > 1 && (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
                      {variantNames.map((n, i) => (
                        <button key={n} onClick={() => { setBoardTab(i); setOpenUnit(0); }}
                          className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1 transition ${i === boardTab ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-700 ring-slate-200 hover:ring-brand-400'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Unit accordion */}
                  {activeUnits.map((level, i) => (
                    <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-slate-100">
                      <button onClick={() => setOpenUnit(openUnit === i ? -1 : i)} aria-expanded={openUnit === i}
                        className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-white"
                        style={{ background: 'linear-gradient(120deg,#1E40AF,#0B1220)' }}>
                        <h4 className="font-bold">{level.title}</h4>
                        <div className="ml-auto flex items-center gap-3 text-xs text-white/75">
                          {level.age && <span className="hidden items-center gap-1 sm:inline-flex"><Baby className="h-3.5 w-3.5" />{level.age}</span>}
                          {level.duration && <span className="hidden items-center gap-1 sm:inline-flex"><Clock className="h-3.5 w-3.5" />{level.duration}</span>}
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm transition-transform ${openUnit === i ? 'rotate-45' : ''}`}>+</span>
                        </div>
                      </button>
                      {openUnit === i && level.topics?.length > 0 && (
                        <ul className="grid gap-x-6 gap-y-2 bg-white p-5 sm:grid-cols-2">
                          {level.topics.map((t, j) => <li key={j} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{t}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p>A structured, level-by-level curriculum — personalised further after your free demo class.</p>
            )}
            {tab === 5 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Requirements</h3>
                <div className="space-y-2.5">
                  {[
                    'A laptop, tablet or desktop with a stable internet connection',
                    'A quiet space for the live class',
                    ...(isAcademic ? ACADEMIC_REQUIREMENTS : ['Any subject-specific materials will be shared by your tutor']),
                    'Enthusiasm to learn — no prior experience needed for beginner levels',
                  ].map(x => (
                    <div key={x} className="flex gap-2.5 rounded-xl border border-[#E7E7EF] bg-white px-4 py-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />{x}
                    </div>
                  ))}
                </div>
              </>
            )}
            {tab === 6 && (
              <div className="rounded-r-2xl border-l-4 border-brand-600 bg-slate-50 p-5 ring-1 ring-slate-100">
                <h4 className="font-bold text-slate-900">{rating.toFixed(1)} / 5 ★ · {enrolled}+ students enrolled</h4>
                <p className="mt-1 text-sm text-slate-600">Parents consistently rate our mentors for personalised attention, clear concepts and steady progress. Book a free demo to experience a class first-hand.</p>
              </div>
            )}
            {tab === 7 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  {COURSE_FAQS.map((f, i) => (
                    <div key={f.q} className={`overflow-hidden rounded-xl ${openCourseFaq === i ? 'shadow-md ring-1 ring-brand-200' : 'ring-1 ring-slate-200'}`}>
                      <button onClick={() => setOpenCourseFaq(openCourseFaq === i ? -1 : i)} aria-expanded={openCourseFaq === i}
                        className={`flex w-full items-center gap-3 px-5 py-3.5 text-left font-bold ${openCourseFaq === i ? 'text-white' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
                        style={openCourseFaq === i ? { background: 'linear-gradient(120deg,#1E40AF,#0B1220)' } : undefined}>
                        {f.q}
                        <span className={`ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm transition-transform ${openCourseFaq === i ? 'rotate-45 bg-white/20 text-white' : 'bg-brand-600 text-white'}`}>+</span>
                      </button>
                      {openCourseFaq === i && <p className="bg-white px-5 py-4 text-sm leading-relaxed text-slate-600">{f.a}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <BuyCard course={course} />
      </div>

      {/* OTHER COURSES */}
      {related.length > 0 && (
        <section className="py-14 bg-[#FAFBFE]">
          <div className="container-wide">
            <SectionHead>Other Courses</SectionHead>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map(c => <ProductCard key={c.slug} c={c} />)}
            </div>
          </div>
        </section>
      )}

      {/* STUDENT REVIEWS — WinQuest order: right after Other Courses */}
      <section className="py-14 bg-white">
        <div className="container-wide">
          <SectionHead>Student Reviews</SectionHead>
          <div className="mx-auto mb-8 max-w-4xl rounded-2xl border border-[#E7E7EF] px-6 py-10 text-center">
            <span className="mb-2 block text-2xl text-[#D4AF37]">☆</span>
            <p className="text-slate-500">No reviews yet — be the first to share your experience with this course!</p>
          </div>
          <ReviewForm />
        </div>
      </section>

      {/* MEET OUR TEACHERS — WinQuest order: right after Student Reviews */}
      <TeachersCarousel />

      {/* RECENT STUDENT WINS — WinQuest order: right after Meet our Teachers */}
      <StudentWinsCarousel />

      {/* STUDENT ACHIEVEMENTS — WinQuest order: right after Recent Student Wins.
          Photo carousel (WinQuest-parity); placeholder photos until real
          Indiatutors student photos are provided. */}
      <AchievementsCarousel />

      {/* WHAT OUR PARENTS SAY ABOUT US — WinQuest-parity spotlight cards */}
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

      {/* WHAT FAMILIES SAY — WinQuest-parity notes rail */}
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

      {/* WHATSAPP TESTIMONIALS */}
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

      {/* LATEST NEWS AND RESOURCES — WinQuest-parity (replaces From Our Blog;
          the Demo of Our Classes section was removed, matching WinQuest). */}
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

      {/* INSTAGRAM FEED */}
      <InstagramFeed />

      {/* FREE WORKSHOPS — last content section (user-requested order) */}
      <section className="py-14 bg-[#FAFBFE]">
        <div className="container-wide">
          <SectionHead>Free Workshops</SectionHead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {WORKSHOPS.map(w => (
              <div key={w.t} className="rounded-[14px] bg-white border border-[#E7E7EF] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="h-[140px] bg-gradient-to-br from-brand-600 to-brand-800" />
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading font-bold text-slate-900">{w.t}</h3>
                  <p className="mt-1 text-sm text-slate-500 flex-1">{w.d}</p>
                  <Link to="/events-workshops" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700">Attend <ChevronRight className="h-4 w-4" /></Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUSTED BY strip */}
      <section className="border-t border-slate-100 bg-white py-8">
        <div className="container-wide flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-center text-sm font-semibold text-slate-600">
          {TRUST_POINTS.map(p => <span key={p}>{p}</span>)}
        </div>
      </section>
    </div>
  );
}
