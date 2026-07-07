import { Link } from 'react-router-dom';
import { CheckCircle2, MapPin, Phone, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <div className="bg-brand-900 text-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight">About Indiatutors Online</h1>
          <p className="mt-3 text-slate-300 max-w-2xl">India's most trusted platform for live, personalised education — online and at home.</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-2 gap-12">
        <div>
          <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/AboutUsImage1.webp" alt="About" className="rounded-2xl shadow-lg w-full object-cover h-72 mb-6"/>
          <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/AboutUsImage2.webp" alt="Tutors" className="rounded-2xl shadow-lg w-full object-cover h-48"/>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed mb-6">At India Tutors Online, we believe that meaningful teacher-student interaction is the foundation of effective learning. Our mission is to make live, personalised education accessible to every family in India — without financial burden, without compromise on quality.</p>
          <h2 className="text-2xl font-extrabold mb-4">What We Offer</h2>
          <ul className="space-y-2 mb-8">
            {['Live one-on-one sessions — personalised curriculum, direct mentorship','Group classes — collaborative learning at affordable rates','Home tuition — verified tutors who visit your home in your city','Post-class mentoring — doubt clearing and homework support','Certification — recognised course completion certificates','No fixed commitment — flexible scheduling, easy rescheduling','Free trial class — try before you commit'].map(f=>(
              <li key={f} className="flex gap-2 items-start text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5"/>{f}</li>
            ))}
          </ul>
          <div className="rounded-2xl bg-slate-50 p-6 space-y-3">
            <h3 className="font-bold">Get in touch</h3>
            <p className="text-sm text-slate-600 flex gap-2"><MapPin className="h-4 w-4 text-brand-600 shrink-0 mt-0.5"/>Astra Tower, ANR-201, 2nd Floor, North Block, AA-II, New Town, Kolkata, West Bengal, India</p>
            <p className="text-sm text-slate-600 flex gap-2"><Phone className="h-4 w-4 text-brand-600"/>+91 93308 11581</p>
            <p className="text-sm text-slate-600 flex gap-2"><Mail className="h-4 w-4 text-brand-600"/>connect@indiatutorsonline.com</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center">
          <img src="https://indiatutorsonline.com/wp-content/uploads/2026/04/DineshJhunjhunwalaFounder.webp" alt="Founder" className="w-40 h-40 rounded-full object-cover shadow-lg ring-4 ring-white flex-shrink-0"/>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-2">Founder & CEO</p>
            <h2 className="text-2xl font-extrabold">Dinesh Jhunjhunwala</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">Dinesh founded Indiatutors Online with a singular vision: to build a platform where every Indian child has access to a qualified, caring tutor — regardless of location or budget. With 15+ years in education and technology, he leads a team passionate about making learning personal again.</p>
          </div>
        </div>
      </div>
      <div className="py-10 text-center">
        <Link to="/book-demo" className="inline-flex rounded-lg bg-brand-600 text-white px-8 py-3 text-sm font-bold hover:bg-brand-700">Book a Free Trial Class</Link>
      </div>
    </>
  );
}
