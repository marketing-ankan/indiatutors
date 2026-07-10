import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Search, Menu, X, LayoutDashboard, Bell } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../lib/auth.jsx';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api.js';

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
// Links to real categories that exist in the catalog (no dead ends).
const catalogNav = [
  { to:'/', label:'HOME', end:true },
  { to:'/courses', label:'ALL COURSES' },
  { to:'/courses?category=academics-high-school', label:'ACADEMICS' },
  { to:'/courses?category=ap-courses', label:'AP COURSES' },
  { to:'/courses?category=musical-instruments', label:'MUSIC' },
  { to:'/courses?category=it-technologies', label:'CODING & IT' },
  { to:'/courses?category=languages', label:'LANGUAGES' },
  { to:'/courses?category=dance', label:'DANCE' },
  { to:'/courses?category=standardized-tests', label:'COMPETITIVE EXAMS' },
  { to:'/find-tutors', label:'FIND TUTORS' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [sq, setSq] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const nav = useNavigate();
  const { isAuthed, user } = useAuth();
  const onSearch = e => { e.preventDefault(); if(sq.trim()) { nav(`/courses?search=${encodeURIComponent(sq.trim())}`); setShowSearch(false); setSq(''); }};

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
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
            <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/IndTutorBlackLogo.png" alt="Indiatutors Online" className="h-9 w-auto"
              onError={e=>{ e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex'; }}/>
            <span className="text-xl font-extrabold tracking-tight" style={{display:'none'}}>Indiatutors <span className="text-brand-600">Online</span></span>
          </Link>
          <nav className="hidden lg:flex items-center gap-3 xl:gap-6">
            {primaryNav.map(n => (
              <NavLink key={n.to} to={n.to} className={({isActive})=>`text-sm font-medium whitespace-nowrap ${isActive?'text-brand-600':'text-slate-700 hover:text-brand-600'}`}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {showSearch ? (
              <form onSubmit={onSearch} className="flex items-center gap-2">
                <input autoFocus value={sq} onChange={e=>setSq(e.target.value)} placeholder="Search courses…" className="w-44 rounded-md ring-1 ring-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"/>
                <button type="button" onClick={()=>setShowSearch(false)} className="p-1.5 text-slate-500"><X className="h-4 w-4"/></button>
              </form>
            ):(
              <button onClick={()=>setShowSearch(true)} className="p-2 text-slate-600 hover:text-brand-600 hidden md:inline-flex"><Search className="h-5 w-5"/></button>
            )}
            {isAuthed && <NotificationBell />}
            {user?.role === 'admin' && <Link to="/admin" className="hidden sm:inline-flex rounded-md bg-slate-900 text-white px-3 py-2 text-sm font-semibold hover:bg-slate-800">Staff</Link>}
            {isAuthed
              ? <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><LayoutDashboard className="h-4 w-4"/>Dashboard</Link>
              : <Link to="/login" className="hidden sm:inline-flex rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Login</Link>}
            <Link to="/book-demo" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 whitespace-nowrap">Book Free Demo</Link>
            <button className="lg:hidden p-2" onClick={()=>setOpen(!open)}>{open?<X className="h-6 w-6"/>:<Menu className="h-6 w-6"/>}</button>
          </div>
        </div>
      </div>
      <div className="hidden lg:block border-b border-slate-100">
        <div className="container-wide">
          <ul className="flex items-center [justify-content:safe_center] gap-4 xl:gap-7 py-2.5 overflow-x-auto">
            {catalogNav.map(n => (
              <li key={n.label} className="flex-shrink-0">
                <NavLink to={n.to} end={n.end} className={({isActive})=>`text-xs font-bold tracking-wider whitespace-nowrap pb-1 ${isActive?'text-brand-600 border-b-2 border-brand-600':'text-slate-700 hover:text-brand-600'}`}>{n.label}</NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-slate-100 bg-white">
          <div className="container-wide py-4 space-y-1">
            {[...primaryNav,...catalogNav.slice(1)].map(n => (
              <NavLink key={n.to+n.label} to={n.to} onClick={()=>setOpen(false)} className={({isActive})=>`block rounded-md px-3 py-2 text-sm font-medium ${isActive?'bg-brand-50 text-brand-600':'text-slate-800 hover:bg-slate-50'}`}>{n.label}</NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
