import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="text-xl font-extrabold text-white">Indiatutors <span className="text-brand-400">Online</span></div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">Live 1-on-1 classes, group sessions, and self-paced video courses across Academics, Coding, Music, Dance, Languages & more.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Explore</h4>
          <ul className="space-y-2 text-sm">
            {[['Courses','/courses'],['Find Tutors','/find-tutors'],['Plans & Pricing','/plans'],['Book Demo','/book-demo'],['Refer & Earn','/refer-earn']].map(([l,h])=>(
              <li key={l}><Link to={h} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
          <ul className="space-y-2 text-sm">
            {[['About Us','/about'],['Become a Teacher','/become-a-teacher'],['Contact','/contact']].map(([l,h])=>(
              <li key={l}><Link to={h} className="hover:text-white">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm">Get in touch</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex gap-2 items-start"><Phone className="h-4 w-4 mt-0.5 shrink-0"/>+91 93308 11581</li>
            <li className="flex gap-2 items-start"><Mail className="h-4 w-4 mt-0.5 shrink-0"/>connect@indiatutorsonline.com</li>
            <li className="flex gap-2 items-start"><MapPin className="h-4 w-4 mt-0.5 shrink-0"/>New Town, Kolkata, India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Indiatutors Online. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-300">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
