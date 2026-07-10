import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { submitContact } from '../lib/api.js';

// Mirrors the live /contact page: "Send us a query" form + "Reach us directly"
// card (address, phone, email, support hours, WhatsApp chat).

export default function ContactPage() {
  const empty = {name:'',student:'',email:'',phone:'',subject:'',message:''};
  const [form, setForm] = useState(empty);
  const [ok, setOk] = useState(false);
  const mutation = useMutation({
    mutationFn: (f) => submitContact({
      name: f.name, email: f.email, phone: f.phone, subject: f.subject || null,
      message: (f.student ? `Student: ${f.student}\n` : '') + f.message,
    }),
    onSuccess: () => { setOk(true); setForm(empty); },
  });
  const set = k => e => setForm({...form,[k]:e.target.value});
  const inp = "w-full rounded-md ring-1 ring-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";
  const lbl = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <>
      <div className="bg-brand-900 text-white py-12 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <span className="inline-block rounded-full bg-white/15 ring-1 ring-white/25 px-3.5 py-1.5 text-xs font-bold mb-3">✉️ Get in touch</span>
          <h1 className="text-4xl font-extrabold tracking-tight">Contact Us</h1>
          <p className="mt-3 text-slate-300">Have a question or want the right tutor for your child? Send us a quick query — our team replies fast.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[1fr_380px] gap-10 items-start">
        {/* SEND US A QUERY */}
        <div className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Send us a query</h2>
          <p className="text-sm text-slate-500 mt-1 mb-6">Tell us about your requirement and we'll get back to you with the best options.</p>
          {ok ? (
            <div className="text-center py-10">
              <div className="mx-auto h-14 w-14 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl">✓</div>
              <h3 className="mt-4 text-xl font-bold">Thanks! We'll be in touch.</h3>
              <button onClick={()=>setOk(false)} className="mt-4 text-brand-600 font-semibold">Send another query</button>
            </div>
          ) : (
            <form onSubmit={e=>{e.preventDefault();mutation.mutate(form);}} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={lbl}>Parent Name *</label><input required value={form.name} onChange={set('name')} className={inp}/></div>
                <div><label className={lbl}>Student Name</label><input value={form.student} onChange={set('student')} className={inp}/></div>
                <div><label className={lbl}>Email *</label><input required type="email" value={form.email} onChange={set('email')} className={inp}/></div>
                <div><label className={lbl}>WhatsApp / Phone *</label><input required value={form.phone} onChange={set('phone')} className={inp}/></div>
              </div>
              <div><label className={lbl}>Subject / Interest</label><input placeholder="e.g. Class 8 Maths, Piano, SAT" value={form.subject} onChange={set('subject')} className={inp}/></div>
              <div><label className={lbl}>Message *</label><textarea required rows={5} value={form.message} onChange={set('message')} className={inp}/></div>
              {mutation.isError && <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">Something went wrong — please try again.</div>}
              <button disabled={mutation.isPending} className="rounded-lg bg-brand-600 text-white px-6 py-3 text-sm font-bold hover:bg-brand-700 disabled:opacity-60">
                {mutation.isPending?'Sending…':'📨 Send Query'}
              </button>
            </form>
          )}
        </div>

        {/* REACH US DIRECTLY */}
        <aside className="rounded-2xl bg-slate-50 ring-1 ring-slate-100 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold mb-5">Reach us directly</h2>
          <ul className="space-y-5 text-sm text-slate-700">
            <li className="flex gap-3"><span className="text-xl">📍</span><span><strong className="block text-slate-900">Address</strong>Astra Tower, ANR-201, 2nd Floor, North Block, AA-II, New Town, Kolkata, West Bengal, India</span></li>
            <li className="flex gap-3"><span className="text-xl">📞</span><span><strong className="block text-slate-900">Phone / WhatsApp</strong>+91 93308 11581</span></li>
            <li className="flex gap-3"><span className="text-xl">✉️</span><span><strong className="block text-slate-900">Email</strong>connect@indiatutorsonline.com</span></li>
            <li className="flex gap-3"><span className="text-xl">🕘</span><span><strong className="block text-slate-900">Support hours</strong>Mon–Sat, 9:00 AM – 8:00 PM IST</span></li>
          </ul>
          <a href="https://wa.me/919330811581" target="_blank" rel="noopener noreferrer" className="mt-6 block text-center rounded-xl bg-green-600 text-white py-3 text-sm font-bold hover:bg-green-700">💬 Chat on WhatsApp</a>
        </aside>
      </div>
    </>
  );
}
