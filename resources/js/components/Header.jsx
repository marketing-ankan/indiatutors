import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Search, Menu, X, LayoutDashboard, Bell, ChevronDown, Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth.jsx';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchVideoCourses } from '../lib/api.js';
import { useCart, useWishlist } from '../lib/cart.js';
import { CATALOG_NAV } from '../data/nav.js';

/** Live-header parity: ♡ wishlist and 🛒 cart icons with a count bubble that
 *  appears only when non-empty (the live count spans are `hidden` at 0). */
function HeaderIcon({ to, label, count, Icon }) {
  return (
    <Link to={to} aria-label={label} className="relative hidden p-2 text-slate-600 hover:text-brand-600 sm:inline-flex">
      <Icon className="h-5 w-5" />
      {count > 0 && <span className="absolute right-0 top-0.5 min-w-[16px] rounded-full bg-brand-600 px-0.5 text-center text-[10px] font-bold leading-4 text-white">{count > 9 ? '9+' : count}</span>}
    </Link>
  );
}

function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey:['notifications'], queryFn: fetchNotifications, refetchInterval: 60000 });
  const invalidate = () => qc.invalidateQueries({ queryKey:['notifications'] });
  const readOne = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });
  const unread = data?.unread ?? 0;
  const items = data?.data ?? [];

  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="relative p-2 text-slate-600 hover:text-brand-600" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
        <Bell className="h-5 w-5"/>
        {unread > 0 && <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 text-center px-0.5">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)}/>
          <div className="absolute right-0 top-full mt-2 z-50 w-80 max-w-[90vw] rounded-xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Notifications</span>
              {unread > 0 && <button onClick={()=>readAll.mutate()} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length ? items.map(n => (
                <button key={n.id} onClick={()=>{ if(!n.read) readOne.mutate(n.id); }} className={`w-full text-left px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50 ${n.read?'opacity-60':''}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-brand-600 shrink-0"/>}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800">{n.title}</div>
                      {n.body && <div className="text-xs text-slate-500 line-clamp-2">{n.body}</div>}
                      <div className="text-[11px] text-slate-400 mt-0.5">{n.created_at}</div>
                    </div>
                  </div>
                </button>
              )) : <p className="px-4 py-8 text-sm text-slate-400 text-center">No notifications yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const primaryNav = [
  { to:'/about', label:'About Us' },
  { to:'/find-tutors', label:'Find Tutors' },
  { to:'/plans', label:'Plans & Pricing' },
  { to:'/refer-earn', label:'Refer & Earn' },
  { to:'/become-a-teacher', label:'Become a Teacher' },
  { to:'/contact', label:'Contact' },
];

/** One tab of the live site's category bar: plain link, flat dropdown, or mega menu. */
function CatalogTab({ item }) {
  const hasMega = !!(item.mega && item.mega.length);
  // `item.items` can be an empty array on a data-driven tab whose fetch has not
  // landed (or failed). Keeping the chevron for those stops it popping in a
  // moment after paint; the panel below still only renders once there is
  // something to put in it, so no empty white card appears.
  const hasPanel = hasMega || item.items.length > 0 || !!item.source;
  return (
    // Mega tabs are NOT position-relative: their panel anchors to the full-width
    // category-bar container (which is `relative`) so a wide 1080px panel stays
    // centred in the viewport instead of overflowing off the left edge.
    <li className={`group flex-shrink-0 ${hasMega ? '' : 'relative'}`}>
      <NavLink to={item.to} end={item.to === '/'}
        className={({isActive}) => `inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase whitespace-nowrap py-2.5 ${isActive ? 'text-brand-600' : 'text-slate-700 hover:text-brand-600'}`}>
        {item.label}{hasPanel && <ChevronDown className="h-3 w-3 opacity-60"/>}
      </NavLink>

      {hasMega && (
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition absolute left-0 right-0 top-full z-50 pt-1 hidden xl:flex justify-center">
          <div className="w-[min(92vw,1080px)] max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 p-5">
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5">
              {item.mega.map(col => (
                <div key={col.label} className="min-w-0">
                  <Link to={col.to} className="block text-[13px] font-extrabold text-slate-900 hover:text-brand-600 mb-1.5 normal-case tracking-normal">{col.label}</Link>
                  <ul className="space-y-0.5">
                    {col.items.map(it => (
                      <li key={it.label + it.to}><Link to={it.to} className="block text-xs text-slate-600 hover:text-brand-600 truncate normal-case tracking-normal py-0.5">{it.label}</Link></li>
                    ))}
                  </ul>
                  <Link to={col.to} className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700 normal-case tracking-normal">View all →</Link>
                </div>
              ))}
            </div>
            {item.footer?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-5">
                {item.footer.map(f => <Link key={f.label} to={f.to} className="text-xs font-bold text-brand-700 hover:text-brand-800 normal-case tracking-normal">{f.label}</Link>)}
              </div>
            )}
          </div>
        </div>
      )}

      {!item.mega?.length && item.items.length > 0 && (
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition absolute left-0 top-full z-50 pt-1 hidden xl:block">
          {/* max-h: this list is now data-driven and unbounded on the server
              side, so without it a long catalogue would run off the screen. */}
          <div className="w-64 max-h-[70vh] overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 py-2">
            {item.items.map(it => (
              <Link key={it.label + it.to} to={it.to} className="block px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 normal-case tracking-normal">{it.label}</Link>
            ))}
            {item.footer?.map(f => (
              <Link key={f.label} to={f.to} className="block px-4 py-2 mt-1 border-t border-slate-100 text-xs font-bold text-brand-700 hover:text-brand-800 normal-case tracking-normal">{f.label}</Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

/** One row of the mobile menu — shared by the primary links and the catalog tabs. */
const mobileRow = ({ isActive }) =>
  `block rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-800 hover:bg-slate-50'}`;

export default function Header() {
  const [open, setOpen] = useState(false);
  // Which catalog tab is expanded in the mobile menu. One at a time, so a long
  // list never buries the tabs below it.
  const [openSection, setOpenSection] = useState(null);
  const [sq, setSq] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const nav = useNavigate();
  const { isAuthed, user } = useAuth();
  const cartItems = useCart();
  const wishItems = useWishlist();
  const onSearch = e => { e.preventDefault(); if(sq.trim()) { nav(`/courses?search=${encodeURIComponent(sq.trim())}`); setShowSearch(false); setSq(''); }};

  // The Video Courses menu is the one tab whose contents are products, so it
  // reads them instead of hardcoding them. One query HERE, not in CatalogTab:
  // that renders once per tab, so a query inside it would fire ~9 requests a
  // page, and making it conditional would break the rules of hooks.
  //
  // Same queryKey as VideoCoursesPage, so a visitor who opens the catalogue
  // pays nothing extra, and the Staff Console already invalidates this key on
  // every save — editing a course updates the menu with no extra wiring.
  const { data: videoCourses } = useQuery({
    queryKey: ['video-courses'], queryFn: fetchVideoCourses, staleTime: 5 * 60_000,
  });
  // `?? []` is load-bearing: CatalogTab dereferences item.items.length with no
  // guard, so an undefined here would white-screen the header on every route
  // while the request is in flight. Empty degrades the tab to a plain link.
  const videoItems = (videoCourses ?? []).slice(0, 8)
    .map(c => ({ label: c.title, to: `/video-courses/${c.slug}` }));

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm [overflow-x:clip] print:hidden">
      <div className="bg-slate-900 text-slate-300 text-xs">
        <div className="container-wide flex items-center justify-between py-2">
          <div className="flex flex-wrap items-center gap-4">
            <a href="tel:+919330811581" className="inline-flex items-center gap-1.5 hover:text-white"><Phone className="h-3.5 w-3.5"/>+91 93308 11581</a>
            <a href="mailto:connect@indiatutorsonline.com" className="hidden sm:inline-flex items-center gap-1.5 hover:text-white"><Mail className="h-3.5 w-3.5"/>connect@indiatutorsonline.com</a>
            <span className="hidden md:inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5"/>New Town, Kolkata</span>
          </div>
        </div>
      </div>
      <div className="border-b border-slate-100">
        <div className="container-wide flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/build/images/site/logo.png" alt="Indiatutors Online" className="h-9 w-auto"
              onError={e=>{ e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}/>
            <span className="text-xl font-extrabold tracking-tight" style={{display:'none'}}>Indiatutors <span className="text-brand-600">Online</span></span>
          </Link>
          {/* xl, not lg: between 1024 and ~1150px this nav pushed the row 127px
              wide, and the header carries [overflow-x:clip] so there was no
              scrollbar to recover the burger or half of "Book Free Demo". The
              burger below is xl:hidden, so the two now hand over at one width. */}
          <nav className="hidden xl:flex items-center gap-6">
            {primaryNav.map(n => (
              <NavLink key={n.to} to={n.to} className={({isActive})=>`text-sm font-medium whitespace-nowrap ${isActive?'text-brand-600':'text-slate-700 hover:text-brand-600'}`}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {showSearch ? (
              <form onSubmit={onSearch} className="flex items-center gap-2">
                <input autoFocus aria-label="Search courses" value={sq} onChange={e=>setSq(e.target.value)} placeholder="Search courses…" className="w-44 rounded-md ring-1 ring-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
                <button type="button" aria-label="Close search" onClick={()=>setShowSearch(false)} className="p-1.5 text-slate-500"><X className="h-4 w-4"/></button>
              </form>
            ):(
              <button aria-label="Search courses" onClick={()=>setShowSearch(true)} className="p-2 text-slate-600 hover:text-brand-600 hidden md:inline-flex"><Search className="h-5 w-5"/></button>
            )}
            <HeaderIcon to="/wishlist" label={`Wishlist (${wishItems.length})`} count={wishItems.length} Icon={Heart} />
            <HeaderIcon to="/cart" label={`Cart (${cartItems.length})`} count={cartItems.length} Icon={ShoppingCart} />
            {isAuthed && <NotificationBell />}
            {user?.role === 'admin' && <Link to="/admin" className="hidden sm:inline-flex rounded-md bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-slate-800">Staff</Link>}
            {isAuthed
              ? <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LayoutDashboard className="h-4 w-4"/>Dashboard</Link>
              : <Link to="/login" className="hidden sm:inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Login</Link>}
            <Link to="/book-demo" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 whitespace-nowrap">Book Free Demo</Link>
            <button className="xl:hidden p-2" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-menu" onClick={()=>setOpen(!open)}>{open?<X className="h-6 w-6"/>:<Menu className="h-6 w-6"/>}</button>
          </div>
        </div>
      </div>
      {/* Category bar only from xl — below that it doesn't fit and the live
          site collapses to the burger menu instead. */}
      <div className="hidden xl:block border-b border-slate-100">
        <div className="container-wide relative">
          <ul className="flex items-center [justify-content:safe_center] gap-3 2xl:gap-6">
            {CATALOG_NAV.map(item => (
              <CatalogTab key={item.label}
                item={item.source === 'video-courses' ? { ...item, items: videoItems } : item} />
            ))}
          </ul>
        </div>
      </div>
      {open && (
        <div id="mobile-menu" className="xl:hidden border-t border-slate-100 bg-white">
          <div className="container-wide py-4 space-y-1">
            {primaryNav.map(n => (
              <NavLink key={n.to+n.label} to={n.to} onClick={()=>setOpen(false)} className={mobileRow}>{n.label}</NavLink>
            ))}
            {/* Catalog tabs used to collapse to a bare top-level link here, so
                every child destination — the video courses, the exam and free-class
                pages — was reachable on desktop only. They expand now.
                The two mega tabs stay plain links on purpose: "Our Courses" alone
                holds 108 of them, which is a category page, not a menu. */}
            {CATALOG_NAV.slice(1).map(n => {
              const kids = n.source === 'video-courses' ? videoItems : (n.items || []);
              const expandable = !n.mega?.length && kids.length > 0;
              const isOpen = openSection === n.label;
              return (
                <div key={n.to+n.label}>
                  <div className="flex items-center">
                    <NavLink to={n.to} onClick={()=>setOpen(false)} className={({isActive}) => mobileRow({isActive}) + ' flex-1'}>{n.label}</NavLink>
                    {expandable && (
                      <button type="button" onClick={()=>setOpenSection(s => s === n.label ? null : n.label)}
                        aria-label={`${isOpen ? 'Hide' : 'Show'} ${n.label}`} aria-expanded={isOpen}
                        className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-brand-600">
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {expandable && isOpen && (
                    <div className="mb-1 ml-3 space-y-0.5 border-l border-slate-100 pl-3">
                      {kids.map(it => (
                        <NavLink key={it.to+it.label} to={it.to} onClick={()=>setOpen(false)}
                          className={({isActive})=>`block rounded-md px-3 py-1.5 text-[13px] ${isActive?'text-brand-600 font-semibold':'text-slate-600 hover:bg-slate-50'}`}>
                          {it.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
