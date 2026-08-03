import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter, MessageCircle, ChevronRight } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { submitContact } from '../lib/api.js';
import { LEGAL_NAV } from '../data/legal.js';

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
// than mixed into Support — LEGAL_NAV is derived from legal.js so the labels and
// paths can't drift from the documents themselves.
const SOCIALS = [
  [MessageCircle, 'https://wa.me/919330811581', 'WhatsApp'],
  [Facebook, 'https://www.facebook.com/indiatutorsonline', 'Facebook'],
  [Instagram, 'https://www.instagram.com/indiatutorsonline', 'Instagram'],
  // Real channel (the @indiatutorsonline handle on the live site 404s;
  // user-approved correction — the business's channel is WinQuest's).
  [Youtube, 'https://www.youtube.com/channel/UC9wzhXEl8sdHenhC_ZuYpgw', 'YouTube'],
  [Linkedin, 'https://www.linkedin.com/company/indiatutorsonline', 'LinkedIn'],
  [Twitter, 'https://twitter.com/indiatutorsonline', 'X (Twitter)'],
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
      <div className="container-wide py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-10">
        {/* BRAND + CONTACT + NEWSLETTER */}
        <div>
          <div className="text-xl font-extrabold text-white">IndiaTutors<span className="text-brand-400">Online</span></div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">India's premium online tutor marketplace — connecting students with verified experts across academics, music, coding, languages, and the arts. Based in New Town, Kolkata & serving pan-India.</p>
          <div className="mt-4 flex gap-2">
            {SOCIALS.map(([Icon, href, label]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                 className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700">
                <Icon className="h-4 w-4"/>
              </a>
            ))}
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li className="flex gap-2 items-center"><Phone className="h-4 w-4 shrink-0"/><a href="tel:+919330811581" className="hover:text-white">+91 93308 11581</a></li>
            <li className="flex gap-2 items-center"><Mail className="h-4 w-4 shrink-0"/><a href="mailto:connect@indiatutorsonline.com" className="hover:text-white break-all">connect@indiatutorsonline.com</a></li>
            <li className="flex gap-2 items-start"><MapPin className="h-4 w-4 mt-0.5 shrink-0"/>New Town, Kolkata — 700161</li>
          </ul>
          <div className="mt-5">
            <p className="text-xs font-bold text-white mb-2">✉️ Get free study tips & offers</p>
            {subscribe.isSuccess ? (
              <p className="text-sm text-green-400 font-semibold">✅ Subscribed — see you in your inbox!</p>
            ) : (
              <form onSubmit={e=>{e.preventDefault(); if(email) subscribe.mutate();}} className="flex">
                <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email address"
                  className="min-w-0 flex-1 rounded-l-md bg-slate-800 ring-1 ring-slate-700 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-brand-500"/>
                <button disabled={subscribe.isPending} className="rounded-r-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-500 disabled:opacity-60">
                  {subscribe.isPending ? '…' : 'Subscribe'}
                </button>
              </form>
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
            {LEGAL_NAV.map(([label, href]) => (
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
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5">
            <span>🛡️ Verified Tutors</span>
            <span>⭐ 4.8/5 Avg Rating</span>
            <span>👨‍👩‍👧 10,000+ Happy Students</span>
            <span>🔒 SSL Secured</span>
            <span>🎓 500+ Expert Tutors</span>
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
        <div className="container-wide py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Indiatutors Online. All rights reserved. Made with ❤️ in India.</span>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/terms-conditions" className="hover:text-slate-300">Terms</Link>
            <Link to="/payment-refund-policy" className="hover:text-slate-300">Payment & Refund</Link>
            <Link to="/refer-earn-policy" className="hover:text-slate-300">Refer & Earn</Link>
            <Link to="/privacy-policy" className="hover:text-slate-300">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
