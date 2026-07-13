# Local vs Hosted (indiatutorsonline.com) — Parity Audit & Remaining Work

**Date:** 2026-07-13 · **Method:** every page of the hosted WordPress site was crawled (raw HTML + rendered DOM: headings, forms, field names, section markers, computed CSS) and compared against the local Laravel + React build rendered at 1280px (plus a 360→2560px overflow sweep). The handwritten scanned requirements PDF (`Downloads/IndiaTutors.pdf`, 2 pages) was OCR-read page by page and every item mapped against the current codebase / `PHASES.md`.

**Overall:** the local site is at or near 1:1 parity on the homepage, catalog, course detail, tutor directory, content pages and legal pages. The remaining gaps cluster in four areas: **(1) commerce (cart / checkout / wishlist / invoices), (2) the tutor profile page (reviews + enquiry + fee sidebar), (3) the Group Classes landing page, (4) small field-level differences on Book-Demo.** From the handwritten PDF, the outstanding items are payments/payouts (GST, TDS, margins, bonuses), telephony/WhatsApp linkages, location tracking, security tabs, parent-side teacher choice/replacement, and the phone app (PWA).

---

## 1 · Page-by-page comparison

Legend: ✅ parity · 🟡 partial (details below) · ❌ missing locally · ⚪ intentionally different (improvement / live-site bug)

| Hosted URL | Local route | Status | Notes |
|---|---|---|---|
| `/` (homepage) | `/` | ✅ | Rebuilt 2026-07-13 — all 15 sections, exact card data/ratings, tabs, testimonial slider, per-hour pricing, hover animations. Verified section-by-section. |
| `/shop/` | `/courses` | 🟡 | Accordion + Browse Categories sidebar ✅. **Missing the below-fold shared sections** live shows on /shop: Free Workshops, What Our Parents Say, Meet our Teachers, Demo of Our Classes, Student Achievements, From Our Blog. |
| `/product-category/{slug}/` | `/courses?category={slug}` | ✅ | Grid template, category header, breadcrumb — matches (slugs match all 112 categories). |
| `/product/{slug}/` | `/courses/{slug}` | ✅ | Rebuilt 2026-07-13 — buy card (One-to-One/Group × level price matrix, Add to Cart, wishlist, curriculum PDF, contact/profile/videos), FAQ (18), review form, other courses, workshops, parents, teachers, demo, achievements, blog. Deltas listed in §3. |
| `/tutors/` (Find Tutors) | `/find-tutors` | ✅ | Same filter set (subject / board / grade / mode / city / search). Live lists 12 tutors, local seeds 13. |
| `/tutor/{slug}/` | `/tutor/{slug}` | ✅ | Rebuilt 2026-07-13 to the live "ito-profile" template: gradient hero (✓ Verified badge, circular photo, chips, Send Enquiry / Free Trial Class), quick-stats bar, About / Subjects / Availability & Location / Parent Reviews (star form), sidebar fee card (₹/hour · Trial FREE · Book a Trial Class / Schedule Online Session) + "Send Enquiry to {tutor}" form (posts to /api/contact; email optional). |
| `/book-demo/` | `/book-demo` | 🟡 | Both have the same 5 flows (Free Demo / Group Classes / Workshops / Free Classes / Physical Tutor). **Field-level differences:** live splits *parent first/last name*, *student first/last name*, has *Age*, *"Choose your course"* dropdown, *WhatsApp + country-code select*, *Time zone select*. Local uses single full-name, free-text subject (no course dropdown), no age field, auto-detected timezone (not user-editable), adds board/mode/city (not on live). |
| `/plans-pricing/` | `/plans` | 🟡 | Calculator + Download-pricing-PDF ✅. **Missing:** "Pay Pending Invoices" block, per-plan **Add to Cart → Cart Total → Pay Now** flow with gateways (**PayPal / Remitly / Infinity**), "Complete your details to proceed", "Try a full free course" block, and the cross-sell sections (Loved by parents, See classes in action, Explore more courses, Refer-a-friend). Blocked on Phase 7 payments. |
| `/group-classes/` | `/group-classes` | ✅ | Rebuilt 2026-07-13 to the live "ito-gc" template: hero ("Learn Together, Grow Faster", 🚀 Book Now / 🎯 Book a Free Demo), sticky Browse Categories sidebar + demo side-card, and all 19 accordion course cards (batch chips, price, About, Key Highlights, 3 batch-level tiles, CTA row) scraped 1:1 into `data/groupClasses.json`. |
| `/video-courses/` | `/video-courses` | ✅ | Same h1 + "Available Video Courses". |
| `/free-classes/` | `/free-classes` | ✅ | Dedicated landing matches (built 2026-07). |
| `/events-workshops/` | `/events-workshops` | ✅ | "Upcoming Workshops" matches. |
| `/competitive-exams/` | `/competitive-exams` | ✅ | "Exam Coaching" matches. |
| `/skill-programmes/` | `/skill-programmes` | ✅ | "Skill Tracks" matches. |
| Physical Classes (nav) | — | ✅ | On live it just links to `/tutors/`; local nav should link to `/find-tutors?mode=home` (verify current target). |
| `/about-us/` | `/about` | ✅ | All 8 sections match. |
| `/contact/` | `/contact` | ✅ | Query form fields match (parent, student, email, phone, subject, message). |
| `/refer-and-earn/` | `/refer-earn` | ✅ | All sections + referral form fields match. |
| `/become-a-teacher/` | `/become-a-teacher` | ✅ | Sections match; live uses per-subject checkboxes (`bt_subjects[]`) — local equivalent exists via apply form. |
| `/blog/` + posts at **root** (`/hello-world/`) | `/blog` + `/blog/{slug}` + root fallback | ✅ | Matched to live 2026-07-13: the bare WP template (content only — no hero/title/meta), a single "Hello world!" post seeded (3 invented articles pruned), and root permalinks (`/hello-world`) resolve via a 404→post fallback like WP. |
| `/login/` | `/login` | ✅ | Live "Member Login" + "Learn · Track · Achieve"; local same tagline, real token auth (better than live). |
| `/my-account/`, `/my-account/teacher/` | `/dashboard` | ⚪ | Live = WooCommerce account. Local dashboard is the (much richer) portal. Footer Student/Teacher Login → `/login` ✅. |
| `/wishlist/` | — | ❌ | Live has a "♥ My Wishlist" page + working header count. Local: heart buttons render but are inert (no persistence, no page, no header icon). |
| `/cart/` | — | ❌ | Live has WooCommerce cart ("Your cart is currently empty!", "New in store" cross-sell) + header 🛒 count. Local: none (Phase 7). "Add to Cart" on the local course page currently routes to `/book-demo`. |
| `/privacy-policy/` `/terms-of-service/` `/refund-policy/` | `/privacy` `/terms` `/refund` | ✅ | |
| `/faq/`, `/help/`, `/sitemap/`, `/free-workshops/`, `/courses/` | — | ⚪ | **These 404 on the hosted site itself** (broken footer/homepage links on live). Local sensibly maps FAQ/Help → `/contact` and Free Workshops → `/free-classes`. Do **not** replicate the 404s. |

### Site-wide (header/footer/global)

| Item | Status | Notes |
|---|---|---|
| Header: top bar, logo, primary nav, category bar, search, Login, Book Free Demo | ✅ | Category bar collapses to burger < 1280px (live collapses ≤1024). |
| Header: **wishlist ♡ + cart 🛒 icons with counts** | ❌ | Present on live, absent locally (needs wishlist/cart features). |
| Footer: 5 columns, trust strip, payment badges, legal row | ✅ | |
| Fonts | 🟡 | Live uses Poppins headings site-wide; local uses Poppins on the homepage + course detail, Inter elsewhere. Extend `font-heading` to remaining page h1/h2s for full parity. |
| Responsive 360→2560 (incl. 768/1024) | ✅ | Homepage + course detail swept clean 2026-07-13; other pages swept in earlier sessions. |
| SEO (server meta, JSON-LD, sitemap.xml, robots) | ✅ | Local actually server-renders meta per route. |
| **301 redirect map** for go-live | ❌ | Old WP URLs differ: `/product/x/`→`/courses/x`, `/product-category/x/`→`/courses?category=x`, `/shop/`→`/courses`, `/tutors/`→`/find-tutors`, `/about-us/`→`/about`, `/plans-pricing/`→`/plans`, `/refer-and-earn/`→`/refer-earn`, root blog posts→`/blog/{slug}`. Required when the real domain moves. |

---

## 2 · What to build for exact-clone parity (prioritized)

1. **Tutor profile page** — add fee sidebar (hourly ₹ / trial FREE / Book a Trial Class / Schedule Online Session), **Parent Reviews** (list + star review form) and **Send Enquiry** form (name, WhatsApp, email, subject needed, message → lead endpoint, like contact). *(medium)*
2. **Group Classes landing page** — dedicated page ("Learn Together, Grow Faster" hero + Browse Categories + group-course grid), replacing the Plans-page reuse. *(small-medium)*
3. **/courses (shop) below-fold sections** — append the shared Free Workshops / Parents Say / Teachers / Demo / Achievements / Blog sections (components already exist from the course-detail rebuild — extract & reuse). *(small)*
4. **Book-Demo field parity** — split first/last names (parent + student), add Age, "Choose your course" dropdown (from catalog), country-code + WhatsApp field, editable Time-zone select. Keep the extra local fields if desired (superset is fine). *(small)*
5. **Wishlist** — persistent wishlist (localStorage or account-backed), header ♡ icon with count, `/wishlist` page; wire the existing heart buttons. *(medium)*
6. **Cart & checkout** — header 🛒 + `/cart`; per-plan Add to Cart on Plans; "Pay Pending Invoices" + gateway selection (PayPal/Remitly/Infinity on live; Razorpay planned) — **Phase 7, blocked on payment keys + GST details.** *(large)*
7. **Poppins headings on remaining pages** (about, contact, plans, tutors, blog, landings). *(tiny)*
8. **301 redirect map** at real-domain go-live (table above). *(small, deferred until go-live)*

Minor conscious deltas (document, don't necessarily change): live review form uses Cloudflare Turnstile (local has honeypot-free simple form, doesn't persist); a few live products use a single "Standard" level while local always offers Beginner/Intermediate/Advanced (local API lacks per-course level data); local course "Add to Cart" routes to book-demo until Phase 7.

---

## 3 · Handwritten PDF requirements — implementation status

Source: `IndiaTutors.pdf` (2 scanned pages, read in full). Header line: *"Indiatutors — Physical/Online — 1:1/Group (1.5-hr sessions) — Website/Phone app"*.

### Page 1

| # | Requirement (as written) | Status | Where / gap |
|---|---|---|---|
| 1 | Teacher portal → upload CV | 🟡 | KYC uploads cover Aadhaar/PAN/photo/certificate; **no dedicated CV upload field** (qualification/bio text exists). |
| 1 | Location tracking (address) for teacher | ⬜ | Phase 8 — home-tuition location tracking / check-in not built. |
| 1 | KYC in detail + photo — Aadhaar/PAN/certificates | ✅ | Phase 3 (private storage, validated). |
| 1 | Areas of service — pin codes / locations choose | ✅ | Teacher profile service-area pincodes (Phase 5). |
| 1 | Time schedule / slots availability | ✅ | Availability days + slots (Phase 5). |
| 1 | Subjects → approved → courses → classes/grades → CBSE/IGCSE/ICSE | 🟡 | Subjects + admin approval + course proposals ✅; **teacher-level grade/board coverage not captured** (boards exist on tutors/demos, not teacher-editable per subject). |
| 1 | Subject notes / PPT / structured notes / homework sheets / feedback mechanism | ✅ | Materials (notes/PPT/lesson-plan/question-bank/homework) + class-log feedback (Phase 5 v3). |
| 1 | WhatsApp / phone call / email linkages — tracking through phone app | ⬜ | Phase 8 — blocked on provider credentials. In-app bell notifications exist. |
| 1 | Upload details / manage & edit — easy to use & edit | ✅ | Self-editable teacher profile. |
| 2 | Parent/Student portal → KYC | ✅ | Phase 3. |
| 2 | Parent portal location tracking | ⬜ | Phase 8. |
| 2 | Parent ← multiple students | ✅ | Parent → many students CRUD. |
| 2 | Subject demo/requirement → registry of interest | ✅ | Demo requests (Phase 4). |
| 2 | Teacher options / **parent chooses** (or allocated by system) | 🟡 | System/admin allocation ✅ (matching by subject+city). **Parent-facing "choose from teacher options" UI not built.** |
| 2 | Call & confirm (security check) → message immediately | ⬜ | Telephony/messaging deferred (Phase 8); in-app notification on scheduling ✅. |
| 2 | Conversion → app download → address/student details/topic of demo | 🟡 | Conversion→enrollment ✅ with details; **"app" = PWA install — Phase 10 not started.** |
| 2 | Demo online, or offline if parent wants — teacher delivers accordingly | ✅ | Mode captured on demo (online/home). |
| 2 | Class confirmed → student enrolled → fees + GST → both parent & teacher linked in app | 🟡 | Enrollment links both sides ✅; **fees + GST collection ⬜ (Phase 7)**. |
| 2.1 | Student not available / any issue / emergency → inform in app | ⬜ | Issue/emergency reporting not built (Phase 8). |
| 2.2 | Teacher not able to visit → inform in app | 🟡 | Parent-initiated reschedule + teacher accept/decline ✅; **teacher-initiated "can't make it" flow ⬜.** |
| 2.3 | Student–teacher confirm class in app → fees calculated accordingly → teacher payment net of TDS | ⬜ | Class logging exists (teacher-side); **two-sided class confirmation, per-class fee calc, TDS payouts ⬜ (Phase 7).** |
| 5 | Teacher security — security tab integrated | ⬜ | Not built. |
| 6 | Student–Parent security | ⬜ | Not built. |
| 7 | Rescheduling of classes captured & supported through app | ✅ | Phase 8 v1 (request → decide → notify). |
| 8 | Pricing on website/app → charged accordingly | 🟡 | Pricing displayed ✅ (site + calculator); **charging ⬜ (Phase 7).** |
| 8 | Teacher payment on their rate or after fixed-margin deduction / retention bonus / conversion bonus | ⬜ | Phase 7 payouts — not started. |

### Page 2

| Requirement | Status | Where / gap |
|---|---|---|
| **Advantage to teacher:** curriculum/questions/PPT/homework sheet | ✅ | Materials + curriculum builder. |
| Continuous marketing by Indiatutors — lead generation | ✅ | Marketing site + demo-lead pipeline. |
| **Advantage to parent:** option of continuous replacement (of teacher) | ⬜ | Teacher-replacement request flow not built. |
| Central monitoring of progress | ✅ | Curriculum progress (n/m done) + class history on parent dashboard. |
| Feedback to teachers | ⬜ | No parent→teacher rating/feedback in the portal (also missing on the public tutor page — see §2 item 1). |
| Central competition | ⬜ | Not built (competitions/leaderboard). |
| Update on examinations | ✅ | Exam Updates feed (Phase 6). |
| Portfolio building of students | ✅ | Phase 6 portfolio (files/links, both roles). |
| **Dashboard 1:** location/subject/grade-wise teachers | 🟡 | City & subject breakdowns ✅ (Phase 9 v1); **grade-wise ⬜.** |
| **Dashboard 2:** location/subject/grade-wise students/parents | 🟡 | Same — city/subject ✅, grade ⬜. |
| **Dashboard 3:** revenue details — month/location/state/subject/grade-wise | ⬜ | Needs Phase 7 revenue data. |
| **Dashboard 4:** teacher payment — month/location/state/subject/grade-wise | ⬜ | Needs Phase 7 payouts. |
| **Teacher page:** KYC → brief → photo → CV | 🟡 | KYC + brief ✅; photo via tutor record; **CV upload ⬜.** |
| Students demo — status/location/details/grade/subject | ✅ | Upcoming assigned demos (PII-scoped). |
| Students enrolled / ongoing — grades/subject/details/location | ✅ | "My students" roster. |
| Progress tracker = curriculum classwise; where student stands; teacher updates after every class | ✅ | Class log + curriculum statuses. |
| Curriculum defined & allocated after demo; divided classwise; teacher can change/edit/update | ✅ | Phase 5 v3. |
| Class notes can be scanned (uploaded) | ✅ | Materials file upload. |
| Class schedules in calendar form | ✅ | Teacher month-grid calendar (Phase 5 v4). |
| **Student page:** photo + KYC + grade details | ✅ | Student profiles under parent. |
| Access to teacher details in brief | ✅ | Enrollment detail view. |
| Curriculum tracker | ✅ | |
| Access to **videos** | ⬜ | No video content/material type streaming yet (materials accept files/links; no video library). |
| Notes + LPs (lesson plans) + question bank | ✅ | Materials download. |
| Class schedules + option to edit | ✅ / 🟡 | Upcoming classes ✅; "edit" = reschedule request ✅ (direct editing ⬜ by design). |
| Student going to **teacher's home in nearby locality** | 🟡 | Pincode service areas + city matching exist; a parent-facing "learn at teacher's home nearby" discovery/matching flow is not built. |
| (Header) Website / **Phone app** | 🟡 | Website ✅; phone app = **PWA (Phase 10) ⬜**, native deferred. |
| (Header) 1.5-hr sessions | 🟡 | Session duration is free-text in class logs; not a standardized 1.5-hr scheduling unit. |

### PDF summary — what's genuinely left
1. **Payments & payouts (Phase 7)** — fees + GST at enrollment, per-class fee calculation, cart/checkout for self-paced, teacher payouts net of TDS with fixed margin + retention/conversion bonuses, invoices. *(Blocked on Razorpay keys + GST details — the single biggest outstanding block, feeds dashboard items 3–4.)*
2. **Comms & tracking (Phase 8 remainder)** — WhatsApp/phone/email linkages, call-&-confirm with security check, teacher location tracking/check-in, issue/emergency reporting, teacher-initiated unavailability.
3. **Parent-side teacher marketplace mechanics** — choose from teacher options, continuous-replacement request, feedback/rating to teachers.
4. **Security tabs** — teacher security + student/parent security sections.
5. **Admin analytics extensions** — grade-wise dimensions now; revenue & teacher-payment dashboards after Phase 7.
6. **Content** — student access to videos (video library / video material type).
7. **PWA (Phase 10)** — installable app, offline shell, push notifications ("app download" steps in the flow).
8. **Small portal gaps** — teacher CV upload; teacher grade/board coverage fields; standardized 1.5-hr session unit; central competitions.

---

## 4 · Live-site bugs found (do NOT replicate)
- `/free-workshops/` (homepage "See Free Workshops →") → **404 on live**; local correctly goes to `/free-classes`.
- Footer `/faq/`, `/help/`, `/sitemap/` → **404 on live**; local maps to `/contact` (fine) — consider real FAQ/Help pages later.
- Mega-menu "Foreign Languages" footer link points to `/courses/` → **404 on live**.
- Live "Geometry" product card uses a drum image; several products use placeholder/mismatched art — local mirrors live art 1:1 by design.
