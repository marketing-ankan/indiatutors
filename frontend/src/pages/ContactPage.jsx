import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Phone, Mail, MapPin } from 'lucide-react';
import { submitContact } from '../lib/api.js';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [ok, setOk] = useState(false);
  const mutation = useMutation({
    mutationFn: submitContact,
    onSuccess: () => { setOk(true); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); },
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => { e.preventDefault(); mutation.mutate(form); };

  const input = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <div className="container-page py-12 grid lg:grid-cols-2 gap-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Contact us</h1>
        <p className="mt-3 text-slate-600">Questions about a course, pricing, or booking? Send us a note.</p>
        <ul className="mt-8 space-y-4 text-slate-700">
          <li className="flex gap-3 items-start"><Phone className="h-5 w-5 text-brand-600 mt-0.5" /> +91 93308 11581</li>
          <li className="flex gap-3 items-start"><Mail className="h-5 w-5 text-brand-600 mt-0.5" /> connect@indiatutorsonline.com</li>
          <li className="flex gap-3 items-start"><MapPin className="h-5 w-5 text-brand-600 mt-0.5" /> New Town, Kolkata, India</li>
        </ul>
      </div>

      <div className="rounded-xl bg-white ring-1 ring-slate-100 p-6">
        {ok ? (
          <div className="text-center py-10">
            <div className="mx-auto h-14 w-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">✓</div>
            <h2 className="mt-4 text-xl font-bold">Thanks! We'll be in touch.</h2>
            <button onClick={() => setOk(false)} className="mt-4 text-brand-600 font-semibold">Send another message</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input required placeholder="Your name" value={form.name} onChange={set('name')} className={input} />
            <input required type="email" placeholder="Email" value={form.email} onChange={set('email')} className={input} />
            <input placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} className={input} />
            <input placeholder="Subject" value={form.subject} onChange={set('subject')} className={input} />
            <textarea required rows={5} placeholder="How can we help?" value={form.message} onChange={set('message')} className={input} />
            {mutation.isError && (
              <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">
                {mutation.error?.response?.data?.message || 'Something went wrong.'}
              </div>
            )}
            <button disabled={mutation.isPending} className="btn-primary w-full">
              {mutation.isPending ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
