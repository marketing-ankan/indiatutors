import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

// Styled after the live /login/ page: dark backdrop, "Learn · Track · Achieve",
// a "Member Login" card with role chips, remember-me and an eye toggle.
// Auth stays ours (email + password via Sanctum).

const ROLES = [
  ['student', '🎓 Student'],
  ['parent', '👪 Parent'],
  ['teacher', '👩‍🏫 Teacher'],
];

export default function LoginPage() {
  const { login, register, isAuthed } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('parent');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isAuthed) nav('/dashboard', { replace:true }); }, [isAuthed, nav]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') await login({ email:form.email, password:form.password });
      else await register({ ...form, role: role === 'student' ? 'parent' : role });
      nav('/dashboard', { replace:true });
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.message || Object.values(data?.errors||{})[0]?.[0] || 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#0B1220] to-brand-800 py-16 min-h-[70vh]">
      <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,.18),transparent_70%)]"/>
      <div className="relative mx-auto max-w-md px-4">
        <div className="text-center mb-6 text-white">
          <h1 className="text-3xl font-extrabold tracking-tight">Learn · Track · Achieve</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to your dashboard — classes, progress and materials in one place.</p>
        </div>

        <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-2xl p-8">
          <div className="flex rounded-lg bg-slate-100 p-1 mb-5 text-sm font-semibold">
            {['login','register'].map(m => (
              <button key={m} onClick={()=>{setMode(m);setError('');}} className={`flex-1 rounded-md py-2 ${mode===m?'bg-white shadow text-brand-700':'text-slate-500'}`}>
                {m==='login'?'Member Login':'Create account'}
              </button>
            ))}
          </div>

          {/* Role chips (live-site pattern). For login they're informational; for register they pick the account type. */}
          <div className="flex gap-1.5 mb-5">
            {ROLES.map(([r,label]) => (
              <button key={r} type="button" onClick={()=>setRole(r)}
                className={`flex-1 rounded-full px-2 py-1.5 text-xs font-bold ${role===r?'bg-brand-600 text-white':'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 rounded-md bg-red-50 text-red-700 text-sm p-3">{error}</div>}

          <form onSubmit={submit} className="space-y-4">
            {mode==='register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full name</label>
                  <input required value={form.name} onChange={set('name')} className={inp}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (optional)</label>
                  <input value={form.phone} onChange={set('phone')} className={inp}/>
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={set('email')} className={inp}/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input required type={showPw?'text':'password'} minLength={mode==='register'?8:undefined} value={form.password} onChange={set('password')} className={inp + ' pr-10'}/>
                <button type="button" onClick={()=>setShowPw(s=>!s)} aria-label={showPw?'Hide password':'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </button>
              </div>
              {mode==='register' && <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>}
            </div>
            {mode==='login' && (
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" defaultChecked className="accent-brand-600"/> Remember Me
              </label>
            )}
            <button disabled={busy} className="w-full rounded-lg bg-brand-600 text-white py-2.5 text-sm font-extrabold tracking-wide hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Please wait…' : (mode==='login'?'LOG IN':'CREATE ACCOUNT')}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            {mode==='login' ? <>New here? <button onClick={()=>setMode('register')} className="text-brand-600 font-semibold">Create an account</button></>
                            : <>Already have an account? <button onClick={()=>setMode('login')} className="text-brand-600 font-semibold">Sign in</button></>}
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Or just <Link to="/book-demo" className="text-[#D4AF37] font-semibold">book a free demo</Link> — no account needed.
        </p>
      </div>
    </div>
  );
}
