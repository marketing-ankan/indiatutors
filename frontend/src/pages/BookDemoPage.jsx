import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { submitDemoRequest } from '../lib/api.js';

const emptyForm = {
  name: '',
  email: '',
  phone_country_code: '+91',
  phone: '',
  subject: '',
  grade: '',
  board: '',
  mode: 'online',
  city: '',
  country: 'India',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  message: '',
  whatsapp_consent: true,
  marketing_consent: false,
};

export default function BookDemoPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ ...emptyForm, subject: params.get('course') ? decodeURIComponent(params.get('course')) : '' });
  const [ok, setOk] = useState(false);

  const mutation = useMutation({
    mutationFn: submitDemoRequest,
    onSuccess: () => {
      setOk(true);
      setForm(emptyForm);
    },
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (ok) {
    return (
      <div className="container-page py-20 text-center max-w-lg mx-auto">
        <div className="mx-auto h-16 w-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-3xl">✓</div>
        <h1 className="mt-6 text-2xl font-extrabold">Request received!</h1>
        <p className="mt-2 text-slate-600">Our team will reach out on WhatsApp within 24 hours to match a tutor and schedule your free demo.</p>
        <button onClick={() => setOk(false)} className="mt-6 text-brand-600 font-semibold">Book another demo →</button>
      </div>
    );
  }

  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Book a Free Demo</h1>
      <p className="text-slate-500 mt-2">Fill this in and we'll match you with a verified tutor. The demo is free with no commitment.</p>

      <form onSubmit={submit} className="mt-8 space-y-5 bg-white p-6 rounded-xl ring-1 ring-slate-100">
        <Row>
          <Field label="Full name*"><input required value={form.name} onChange={set('name')} className={input} /></Field>
          <Field label="Email*"><input required type="email" value={form.email} onChange={set('email')} className={input} /></Field>
        </Row>
        <Row>
          <Field label="Country code" className="w-32 flex-none">
            <select value={form.phone_country_code} onChange={set('phone_country_code')} className={input}>
              <option>+91</option><option>+1</option><option>+44</option><option>+61</option><option>+65</option><option>+971</option>
            </select>
          </Field>
          <Field label="Phone / WhatsApp*"><input required value={form.phone} onChange={set('phone')} className={input} /></Field>
        </Row>
        <Row>
          <Field label="Subject / Course"><input value={form.subject} onChange={set('subject')} placeholder="e.g. Class 10 Math, Python for beginners" className={input} /></Field>
          <Field label="Grade / Class">
            <select value={form.grade} onChange={set('grade')} className={input}>
              <option value="">Select…</option>
              {['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12','College','Adult'].map(g => <option key={g}>{g}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Board">
            <select value={form.board} onChange={set('board')} className={input}>
              <option value="">Select…</option>
              {['CBSE','ICSE','IB','IGCSE','State','US','UK','Other'].map(b => <option key={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Mode">
            <select value={form.mode} onChange={set('mode')} className={input}>
              <option value="online">Online</option>
              <option value="home">Home tutor</option>
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="City"><input value={form.city} onChange={set('city')} className={input} /></Field>
          <Field label="Country"><input value={form.country} onChange={set('country')} className={input} /></Field>
        </Row>
        <Field label="Anything specific we should know?">
          <textarea rows={3} value={form.message} onChange={set('message')} className={input} />
        </Field>

        <div className="space-y-2 text-sm text-slate-600">
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={form.whatsapp_consent} onChange={set('whatsapp_consent')} className="mt-1" />
            <span>You may contact me on WhatsApp about this demo.</span>
          </label>
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={form.marketing_consent} onChange={set('marketing_consent')} className="mt-1" />
            <span>Send me occasional updates on new courses and offers.</span>
          </label>
        </div>

        {mutation.isError && (
          <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">
            {mutation.error?.response?.data?.message || 'Something went wrong. Please try again.'}
          </div>
        )}

        <button disabled={mutation.isPending} className="btn-primary w-full">
          {mutation.isPending ? 'Submitting…' : 'Request Free Demo'}
        </button>
      </form>
    </div>
  );
}

const input = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Row({ children }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
