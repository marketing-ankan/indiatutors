import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const phone   = import.meta.env.VITE_PHONE   || '+91 93308 11581';
  const email   = import.meta.env.VITE_EMAIL   || 'connect@indiatutorsonline.com';
  const address = import.meta.env.VITE_ADDRESS || 'New Town, Kolkata';

  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="container-page py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="text-xl font-extrabold text-white">
            Indiatutors <span className="text-brand-400">Online</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Live 1-on-1 classes, group sessions, and self-paced video courses across Academics,
            Coding, Music, Dance, Languages & more — taught by India's top tutors.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/courses" className="hover:text-white">Our Courses</Link></li>
            <li><Link to="/find-tutors" className="hover:text-white">Find Tutors</Link></li>
            <li><Link to="/plans" className="hover:text-white">Plans & Pricing</Link></li>
            <li><Link to="/book-demo" className="hover:text-white">Book a Free Demo</Link></li>
            <li><Link to="/refer-earn" className="hover:text-white">Refer & Earn</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/become-a-teacher" className="hover:text-white">Become a Teacher</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Get in touch</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2 items-start"><Phone className="h-4 w-4 mt-0.5 shrink-0" /> {phone}</li>
            <li className="flex gap-2 items-start"><Mail className="h-4 w-4 mt-0.5 shrink-0" /> {email}</li>
            <li className="flex gap-2 items-start"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {address}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Indiatutors Online. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link to="/terms"   className="hover:text-slate-300">Terms</Link>
            <Link to="/refund"  className="hover:text-slate-300">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
