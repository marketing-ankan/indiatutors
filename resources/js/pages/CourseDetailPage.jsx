import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2, Video, Users, Calendar, Clock, Baby, Star, Heart, Download,
  Phone, Mail, Play, Plus, ShoppingCart, ChevronRight, MessageCircle, Instagram,
} from 'lucide-react';
import { fetchCourse, fetchCourses, fetchStoreProducts, inr } from '../lib/api.js';
import { cart, wishlist, useWishlist, cartItemOf } from '../lib/cart.js';
import {
  buildPriceMatrix, CARD_FEATURES, FAQS, WORKSHOPS, PARENTS, TEACHERS,
  ACHIEVEMENTS, BLOG_POSTS, WHATSAPP_TESTIMONIALS, INSTAGRAM, STUDENT_WINS,
} from '../data/courseDetail.js';

// Course detail — a 1:1 rebuild of the live /product/{slug} template:
// breadcrumb hero, a main column (title + pills + tabbed sections) and a sticky
// buy card (plan/level price matrix, add-to-cart, wishlist, demo, curriculum,
// contact, profile, videos), followed by the shared below-fold sections:
// FAQ, reviews, other courses, workshops, testimonials, teachers, demo,
// achievements and blog.

const TABS = ['About Indiatutors Online', 'Why Choose', 'Overview', "What You'll Learn", 'Curriculum', 'Requirements', 'Reviews'];

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

// Instruments & Robotics Kits — store strip on the product page (India shipping).
function InstrumentsStrip() {
  const { data: items = [] } = useQuery({ queryKey: ['store-products', 'course-strip'], queryFn: fetchStoreProducts });
  if (!items.length) return null;
  const gross = (n) => Math.ceil((n / 0.6) / 50) * 50;
  return (
    <section className="py-14 bg-white">
      <div className="container-wide">
        <SectionHead>🎸 Instruments &amp; Robotics Kits — order for your child</SectionHead>
        <p className="text-center text-slate-500 -mt-6 mb-9">Teacher-curated gear from the Indiatutors Store, shipped across India 🇮🇳</p>
        <div className="flex gap-4 overflow-x-auto snap-x pb-2 scrollbar-hide">
          {items.slice(0, 12).map((p) => (
            <Link key={p.slug} to={`/instruments/${p.slug}`} className="group flex-shrink-0 snap-start w-[46%] sm:w-[31%] lg:w-[23%] xl:w-[18%] rounded-[14px] bg-white border border-[#E7E7EF] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              {p.image_url
                ? <span className="block h-32 bg-cover bg-center" style={{ backgroundImage: `url('${p.image_url}')` }} />
                : <span className="flex h-32 items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-3xl">🎸</span>}
              <span className="block p-3">
                <span className="block text-[13px] font-bold text-slate-900 leading-snug line-clamp-2">{p.name}</span>
                <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="font-extrabold text-brand-700">{inr(p.price)}</span>
                  <span className="text-xs text-slate-400 line-through">{inr(gross(p.price))}</span>
                  <span className="rounded bg-green-100 text-green-700 px-1 py-0.5 text-[10px] font-bold">40% OFF</span>
                </span>
                <span className="mt-1.5 block text-xs font-bold text-brand-600 group-hover:text-brand-700">View details →</span>
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/instruments" className="inline-flex rounded-lg border-2 border-brand-600/35 text-brand-600 px-6 py-2.5 text-sm font-bold hover:bg-brand-50">Visit the Store →</Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- BUY CARD ---
function BuyCard({ course }) {
  const { matrix, plans, levels } = useMemo(
    () => buildPriceMatrix(course.effective_price || course.regular_price || 0, course.slug),
    [course.slug, course.effective_price, course.regular_price]
  );
  const [plan, setPlan] = useState(plans[0]);
  const [level, setLevel] = useState(0);
  const cell = matrix[plan]?.[levels[level]] || { net: 0, gross: 0 };
  const nav = useNavigate();
  const wished = useWishlist().some(w => w.slug === course.slug);

  return (
    <aside className="rounded-2xl bg-white shadow-lg ring-1 ring-slate-100 overflow-hidden lg:sticky lg:top-24">
      {course.image_url && (
        <div className="aspect-video bg-slate-100"><img src={course.image_url} alt={course.name} className="w-full h-full object-cover" /></div>
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

        {/* Videos */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Videos</p>
          {[['Profile Video', 'Book a free demo to meet our mentors'], ['Demo Video', 'Book a free demo to see a live class'], ['Course Videos', 'Preview coming soon — book a free demo']].map(([h, t]) => (
            <div key={h} className="mb-2">
              <p className="text-[11px] font-semibold text-slate-400 mb-1">{h}</p>
              <Link to="/book-demo" className="flex items-center gap-2 rounded-lg bg-slate-50 hover:bg-slate-100 px-3 py-2 text-sm text-slate-600">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] shrink-0"><Play className="h-3 w-3 fill-white" /></span>
                {t}
              </Link>
            </div>
          ))}
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
        {c.image_url
          ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
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

// ------------------------------------------------------------- FAQ ITEM ------
function FaqItem({ q, a, open, onToggle }) {
  return (
    <div className="rounded-xl bg-white border border-[#E7E7EF] overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 text-left px-5 py-4 font-bold transition ${open ? 'text-white bg-gradient-to-br from-brand-600 to-[#152C49]' : 'text-[#1A1A1A] bg-[#FAFBFE] hover:bg-slate-100'}`}>
        <span>{q}</span>
        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${open ? 'bg-white text-brand-600 rotate-45' : 'bg-brand-600 text-white'} transition-transform`}>
          <Plus className="h-4 w-4" />
        </span>
      </button>
      {open && <div className="px-5 py-4 text-sm text-slate-600 leading-relaxed">{a}</div>}
    </div>
  );
}

// ------------------------------------------------------------------ PAGE -----
export default function CourseDetailPage() {
  const { slug } = useParams();
  const [tab, setTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const { data: course, isLoading, isError } = useQuery({ queryKey: ['course', slug], queryFn: () => fetchCourse(slug) });
  const { data: coursesResp } = useQuery({ queryKey: ['courses', { per_page: 200 }], queryFn: () => fetchCourses({ per_page: 200 }) });

  if (isLoading) return <div className="container-wide py-20 text-slate-500">Loading course…</div>;
  if (isError || !course) return <div className="container-wide py-20 text-center"><h1 className="text-2xl font-bold">Course not found</h1><Link to="/courses" className="text-brand-600 mt-4 inline-block">← Back to courses</Link></div>;

  const curriculum = course.curriculum ?? [];
  const learn = curriculum.flatMap(l => l.topics || []).slice(0, 8);
  const tabLabel = i => i === 1 ? `Why Choose Online ${course.name} Classes` : TABS[i];
  const rating = ratingOf(course.slug);
  const enrolled = enrolledOf(course.slug);

  // Related "Other Courses": same-category siblings only (like WooCommerce
  // related products on the live site — never padded with unrelated courses).
  // The section is hidden when a course has no siblings, matching live.
  const allCourses = coursesResp?.data ?? [];
  const catSlugs = new Set((course.categories || []).map(c => c.slug));
  const related = allCourses
    .filter(c => c.slug !== course.slug && (c.categories || []).some(cc => catSlugs.has(cc.slug)))
    .slice(0, 8);

  return (
    <div className="bg-white">
      {/* BREADCRUMB HERO */}
      <section className="relative bg-gradient-to-br from-[#0B1220] to-brand-900 text-white text-center py-16 overflow-hidden">
        {course.image_url && <img src={course.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
        <div className="relative container-wide">
          <nav className="text-xs text-slate-300 mb-3">
            <Link to="/" className="hover:text-white">Home</Link> <span className="text-slate-500">›</span> <Link to="/courses" className="hover:text-white">Courses</Link> <span className="text-slate-500">›</span> <span className="text-white">{course.name}</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-2">Course Details</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold tracking-tight">{course.name}</h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37] px-3 py-1 text-xs font-bold text-[#0B1220]">🏆 Bestseller</span>
            <span className="inline-flex items-center gap-1 font-semibold text-white"><Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />{rating.toFixed(1)}/5</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="font-semibold text-white">{enrolled}+ enrolled</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 text-slate-200"><Video className="h-4 w-4" />1:1 Personalised Session</span>
          </div>
          <div className="mx-auto mt-4 h-1 w-16 rounded bg-[#D4AF37]" />
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
              </>
            )}
            {tab === 1 && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Why Choose Online {course.name} Classes</h3>
                <ul className="space-y-2">
                  {['Learn from a background-verified, subject-expert tutor', 'Personalised curriculum built around your goals and pace', 'Small batches or 1-on-1 — your choice', 'Flexible scheduling across time zones, reschedule anytime', 'Progress tracked and shared after every class'].map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-1 text-green-500 shrink-0" />{x}</li>)}
                </ul>
              </>
            )}
            {tab === 2 && (
              course.description
                ? <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: course.description }} />
                : <p>{course.short_description || course.subtitle || `Live, expert-led ${course.name} classes with a structured curriculum, regular practice and personalised feedback.`}</p>
            )}
            {tab === 3 && (
              learn.length ? (
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                  {learn.map((t, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-1 text-green-500 shrink-0" />{t}</li>)}
                </ul>
              ) : <p>A structured, level-by-level path covering fundamentals to advanced topics — tailored further after your free demo.</p>
            )}
            {tab === 4 && (
              curriculum.length ? (
                <div className="space-y-4">
                  {curriculum.map((level, i) => (
                    <div key={i} className="rounded-2xl ring-1 ring-slate-100 bg-white overflow-hidden">
                      <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-5 py-3 border-b border-slate-100">
                        <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        <h4 className="font-bold text-slate-900">{level.title}</h4>
                        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500">
                          {level.age && <span className="inline-flex items-center gap-1"><Baby className="h-3.5 w-3.5" />{level.age}</span>}
                          {level.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{level.duration}</span>}
                        </div>
                      </div>
                      {level.topics?.length > 0 && (
                        <ul className="p-5 grid sm:grid-cols-2 gap-x-6 gap-y-2">
                          {level.topics.map((t, j) => <li key={j} className="flex gap-2 items-start text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />{t}</li>)}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p>A structured, level-by-level curriculum — personalised further after your free demo class.</p>
            )}
            {tab === 5 && (
              <ul className="space-y-2">
                {['A laptop, tablet or desktop with a stable internet connection', 'A quiet space for the live class', 'Enthusiasm to learn — no prior experience needed for beginner levels', 'Any subject-specific materials will be shared by your tutor'].map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="h-4 w-4 mt-1 text-green-500 shrink-0" />{x}</li>)}
              </ul>
            )}
            {tab === 6 && (
              <div className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-5">
                <h4 className="font-bold text-slate-900">{rating.toFixed(1)} / 5 ★ · {enrolled}+ students enrolled</h4>
                <p className="mt-1 text-sm text-slate-600">Parents consistently rate our mentors for personalised attention, clear concepts and steady progress. Book a free demo to experience a class first-hand.</p>
              </div>
            )}
          </div>
        </div>

        <BuyCard course={course} />
      </div>

      {/* COURSE REVIEWS — live order: reviews come right after the tabs, before the FAQ */}
      <section className="py-14 bg-[#FAFBFE]">
        <div className="container-wide">
          <SectionHead>Course Reviews</SectionHead>
          <p className="text-center text-slate-500 mb-8">No reviews yet — be the first to share your experience with this course.</p>
          <ReviewForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-white">
        <div className="container-wide">
          <SectionHead>Frequently Asked Questions</SectionHead>
          <div className="space-y-3">
            {FAQS.map((f, i) => <FaqItem key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />)}
          </div>
        </div>
      </section>

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

      {/* FREE WORKSHOPS */}
      <section className="py-14 bg-white">
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

      {/* WHAT OUR PARENTS SAY */}
      <section className="py-14 bg-[#FAFBFE]">
        <div className="container-wide">
          <SectionHead>What Our Parents Say</SectionHead>
          <div className="flex gap-5 overflow-x-auto snap-x pb-2 scrollbar-hide">
            {PARENTS.map(p => (
              <figure key={p.name} className="flex-shrink-0 snap-start w-[86%] sm:w-[46%] lg:w-[31.5%] rounded-2xl bg-white border border-[#E7E7EF] p-6">
                <div className="text-[#D4AF37] mb-2" aria-label="5/5">★★★★★</div>
                <blockquote className="text-sm text-slate-600 leading-relaxed">{p.quote}</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">{p.init}</span>
                  <span><strong className="block text-sm text-slate-900">{p.name}</strong><span className="block text-xs text-slate-500">{p.place}</span></span>
                </figcaption>
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

      {/* MEET OUR TEACHERS */}
      <section className="py-14 bg-white">
        <div className="container-wide">
          <SectionHead>Meet our Teachers</SectionHead>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {TEACHERS.map(t => (
              <Link key={t.slug} to={`/tutor/${t.slug}`} className="group rounded-[14px] bg-white border border-[#E7E7EF] overflow-hidden text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-300">
                <span className="block h-[150px] bg-brand-600 bg-cover bg-center" style={{ backgroundImage: `url('${t.img}')` }} />
                <span className="block py-2.5 font-heading text-sm font-bold text-slate-900">{t.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INSTRUMENTS & ROBOTICS KITS (store strip) */}
      <InstrumentsStrip />

      {/* DEMO OF OUR CLASSES */}
      <section className="py-14 bg-[#FAFBFE]">
        <div className="container-wide">
          <SectionHead>Demo of Our Classes</SectionHead>
          <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white text-center px-6 py-16 max-w-4xl mx-auto">
            <span className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center"><Play className="h-7 w-7 fill-white" /></span>
            <p className="text-white/90">Sample class videos coming soon — book a free demo to experience a live session.</p>
            <Link to="/book-demo" className="mt-5 inline-flex rounded-lg bg-white text-brand-700 px-6 py-2.5 text-sm font-bold hover:bg-slate-100">Book a Free Demo →</Link>
          </div>
        </div>
      </section>

      {/* RECENT STUDENT WINS */}
      <section className="py-14 bg-[#FAFBFE]">
        <div className="container-wide">
          <SectionHead>Recent Student Wins</SectionHead>
          <p className="text-center text-slate-500 -mt-6 mb-9">Real, verified results from Indiatutors students this year 🇮🇳🏆</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STUDENT_WINS.map(w => (
              <div key={w.name} className="rounded-[14px] border border-[#E7E7EF] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-block rounded-full bg-green-100 text-green-700 text-[11px] font-bold uppercase tracking-wide px-3 py-1">{w.tag}</span>
                <span className="mt-3 block font-heading font-bold text-slate-900 leading-snug">{w.name}</span>
                <span className="mt-1 block text-xs text-slate-500 leading-snug">{w.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDENT ACHIEVEMENTS */}
      <section className="py-14 bg-white">
        <div className="container-wide">
          <SectionHead>Student Achievements</SectionHead>
          <p className="text-center text-slate-500 -mt-6 mb-9">Highlighting excellence across all disciplines</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map(a => (
              <div key={a.name} className="rounded-[14px] border border-[#E7E7EF] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <span className="inline-block rounded-full bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1">{a.tag}</span>
                <span className="mt-3 block font-heading font-bold text-slate-900">{a.name}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{a.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FROM OUR BLOG */}
      <section className="py-14 bg-[#FAFBFE]">
        <div className="container-wide">
          <SectionHead>From Our Blog</SectionHead>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BLOG_POSTS.map(b => (
              <Link key={b.slug} to={`/blog/${b.slug}`} className="group rounded-[14px] bg-white border border-[#E7E7EF] overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <span className="block h-[160px] bg-gradient-to-br from-[#C7BDF5] to-brand-600" />
                <span className="p-5 flex flex-col flex-1">
                  <span className="text-xs text-slate-400">{b.date}</span>
                  <span className="mt-1 font-heading font-bold text-slate-900">{b.title}</span>
                  <span className="mt-1 text-sm text-slate-500">{b.excerpt}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM FEED */}
      <section className="py-14 bg-white">
        <div className="container-wide">
          <SectionHead>Instagram Feed</SectionHead>
          <p className="text-center text-slate-500 -mt-6 mb-9">A glimpse into our classes, creativity &amp; student success — straight from our Instagram 📷✨</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {INSTAGRAM.posts.map((p, i) => (
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
    </div>
  );
}
