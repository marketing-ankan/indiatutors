import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';

export default function LoginPage() {
  const { login, register, isAuthed } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'parent', phone:'' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isAuthed) nav('/dashboard', { replace:true }); }, [isAuthed, nav]);

  const set = k => e => setForm({ ...form, [k]: e.target.value });
  const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') await login({ email:form.email, password:form.password });
      else await register(form);
      nav('/dashboard', { replace:true });
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.message || Object.values(data?.errors||{})[0]?.[0] || 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-8">
        <div className="flex rounded-lg bg-slate-100 p-1 mb-6 text-sm font-semibold">
          {['login','register'].map(m => (
            <button key={m} onClick={()=>{setMode(m);setError('');}} className={`flex-1 rounded-md py-2 ${mode===m?'bg-white shadow text-brand-700':'text-slate-500'}`}>
              {m==='login'?'Sign in':'Create account'}
            </button>
          ))}
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{mode==='login'?'Welcome back':'Join IndiaTutors'}</h1>
        <p className="text-sm text-slate-500 mb-6">{mode==='login'?'Sign in to your dashboard.':'Create your account to manage students and classes.'}</p>

        {error && <div className="mb-4 rounded-md bg-red-50 text-red-700 text-sm p-3">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          {mode==='register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">I am a</label>
                <select value={form.role} onChange={set('role')} className={inp}>
                  <option value="parent">Parent / Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
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
            <input required type="password" minLength={mode==='register'?8:undefined} value={form.password} onChange={set('password')} className={inp}/>
            {mode==='register' && <p className="text-xs text-slate-400 mt-1">At least 8 characters.</p>}
          </div>
          <button disabled={busy} className="w-full rounded-lg bg-brand-600 text-white py-2.5 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
            {busy ? 'Please wait…' : (mode==='login'?'Sign in':'Create account')}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          {mode==='login' ? <>New here? <button onClick={()=>setMode('register')} className="text-brand-600 font-semibold">Create an account</button></>
                          : <>Already have an account? <button onClick={()=>setMode('login')} className="text-brand-600 font-semibold">Sign in</button></>}
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Or just <Link to="/book-demo" className="text-brand-600 font-semibold">book a free demo</Link> — no account needed.
      </p>
    </div>
  );
}
