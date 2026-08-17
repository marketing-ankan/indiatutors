import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter, MessageCircle, ChevronRight } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { submitContact } from '../lib/api.js';
import { LEGAL_NAV } from '../data/legal.js';
import { useSiteSettings } from '../lib/siteSettings.js';
import { fetchLegalNav } from '../lib/api.js';

// Footer ported from the live site: brand block (tagline, socials, contact,
// newsletter) + Quick Links · Our Courses · Learn & Discover · Support.
// Live links that 404 there (FAQ/Help/Sitemap pages) are mapped to working
// equivalents here (contact page, dynamic /sitemap.xml).

const QUICK_LINKS = [
  ['🏠 Home', '/'], ['ℹ️ About Us', '/about'], ['👩‍🏫 Become a Teacher', '/become-a-teacher'],
  ['💳 Plans & Pricing', '/plans'], ['🎁 Refer & Earn', '/refer-earn'], ['📝 Blog', '/blog'],
  ['📞 Contact Us', '/contact'], ['📅 Book Free Demo', '/book-demo'],
];
const OUR_COURSES = [
  ['📗 CBSE Tuition', '/courses?category=academics'], ['📘 ICSE / IGCSE / IB', '/courses?category=academics'],
  ['📐 Mathematics', '/courses?search=Mathematics'], ['⚛️ Physics', '/courses?search=Physics'],
  ['🐍 Python & AI', '/courses?search=Python'], ['💬 Spoken English', '/courses?search=Spoken English'],
  ['🎵 Music Classes', '/courses?category=musical-instruments'], ['🌐 Foreign Languages', '/courses?category=languages'],
  ['🔍 Browse All →', '/courses'],
];
const LEARN_DISCOVER = [
  ['👩‍🏫 Find Tutors', '/find-tutors'], ['🖥️ Online Tutors', '/find-tutors?mode=online'],
  ['🏠 Home Tutors', '/find-tutors?mode=home'], ['📡 Live Classes', '/courses'],
  ['👥 Group Classes', '/group-classes'], ['🎁 Free Classes', '/free-classes'],
  ['🌟 Events & Workshops', '/events-workshops'], ['🏆 Competitive Exams', '/competitive-exams'],
  ['💼 Skill Programmes', '/skill-programmes'], ['🏫 Physical Classes', '/physical-classes'],
];
const SUPPORT = [
  ['🎓 Student Login', '/login'], ['👩‍🏫 Teacher Login', '/login'],
  ['❓ FAQ', '/faqs'], ['🆘 Help Centre', '/contact'],
];
// The four policies live in their own chevron list (sister-site parity) rather
// than mixed into Support — the list is derived from the documents so labels and
// paths can't drift from the documents themselves.
const SOCIALS = [
  [MessageCircle, 'whatsapp',  'WhatsApp'],
  [Facebook,      'facebook',  'Facebook'],
  [Instagram,     'instagram', 'Instagram'],
  // The @indiatutorsonline YouTube handle on the live site 404s; the business's
  // real channel is the default in SiteSettings, and it is now editable.
  [Youtube,       'youtube',   'YouTube'],
  [Linkedin,      'linkedin',  'LinkedIn'],
  [Twitter,       'twitter',   'X (Twitter)'],
];

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-white font-bold mb-4 text-xs uppercase tracking-widest">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map(([label, href]) => (
          <li key={label}><Link to={href} className="hover:text-white">{label}</Link></li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const site = useSiteSettings();
  // The policy list follows the documents themselves, so a renamed or reordered
  // policy in the console updates every page's footer.
  const { data: liveNav } = useQuery({ queryKey: ['legal-nav'], queryFn: fetchLegalNav, staleTime: 10 * 60_000, retry: 1 });
  const legalNav = liveNav?.length ? liveNav.map(d => [d.title, '/' + d.slug]) : LEGAL_NAV;
  const [email, setEmail] = useState('');
  const subscribe = useMutation({
    mutationFn: () => submitContact({
      name: 'Newsletter subscriber', email,
      subject: 'Newsletter signup', message: 'Please send me free study tips & offers.',
    }),
    onSuccess: () => setEmail(''),
  });

  return (
    <footer className="bg-slate-900 text-slate-300 print:hidden">
      {/* A lg:grid-cols-3 step before the 5-track layout: jumping 2→5 at exactly
          1024px gave each of the last four tracks 121.5px, in which "Learn &
          Discover" wrapped to two lines and most links wrapped. */}
      <div className="container-wide py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-10">
        {/* BRAND + CONTACT + NEWSLETTER */}
        <div>
          <div className="text-xl font-extrabold text-white">IndiaTutors<span className="text-brand-400">Online</span></div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{site.footer_blurb}</p>
          <div className="mt-4 flex gap-2">
            {SOCIALS.map(([Icon, key, label]) => site.socials[key] && (
              <a key={label} href={site.socials[key]} target="_blank" rel="noopener noreferrer" aria-label={label}
                 className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700">
                <Icon className="h-4 w-4"/>
              </a>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            {site.contact_phone && (
              <li className="flex gap-2 items-center"><Phone className="h-4 w-4 shrink-0"/><a href={site.contact_phone_href} className="hover:text-white">{site.contact_phone}</a></li>
            )}
            {site.contact_email && (
              <li className="flex gap-2 items-center"><Mail className="h-4 w-4 shrink-0"/><a href={`mailto:${site.contact_email}`} className="hover:text-white break-all">{site.contact_email}</a></li>
            )}
            {site.contact_address && (
              <li className="flex gap-2 items-start"><MapPin className="h-4 w-4 mt-0.5 shrink-0"/>{site.contact_address}</li>
            )}
          </ul>
          <div className="mt-5">
            <p className="text-xs font-bold text-white mb-2">✉️ Get free study tips & offers</p>
            {subscribe.isSuccess ? (
              <p className="text-sm text-green-400 font-semibold">✅ Subscribed — see you in your inbox!</p>
            ) : (
              <>
                <form onSubmit={e=>{e.preventDefault(); if(email) subscribe.mutate();}} className="flex">
                  <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email address"
                    aria-label="Your email address"
                    className="min-w-0 flex-1 rounded-l-md bg-slate-800 ring-1 ring-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-brand-500"/>
                  <button disabled={subscribe.isPending} className="rounded-r-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                    {subscribe.isPending ? '…' : 'Subscribe'}
                  </button>
                </form>
                {/* Without this the button just re-enabled with the address still
                    typed, which reads as "nothing happened" rather than "failed". */}
                {subscribe.isError && (
                  <p className="mt-2 text-xs text-red-400">Could not subscribe — please try again.</p>
                )}
              </>
            )}
          </div>
        </div>

        <FooterCol title="Quick Links" links={QUICK_LINKS}/>
        <FooterCol title="Our Courses" links={OUR_COURSES}/>
        <FooterCol title="Learn & Discover" links={LEARN_DISCOVER}/>
        <div>
          <FooterCol title="Support" links={SUPPORT}/>
          <ul className="mt-2 space-y-2 text-sm">
            <li><a href="/sitemap.xml" className="hover:text-white">🗺️ Sitemap</a></li>
          </ul>
          <h4 className="text-white font-bold mt-7 mb-4 text-xs uppercase tracking-widest">Policies</h4>
          <ul className="space-y-2 text-sm">
            {legalNav.map(([label, href]) => (
              <li key={href}>
                <Link to={href} className="flex items-center gap-1.5 hover:text-white">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-500"/>{label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Trust strip + payment badges, like the live footer */}
      <div className="border-t border-slate-800">
        <div className="container-wide py-4 flex flex-col lg:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          {/* What survives here is what the site can stand behind.
              Removed 2026-08-15: "⭐ 4.8/5 Avg Rating" (a fabricated aggregate
              score, the same class the 10 Aug sweep deleted from the homepage),
              and "10,000+ Happy Students" / "500+ Expert Tutors" — this footer
              renders on the homepage, which says 8,000+ students and 75+ tutors
              a few hundred pixels above it, so the two numbers called each
              other liars on a single screen. They are not replaced with
              corrected figures here: the homepage is the one place those counts
              are stated, and repeating a number in two hardcoded places is what
              caused this. "Verified Tutors" is now "Screened Tutors", which is
              what the About page actually promises — only tutors who complete
              verification carry the Verified badge. */}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            <span>🛡️ Screened Tutors</span>
            <span>🎓 Free First Demo Class</span>
            <span>🔒 SSL Secured</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="mr-1">We accept:</span>
            {['UPI','Razorpay','VISA','MC','Net Banking'].map(p => (
              <span key={p} className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Indiatutors Online. All rights reserved. Made with ❤️ in India.</span>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/terms-conditions" className="hover:text-white">Terms</Link>
            <Link to="/payment-refund-policy" className="hover:text-white">Payment & Refund</Link>
            <Link to="/refer-earn-policy" className="hover:text-white">Refer & Earn</Link>
            <Link to="/privacy-policy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
