import { useSyncExternalStore } from 'react';

// localStorage-backed cart + wishlist. Catalog products are sold individually
// (live WooCommerce parity: quantity is locked to 1 per course), so both
// stores are simple slug-keyed lists of {slug, name, price, image_url}.

function makeStore(storageKey, eventName) {
  const read = () => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; }
    catch { return []; }
  };
  let cache = read();
  const write = items => {
    cache = items;
    localStorage.setItem(storageKey, JSON.stringify(items));
    window.dispatchEvent(new Event(eventName));
  };
  const subscribe = cb => {
    const onAny = () => { cache = read(); cb(); };
    window.addEventListener(eventName, onAny);
    window.addEventListener('storage', onAny); // cross-tab
    return () => { window.removeEventListener(eventName, onAny); window.removeEventListener('storage', onAny); };
  };
  return {
    subscribe,
    get: () => cache,
    has: slug => cache.some(i => i.slug === slug),
    add(item) { if (!this.has(item.slug)) write([...cache, item]); },
    remove(slug) { write(cache.filter(i => i.slug !== slug)); },
    toggle(item) { this.has(item.slug) ? this.remove(item.slug) : this.add(item); },
    clear() { write([]); },
  };
}

export const cart = makeStore('ito_cart', 'ito:cart');
export const wishlist = makeStore('ito_wishlist', 'ito:wishlist');

export const useCart = () => useSyncExternalStore(cart.subscribe, cart.get);
export const useWishlist = () => useSyncExternalStore(wishlist.subscribe, wishlist.get);

// `choice` is the plan and level the buyer picked on the product page's buy
// card. It has to travel with the line: the card quotes the owner's rate for
// that combination, while the catalogue column holds the CHEAPEST rate (the
// group rate wherever a course has one). Without it, a Chess order placed from
// a page advertising ₹600 was billed at ₹300.
//
// `price` here is for display only — the server re-prices every line from the
// same rate card, so a tampered price never reaches an invoice.
export const cartItemOf = (c, choice = null) => ({
  slug: c.slug,
  name: c.name,
  price: Number(choice?.price ?? c.effective_price ?? c.price ?? 0),
  image_url: c.image_url || null,
  kind: 'course',
  plan: choice?.plan ?? null,
  level: choice?.level ?? null,
});

// A self-paced video course as a cart line (kind drives server-side re-pricing).
export const videoCartItem = v => ({
  slug: v.slug,
  name: v.title,
  price: Number(v.price ?? 0),
  image_url: v.thumbnail || null,
  kind: 'video',
});

export const inrFmt = n => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
