import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

// 1:1 rebuild of the live /login "ito-lg" template: a two-panel card — a dark
// gradient brand panel (hidden below 780px) beside a white "Member Login" card
// with role tabs, icon-prefixed fields, remember/forgot row and a pill button.
// Auth stays ours (email + password via Sanctum); "Register" swaps the card to
// our sign-up form.

const NAVY = '#0B1220';
const BLUE = '#1E40AF';
const SOFT = '#F4F7FE';
const LINE = '#e6e8f0';
const MUT = '#64748b';

const LOGIN_ROLES = ['Admin', 'User', 'Parent', 'Teacher', 'Student'];
const REGISTER_ROLES = ['Student', 'Parent', 'Teacher'];

export default function LoginPage() {
  const { login, register, isAuthed } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');       // 'login' | 'register'
  const [role, setRole] = useState('Parent');
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isAuthed) nav('/dashboard', { replace: true }); }, [isAuthed, nav]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const roles = mode === 'login' ? LOGIN_ROLES : REGISTER_ROLES;

  const switchMode = m => { setMode(m); setError(''); setRole(m === 'register' ? 'Parent' : 'Parent'); };

  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        // Admin/User aren't self-registerable; Student registers as a parent account.
        const r = role.toLowerCase() === 'teacher' ? 'teacher' : 'parent';
        await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, role: r });
      }
      nav('/dashboard', { replace: true });
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.message || Object.values(data?.errors || {})[0]?.[0] || 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  const fieldWrap = 'relative mb-3.5';
  const iconCls = 'absolute left-3.5 top-1/2 -translate-y-1/2 text-base opacity-70';
  const inputCls = 'w-full rounded-xl border-[1.5px] py-[13px] pl-11 pr-11 text-[0.95rem] focus:outline-none';

  return (
    <div className="bg-[#f9f9fc] px-[clamp(16px,4vw,40px)] pb-[72px] pt-10">
      <div className="mx-auto grid max-w-[1040px] grid-cols-1 overflow-hidden rounded-[24px] border bg-white shadow-[0_24px_64px_rgba(11,18,32,.14)] min-[781px]:grid-cols-2" style={{ borderColor: LINE }}>
        {/* BRAND PANEL — hidden below 780px, like live */}
        <aside aria-hidden="true" className="relative hidden items-center overflow-hidden p-12 text-white min-[781px]:flex" style={{ background: `linear-gradient(150deg,${NAVY},${BLUE})` }}>
          <div className="pointer-events-none absolute -bottom-[50px] -left-[50px] h-[240px] w-[240px]" style={{ background: 'radial-gradient(circle,rgba(212,175,55,.3),transparent 70%)' }} />
          <div className="relative">
            <h2 className="font-heading mb-3.5 text-[2rem] font-extrabold leading-[1.15] text-[#D4AF37]">Learn · Track · Achieve</h2>
            <p className="mb-[26px] text-base leading-[1.7] text-[#cbd5e1]">Empowering every learner's journey — continue your success story. Trusted by students, teachers, and parents.</p>
            <div className="flex flex-wrap gap-3">
              {['📚', '💻', '🎓', '🎵', '🧮', '🌍'].map((b, i) => (
                <span key={i} className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] border border-white/20 bg-white/[.12] text-[1.4rem]">{b}</span>
              ))}
            </div>
          </div>
        </aside>

        {/* LOGIN / REGISTER CARD */}
        <section className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-11">
          <h1 className="font-heading mb-1 text-center text-[1.9rem] font-extrabold" style={{ color: NAVY }}>
            {mode === 'login' ? 'Member Login' : 'Create account'}
          </h1>
          <p className="mb-[22px] text-center text-[0.95rem]" style={{ color: MUT }}>
            {mode === 'login' ? 'Select your role and sign in securely' : 'Register to start learning with verified tutors'}
          </p>

          {/* Role tabs */}
          <div role="tablist" aria-label="Role" className="mb-5 flex flex-wrap gap-1 rounded-xl border p-[5px]" style={{ background: SOFT, borderColor: LINE }}>
            {roles.map(r => (
              <button key={r} type="button" role="tab" aria-selected={role === r} onClick={() => setRole(r)}
                className={`min-w-[60px] flex-1 rounded-[9px] px-1.5 py-[9px] text-[0.82rem] font-semibold transition ${role === r ? 'text-white' : ''}`}
                style={role === r ? { background: BLUE } : { color: MUT }}>
                {r}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-100">{error}</div>}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div className={fieldWrap}>
                  <span className={iconCls} aria-hidden="true">🧑</span>
                  <input required value={form.name} onChange={set('name')} placeholder="Full name" autoComplete="name" className={inputCls} style={{ borderColor: LINE }} />
                </div>
                <div className={fieldWrap}>
                  <span className={iconCls} aria-hidden="true">📱</span>
                  <input value={form.phone} onChange={set('phone')} placeholder="Phone (optional)" autoComplete="tel" className={inputCls} style={{ borderColor: LINE }} />
                </div>
              </>
            )}
            <div className={fieldWrap}>
              <span className={iconCls} aria-hidden="true">👤</span>
              <input required type={mode === 'register' ? 'email' : 'text'} value={form.email} onChange={set('email')}
                placeholder={mode === 'register' ? 'Email address' : 'Username or Email'} autoComplete="username" className={inputCls} style={{ borderColor: LINE }} />
            </div>
            <div className={fieldWrap}>
              <span className={iconCls} aria-hidden="true">🔒</span>
              <input required type={showPw ? 'text' : 'password'} minLength={mode === 'register' ? 8 : undefined}
                value={form.password} onChange={set('password')} placeholder="Password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className={inputCls} style={{ borderColor: LINE }} />
              <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent text-base opacity-70 hover:opacity-100">👁️</button>
            </div>

            <div className="my-1 mb-[18px] flex items-center justify-between text-[0.88rem]">
              <label className="flex cursor-pointer items-center gap-[7px] text-slate-700">
                <input type="checkbox" defaultChecked className="accent-brand-600" /> Remember Me
              </label>
              {mode === 'login' && <Link to="/contact" className="font-semibold hover:underline" style={{ color: BLUE }}>Forgot password?</Link>}
            </div>

            <button type="submit" disabled={busy}
              className="block w-full rounded-full py-3.5 text-base font-extrabold tracking-[0.04em] text-white shadow-[0_10px_24px_rgba(30,64,175,.32)] transition hover:bg-[#0B1220] disabled:opacity-60"
              style={{ background: BLUE }}>
              {busy ? 'Please wait…' : mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <p className="mt-[18px] text-center text-[0.92rem]" style={{ color: MUT }}>
            {mode === 'login'
              ? <>Don't have an account? <button type="button" onClick={() => switchMode('register')} className="font-bold" style={{ color: BLUE }}>Register</button></>
              : <>Already have an account? <button type="button" onClick={() => switchMode('login')} className="font-bold" style={{ color: BLUE }}>Sign in</button></>}
          </p>
        </section>
      </div>
    </div>
  );
}
