import { useQuery } from '@tanstack/react-query';
import { fetchSiteSettings } from './api';

// The site-wide contact details and social links, editable in the Staff Console.
//
// FALLBACK is what these values were when they were hardcoded in Header.jsx,
// Footer.jsx and SocialProofSections.jsx. It is used until the request resolves
// and forever after if it fails, so a backend hiccup can never leave the footer
// without a phone number — and shipping this cannot change what the site shows.
export const FALLBACK = {
  entity_name: 'Indiatutors Online LLP',
  contact_phone: '+91 93308 11581',
  contact_phone_href: 'tel:+919330811581',
  contact_email: 'connect@indiatutorsonline.com',
  contact_address: 'New Town, Kolkata — 700161',
  contact_locality: 'New Town, Kolkata',
  footer_blurb: "India's premium online tutor marketplace — connecting students with verified experts across academics, music, coding, languages, and the arts. Based in New Town, Kolkata & serving pan-India.",
  socials: {
    whatsapp: 'https://wa.me/919330811581',
    facebook: 'https://www.facebook.com/indiatutorsonline',
    instagram: 'https://www.instagram.com/indiatutorsonline',
    youtube: 'https://www.youtube.com/channel/UC9wzhXEl8sdHenhC_ZuYpgw',
    linkedin: 'https://www.linkedin.com/company/indiatutorsonline',
    twitter: 'https://twitter.com/indiatutorsonline',
  },
};

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchSiteSettings,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  // Merged rather than swapped: a field the admin clears falls back to the
  // shipped value instead of rendering an empty line.
  return {
    ...FALLBACK,
    ...(data ?? {}),
    socials: { ...FALLBACK.socials, ...(data?.socials ?? {}) },
  };
}
