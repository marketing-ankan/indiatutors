import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Search, Heart, ShoppingCart, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const primaryNav = [
  { to: '/about',           label: 'About Us' },
  { to: '/find-tutors',     label: 'Find Tutors' },
  { to: '/plans',           label: 'Plans & Pricing' },
  { to: '/refer-earn',      label: 'Refer & Earn' },
  { to: '/become-a-teacher',label: 'Become a Teacher' },
  { to: '/contact',         label: 'Contact' },
];

const catalogNav = [
  { to: '/',                                   label: 'HOME',                end: true },
  { to: '/courses',                            label: 'OUR COURSES' },
  { to: '/courses?category=video-courses',     label: 'VIDEO COURSES' },
  { to: '/courses?category=group-classes',     label: 'GROUP CLASSES' },
  { to: '/courses?category=events-workshops',  label: 'EVENTS & WORKSHOPS' },
  { to: '/courses?category=free',              label: 'FREE CLASSES' },
  { to: '/courses?category=physical',          label: 'PHYSICAL CLASSES' },
  { to: '/courses?category=competitive-exams', label: 'COMPETITIVE EXAMS' },
  { to: '/courses?category=skills',            label: 'SKILL PROGRAMMES' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const onSearch = e => {
    e.preventDefault();
    if (q.trim()) { nav(`/courses?search=${encodeURIComponent(q.trim())}`); setSearchOpen(false); setQ(''); }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      {/* Top strip */}
      <div className="bg-slate-900 text-slate-300 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
          <div className="flex flex-wrap items-center gap-4">
            <a href="tel:+919330811581" className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5" />+91 93308 11581</a>
            <a href="mailto:connect@indiatutorsonline.com" className="hidden sm:inline-flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5" />connect@indiatutorsonline.com</a>
            <span className="hidden md:inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />New Town, Kolkata</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-400">
            {[['WA','https://wa.me/919330811581'],['FB','#'],['IG','#'],['YT','#'],['IN','#']].map(([l,h]) => (
              <a key={l} href={h} className="hover:text-white text-xs font-semibold">{l}</a>
            ))}
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/IndTutorBlackLogo.png"
              alt="Indiatutors Online"
              className="h-9 w-auto"
              onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block'; }}
            />
            <span className="text-xl font-extrabold tracking-tight hidden" style={{display:'none'}}>
              Indiatutors <span className="text-brand-600">Online</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {primaryNav.map(n => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) => `text-sm font-medium whitespace-nowrap ${isActive ? 'text-brand-600' : 'text-slate-700 hover:text-brand-600'}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <form onSubmit={onSearch} className="flex items-center gap-2">
                <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)}
                  placeholder="Search courses…"
                  className="w-44 rounded-md ring-1 ring-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-800"><X className="h-4 w-4" /></button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} aria-label="Search" className="p-2 text-slate-600 hover:text-brand-600 hidden md:inline-flex">
                <Search className="h-5 w-5" />
              </button>
            )}
            <button aria-label="Wishlist" className="p-2 text-slate-600 hover:text-brand-600 hidden md:inline-flex"><Heart className="h-5 w-5" /></button>
            <button aria-label="Cart" className="p-2 text-slate-600 hover:text-brand-600 hidden md:inline-flex"><ShoppingCart className="h-5 w-5" /></button>
            <Link to="/login" className="hidden sm:inline-flex items-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Login</Link>
            <Link to="/book-demo" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 whitespace-nowrap">Book Free Demo</Link>
            <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Catalog nav */}
      <div className="hidden lg:block border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-7 py-2.5 overflow-x-auto">
            {catalogNav.map(n => (
              <li key={n.label} className="flex-shrink-0">
                <NavLink to={n.to} end={n.end}
                  className={({ isActive }) =>
                    `text-xs font-bold tracking-wider whitespace-nowrap pb-1 ${isActive ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-700 hover:text-brand-600'}`}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white max-h-screen overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-1">
            <form onSubmit={onSearch} className="flex gap-2 mb-4">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search courses…" className="flex-1 rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none" />
              <button type="submit" className="rounded-md bg-brand-600 text-white px-3 py-2"><Search className="h-4 w-4" /></button>
            </form>
            {[...primaryNav, ...catalogNav.slice(1)].map(n => (
              <NavLink key={n.to + n.label} to={n.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-800 hover:bg-slate-50'}`}>
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
