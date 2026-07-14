import { Link } from 'react-router-dom';
import { X, Heart } from 'lucide-react';
import { cart, wishlist, useWishlist, inrFmt } from '../lib/cart.js';

// Wishlist — the live header links a ♥ wishlist page; items persist locally
// and can be moved to the cart.
export default function WishlistPage() {
  const items = useWishlist();

  return (
    <div className="container-wide py-12">
      <h1 className="font-heading mb-8 flex items-center gap-2 text-3xl font-extrabold tracking-tight text-[#1A1A1A]"><Heart className="h-7 w-7 text-red-500" /> My Wishlist</h1>
      {!items.length ? (
        <div className="rounded-xl bg-[#F3F6FC] px-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-700">Your wishlist is empty.</p>
          <p className="mt-1 text-sm text-slate-500">Tap the ♡ on any course to save it here.</p>
          <Link to="/courses" className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Browse Courses</Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-[#E7E7EF] bg-white px-5">
          {items.map(i => (
            <div key={i.slug} className="flex items-center gap-4 py-4">
              <Link to={`/courses/${i.slug}`} className="block h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F3F6FC]">
                {i.image_url
                  ? <img src={i.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E40AF] to-[#1E3A8A] font-heading font-bold text-white/90">{i.name[0]}</span>}
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/courses/${i.slug}`} className="font-heading block truncate text-sm font-bold text-[#1A1A1A] hover:text-brand-600">{i.name}</Link>
                <p className="mt-0.5 text-sm font-bold text-brand-600">{inrFmt(i.price)}</p>
              </div>
              <button type="button" onClick={() => { cart.add(i); wishlist.remove(i.slug); }}
                className="rounded-lg bg-brand-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700">Add to cart</button>
              <button type="button" onClick={() => wishlist.remove(i.slug)} aria-label={`Remove ${i.name} from wishlist`}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
