# IndiaTutors — Prioritized Improvement Plan

---

## 🚨 SECTION A — TRUST & LEGAL RISK (read this first)

These are claims the site makes that are false, unverifiable, or that the product cannot deliver. Every one is visible to a parent deciding whether to trust you with their child, and several are directly actionable under the Consumer Protection Act 2019 / CCPA misleading-advertisement rules, ASCI's code, or the DPDP Act 2023. Fix these before anything else — most are small edits.

### A1. Every tutor profile displays "✓ Verified Tutor", verified or not — `S`
- **Wrong:** `resources/js/pages/TutorProfilePage.jsx:121` renders the green "✓ Verified Tutor" pill unconditionally. The same file already gates the verification *stat* on the real flag at line 111, and `resources/js/components/TutorCard.jsx:11-15` gates its badge correctly — so unverified tutors show "Verified" in the hero while the stats bar silently omits it.
- **Fix:** Wrap line 121 in the same `tutor.verified &&` guard used at line 111.
- **Why first:** This is a child-safety representation on a marketplace for minors. It is the single worst claim on the site to have wrong, and it is a one-line fix.

### A2. Fabricated "40% OFF" and a struck-through price that never existed — `S`
- **Wrong:** `resources/js/pages/CoursesPage.jsx:44` back-calculates a fake "was" price (`now / 0.6`) and lines 65-66 render it struck through next to a hardcoded "40% OFF" badge. No discount is offered. Lines 45-46 additionally invent enrolment counts from an FNV-1a hash of the slug, rendered as "🎓 N Students Enrolled" / "🟢 N Ongoing" (lines 58-59) and per-level "👥 N students" (line 50/91).
- **Fix:** Delete `seed`/`pick` (lines 34-35), `enrolled`, `ongoing`, `lvlCount`, and the chips at 58-59 and 91. Render only `c.effective_price`; show the struck price + badge only when `c.on_sale && c.regular_price > c.effective_price`, computing the % from real values.
- **Why:** A false reference price is the textbook misleading advertisement under the CCPA's 2022 guidelines — refundable and finable, unlike vague marketing puffery.

### A3. Four blocks of invented testimonials shipped under a "Real, verified" label — `S`
- **Wrong:** `resources/js/data/courseDetail.js` — `STUDENT_WINS` (line 62), `PARENTS` (143), `FAMILY_NOTES` (152), `WHATSAPP_TESTIMONIALS` (236) are each marked PLACEHOLDER in their own source comments, yet `resources/js/components/SocialProofSections.jsx:69` subtitles them "Real, verified results from Indiatutors students this year", line 109 "Real Results. Real Parent Voices.", line 155 "Real voices from our WhatsApp community", with hardcoded 5/5 star rows at lines 120 and 139. The invented claims are specific and checkable: named students, "97.2% in ICSE Boards", "99.1 percentile in JEE Main", a named SOF IMO gold with international rank.
- **Fix:** Set all four arrays to `[]` and make each section in `SocialProofSections.jsx` return `null` when empty — the pattern already used at `resources/js/pages/CourseDetailPage.jsx:241`. Re-add only consented, documented families.

### A4. "Student Achievements" gallery shows another company's children — `S`
- **Wrong:** `resources/js/data/courseDetail.js:196` — `ACHIEVEMENT_PHOTOS` is documented at lines 192-195 as photos copied from a sister brand. Identifiable photographs of minors are published on /courses and every course page under "🏆 Student Achievements That Shine" (`SocialProofSections.jsx:90-91`) with alt text "Student achievement {n}". `ACHIEVEMENTS` (line 203) adds invented names and awards.
- **Fix:** Empty both arrays; make `AchievementsCarousel` (`SocialProofSections.jsx:86-102`) return `null` when empty.
- **Why:** No consent chain for children's images engages the DPDP Act 2023 verifiable-parental-consent requirement, plus the sister brand's copyright and its families' rights. It is false social proof *and* a personal-data exposure.

### A5. "4.9/5 from 1,200+ reviews" sits above "No reviews yet" on the same page — `S`
- **Wrong:** `resources/js/data/courseDetail.js:137` renders "⭐ 4.9 / 5 from 1,200+ reviews" at `CourseDetailPage.jsx:605`, while the real review list on the same page shows "No reviews yet — be the first…" at `CourseDetailPage.jsx:245`. There is no Review seeder, so the true count is zero everywhere. Compounded by `courseDetail.js:78-79` ("10,000+ Classes delivered", "4.9/5 Average rating"), `CourseDetailPage.jsx:154`, and `resources/js/pages/AboutPage.jsx:136`, which stamps a literal `4.8` star rating into all eight course cards.
- **Fix:** Replace line 137 with a non-numeric trust point, or derive it from the reviews aggregate and hide at zero. Same for lines 78-79. Delete the rating span at `AboutPage.jsx:136`.
- **Why:** The contradiction is visible in one scroll — a screenshot-ready fabricated aggregate rating.

### A6. The tutor review form throws away every review and says it was received — `S`
- **Wrong:** `resources/js/pages/TutorProfilePage.jsx:44` — `onSubmit={e => { e.preventDefault(); setSent(true); }}`. No mutation, no API call; the inputs at lines 53-55 are uncontrolled so the text is never even read. Line 40 then tells the parent "Thanks! Your review has been submitted for moderation." It is the only form on the public site that reports success without attempting a submission (`EnquiryForm` in the same file, lines 65-73, does it correctly).
- **Fix:** Bind the fields and POST through a real endpoint following the `EnquiryForm` pattern — or delete `ReviewForm` (lines 36-60) and its usage at line 199 until the endpoint exists, leaving the honest empty state at line 198.
- **Why:** You are destroying the only genuine social proof you have — the exact thing the fabricated testimonials in A3 are standing in for — and lying to the parent about the outcome.

### A7. The brand contradicts itself on ratings and tutor count in one scroll — `S`
- **Wrong:** `resources/js/components/Footer.jsx:135-138` claims 4.8/5, 10,000+ students, 500+ tutors on every page. `resources/js/pages/HomePage.jsx:308-309` claims 4.9★ Google, 75+ tutors, 8,000+ students, 15+ countries; `HomePage.jsx:332-333` claims 4.7 on Google **and Trustpilot** (`aria-label="Rated 4.7 on Google and Trustpilot"`). `AboutPage.jsx:11-12` says 20+ countries / 100% verified; `PlansPage.jsx:142` says 4.9 and 20+ countries; `resources/js/data/homeLive.js:529` says 4.9 / 15+; `BecomeTeacherPage.jsx:29` says 20+. Three average ratings, two Google ratings, a 6.7× swing in tutor count.
- **Fix:** One exported constant (`resources/js/data/brandStats.js`), imported at each of the cited lines. **Remove the Google and Trustpilot marks entirely** unless verified public profiles show those exact scores — misattributing a score to a third-party platform is a direct ASCI and trademark problem.

### A8. Group Classes shows permanently frozen, invented batch counters — `S`
- **Wrong:** `resources/js/data/groupClasses.json:34` onward — "🔁 119 Batches done", "🟢 16 Ongoing" hardcoded across 19 cards, plus 57 per-level "👥 N students" values (first at line 51), rendered verbatim by `GroupClassesPage.jsx:38-40`. No table or process ever updates them, so "Ongoing" is fiction forever.
- **Fix:** Strip the batch/ongoing chips and the `students` fields; keep the honest chips (age range, duration, price).

### A9. The Terms promise 4 free classes; the landing page offers 2 — `S`
- **Wrong:** `resources/js/pages/ReferEarnPage.jsx:15` and the reward strip at lines 143-150 say 2 classes ("1-on-1 **OR** group — your choice"). `resources/js/data/legal.js:284` — the binding Terms, linked in the footer — says "2 free one-to-one Classes **and** 2 free group Classes … four free Classes in all".
- **Fix:** Decide the real reward and align one side. The Terms are the binding document and are the more generous of the two, so you are currently exposed to double the budgeted payout.

### A10. Your policy pages name no legal entity — `S`
- **Wrong:** `resources/js/data/legal.js:13` still carries `// TODO(owner): replace with the registered LLP / Pvt Ltd name once confirmed`, and line 14 sets `ENTITY = 'Indiatutors Online'` — a brand, not a legal person. That string is stamped into all 14 `__ENTITY__` slots across the four published policies, including the "binding agreement between you and __ENTITY__" clause (line 38) and all four registered-address blocks (lines 657, 937, 1159, 1715).
- **Fix:** Set line 14 to the registered LLP / Pvt Ltd name; delete the TODO. The substitution already propagates.
- **Why:** The Consumer Protection (E-Commerce) Rules 2020 require the legal name and principal address to be displayed. Today no user can tell who they are contracting with or whom to serve notice on.

### A11. "Popular Video Courses" sells a product that does not exist — `S`
- **Wrong:** `resources/js/pages/HomePage.jsx:387` renders a "Self-paced · Watch anytime" row fed by `homeLive.js:452-456`, in which two of three cards describe **live** 1:1 and group classes, all cards link to `/courses/{slug}` (live product, `HomePage.jsx:236`), and the first carries a "Most Popular" badge. "See all →" goes to /video-courses, which has no seeded content and falls through to "New video courses are coming soon" (`VideoCoursesPage.jsx:62`).
- **Fix:** Guard the section on a non-empty `fetchVideoCourses` result, or point cards at real `/video-courses/{slug}` records once they exist.

---

## SECTION B — Broken conversion paths
*Highest business value per hour of work outside the trust list. These are leads you are losing today.*

### B1. The pricing CTA is a 404 on your two highest-intent templates — `S`
- **Wrong:** `resources/js/pages/CourseDetailPage.jsx:367` and `resources/js/pages/CoursesPage.jsx:202` both link to `/plans-pricing`. That route does not exist — `App.jsx` defines `/plans` (line 47) and `/plans-and-pricing` (line 84) only — so the SPA renders NotFoundPage. The 301 at `routes/web.php:27` only fires on a hard server load; a client-side `<Link>` click never reaches the server.
- **Fix:** Change both to `to="/plans"`.
- **Impact:** The second-most-likely click after "Book a Free Demo" 404s. On CoursesPage the broken link is in a `lg:sticky` aside, so it follows the visitor down the entire catalogue.

### B2. The Refer & Earn page has no working CTA on any phone — `S`
- **Wrong:** `resources/js/pages/ReferEarnPage.jsx:138` positions the reward strip at `-bottom-16` against a hero with `pb-24` (line 115) — a 160px budget. Below `md` the grid collapses to one column and the card grows to 260-280px, so it expands *upward* over the hero. Measured at 767px: strip top 723.8 vs the CTA row spanning 713.8-759.8. Confirmed at 360, 375, 414, 600, 767px; clean at 768px. The strip is opaque `bg-white`, positioned (so it paints above the CTA anchors), and has no `pointer-events-none` — it hides **and swallows the clicks**.
- **Fix:** `relative md:absolute … md:-bottom-16` on line 138 and `pb-8 md:pb-24` on line 115, so on phones it flows after the hero instead of floating over it.

### B3. Silent form failures — three high-intent leads vanish with no feedback — `S`
- **Wrong:** `resources/js/components/Footer.jsx:98` renders success and pending states but never `subscribe.isError` — on failure the button just re-enables with the email still typed. Same at `resources/js/pages/PlansPage.jsx:48` for the pricing-PDF request. Every other form in the codebase surfaces its error (`ContactPage.jsx:54`, `BookDemoPage.jsx:136`, `ReferEarnPage.jsx:99`, `DownloadCurriculumPage.jsx:158`).
- **Fix:** Add one error line each, e.g. `{subscribe.isError && <p className="mt-2 text-xs text-red-400">Could not subscribe — please try again.</p>}` after `Footer.jsx:104` and alongside `PlansPage.jsx:54`.

### B4. The homepage's main CTA email goes to a different inbox than everywhere else — `S`
- **Wrong:** `resources/js/pages/HomePage.jsx:600` links `mailto:contact@indiatutorsonline.com`. `Header.jsx:146`, `Footer.jsx:90`, `ContactPage.jsx:68` and `CourseDetailPage.jsx:146` all use `connect@`. The phone number on the same line matches, so this is a typo, not a second inbox.
- **Fix:** Change the href and label on line 600 to `connect@` (or confirm the alias exists and align the other four).

### B5. Reading the Terms destroys a part-filled teacher application — `S`
- **Wrong:** `resources/js/pages/BecomeTeacherPage.jsx:184` uses raw `<a href="/terms-conditions">` and `<a href="/privacy-policy">` with no `target="_blank"`, forcing a full page load out of the SPA. The form holds name/phone/email, subject offerings, address, travel radius, availability grid and the selected CV `File` — with no localStorage persistence anywhere in the file. Back returns an empty form and the File cannot be restored at all.
- **Fix:** Convert to `<Link>`, or add `target="_blank" rel="noopener noreferrer"`.
- **Impact:** Tutor supply is the core input to the business, and this silently destroys applications at the last step, specifically punishing the applicants who read the terms.

### B6. Loudest buttons point at the wrong place — `S`
- **Wrong:** `resources/js/pages/GroupClassesPage.jsx:103` — the gold #D4AF37 hero button labelled "🚀 Book Now" goes to `/plans`, a price list; the actual conversion action "🎯 Book a Free Demo" is the weak outline button on line 104. Every other hero puts gold on the demo (`VideoCoursesPage.jsx:48`, `LandingPage.jsx:115`, `CoursesPage.jsx:155`). The card button at line 79 is a third "Book Now" → `/plans`, duplicating "See Plans & Pricing" at line 126. Separately, `CoursesPage.jsx:155-156` renders two side-by-side buttons with different labels ("🚀 Book Now" / "🎯 Book a Free Demo") pointing at the **same** `/book-demo`.
- **Fix:** Swap `GroupClassesPage.jsx:103/104` destinations; relabel line 79 to "See Plans & Pricing". At `CoursesPage.jsx:155`, repoint "🚀 Book Now" to `/plans`.

---

## SECTION C — Layout defects that hide the controls
*Mid effort, high impact — these break the site on the exact widths Indian parents browse on.*

### C1. The hamburger is off-screen between 1024px and ~1150px — `S`
- **Wrong:** `resources/js/components/Header.jsx:158` reveals the nav at `lg` but line 180 keeps the hamburger until `xl`. Measured at 1024px the three flex children total 1075px against 947.6px available — 127.5px overflow. The hamburger's right edge lands at 1105.7px vs a 1009px client width, and "Book Free Demo" is cut in half. Because the header carries `[overflow-x:clip]` (line 141) there is **no scrollbar to recover it** — `scrollWidth === clientWidth === 1009`. Clean by 1152px.
- **Fix:** Change line 158 from `hidden lg:flex` to `hidden xl:flex` — removes 556.8px and the row fits at every width.
- **Impact:** On iPad landscape and any half-snapped 2048px display, the category bar is also hidden (`xl:block`, line 186), so the hamburger is the *only* route to the whole catalog — Academics, Coding, Music, Dance, Languages all unreachable from the header.

### C2. Every sticky sidebar sits 34px under the sticky header at ≥1280px — `M`
- **Wrong:** The header is 93px below 1280px but 130px at 1280px+ (the category bar is `hidden xl:block`, `Header.jsx:186`). Every sticky aside pins at `lg:top-24` (96px): `CourseDetailPage.jsx:82`, `CoursesPage.jsx:165` (which also caps height assuming a 112px header), `AboutPage.jsx:109`, `CartPage.jsx:110`, `CheckoutPage.jsx:180`, `EventPage.jsx:156`, `LegalPage.jsx:134`, `VideoCourseDetailPage.jsx:119`, `GroupClassesPage.jsx:111` (40px occluded).
- **Fix:** Add `xl:top-[8.5rem]` alongside `lg:top-24` at each line, and `xl:max-h-[calc(100vh-9.5rem)]` at `CoursesPage.jsx:165`. Cleanest: publish header height as a CSS custom property and use `top-[var(--hdr)]`.
- **Impact:** On the majority of desktop traffic, the top of the course **buy card** (price/plan + Add to Cart) and the top of the catalogue sidebar (its search box) are permanently behind the header.

### C3. Course level labels overflow between 1024 and 1127px — `S`
- **Wrong:** `resources/js/pages/CoursesPage.jsx:86` uses `grid sm:grid-cols-3`, but the real width comes from two nested `lg:` column splits (lines 160 and 76). At 1024px each box has 72px of content width while "Intermediate" at `text-sm font-bold` renders 87px — the unbreakable word spills over its neighbour. Overflow at 1024px (15px) and 1080px (6px); clear by 1128px.
- **Fix:** `grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3` on line 86.

### C4. Footer jumps 2→5 columns at exactly 1024px — `S`
- **Wrong:** `resources/js/components/Footer.jsx:75`. At 1023px tracks are 280.8px; at 1024px they become 316.5 + 121.5 × 4. In 121.5px, "Learn & Discover" wraps to two lines and 6 of 8 sampled links wrap.
- **Fix:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]`.

### C5. The catalog mega-menu can never be opened on a touch device — `M`
- **Wrong:** `Header.jsx:90` and `:115` open on `group-hover` only, and both panels are `hidden xl:…`. On a 1366px iPad Pro landscape there is no hover, and tapping the tab navigates via the NavLink instead. Below 1280px the mobile menu at line 196 maps `CATALOG_NAV.slice(1)` to `{to, label}` only, **discarding each item's `.items` and `.mega`**. `resources/js/data/nav.js` holds destinations that appear nowhere else in the header — /board/cbse, /board/igcse, /courses/abacus, /courses/mathematics-grade-8, dozens more.
- **Fix:** Add per-tab `open` state toggled by an onClick on the chevron (keep `group-hover` for mouse), and render each item's `mega`/`items` children as an indented sub-list in the mobile menu at line 196.

---

## SECTION D — The lead forms are unusable with assistive tech
*Every field on every conversion form on this site lacks an accessible name. There is not a single `htmlFor` in the repo.*

### D1. Book-a-Demo (12 fields) and Contact (6 fields) have orphaned labels — `M`
- **Wrong:** `resources/js/pages/BookDemoPage.jsx:107` (and 99, 108, 111, 112, 115-124, 127-129, 131) and `resources/js/pages/ContactPage.jsx:47-53` all use the pattern `<div><label>Full name*</label><input required …/></div>` — no `htmlFor`, no `id`, no wrapping. Screen readers announce bare "edit text"; voice control ("click email") fails outright; clicking the label doesn't focus the field.
- **Fix:** Wrap each control in its own label, using the pattern that already works at `resources/js/pages/CheckoutPage.jsx:26-31`: `<label className="block"><span className="…">Full name*</span><input …/></label>`.
- **Impact:** The page that generates every lead, and the only general-enquiry channel, are both unusable for these visitors.

### D2. One shared component breaks every physical-tuition and teacher-application form — `S`
- **Wrong:** `resources/js/components/physical/FormBits.jsx:20-28` renders `Label` and `children` as **siblings**, and `Label` (lines 10-17) emits `<label>` with no `htmlFor`. Consumed by the public teacher application (`BecomeTeacherPage.jsx:103-180` — ~10 fields including CV and intro video) plus `AddressBlock.jsx`, `OfferingsEditor.jsx`, `RadiusPicker.jsx`, `RequirementForm.jsx`, `PhysicalProfileCard.jsx`.
- **Fix:** Make `Field` wrap instead of sibling — change the element at `FormBits.jsx:12` to a `<span>` and have `Field` render `<label>{label}{children}{error}</label>`. **One edit fixes every consumer.**

### D3. Find Tutors filter bar: six anonymous controls — `S`
- **Wrong:** `resources/js/pages/FindTutorsPage.jsx:104-122` — four selects and two inputs with no label, `aria-label` or `aria-labelledby`. The only cue is a visual `<span>Filter:</span>` on line 103.
- **Fix:** `aria-label="Subject"` (104), `"Board"` (108), `"Grade"` (112), `"Teaching mode"` (116), `"City"` (121), `"Tutor name or subject"` (122).

### D4. Header icon buttons unnamed; catalog dropdowns unreachable by keyboard — `S`
- **Wrong:** `Header.jsx:170` (search open), `:167` (search close), `:180` (mobile menu — also never exposes `aria-expanded` for the panel at line 193) are icon-only with no `aria-label`; the search input at line 166 has only a placeholder. The wishlist/cart at 172-173 *are* labelled, so the omission is accidental. Separately, lines 90 and 115 use `invisible opacity-0 group-hover:visible` — Tailwind's `invisible` is `visibility:hidden`, which removes descendants from the tab order, and there is no `focus-within` variant in the file.
- **Fix:** Add `aria-label` to 166/167/170 and `aria-label={open ? 'Close menu' : 'Open menu'}` + `aria-expanded={open}` at 180. Add `group-focus-within:visible group-focus-within:opacity-100` to lines 90 and 115.
- **Impact:** On mobile — the majority of Indian traffic — the only navigation control announces as an unnamed "button" with no state.

### D5. No skip link: ~40 header tab stops before content on every page — `S`
- **Wrong:** `resources/js/components/Layout.jsx:6` renders `<Header/><main><Outlet/></main>` with no skip link; no `sr-only` usage exists anywhere in `resources/js` or `resources/css/app.css`.
- **Fix:** Add `<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 …">Skip to content</a>` as the first child, and give `<main>` `id="main" tabIndex={-1}`.

### D6. Carousels auto-advance with no way to stop them (WCAG 2.2.2, Level A) — `S`
- **Wrong:** `HomePage.jsx:256-259` — `TestimonialSlider` sets a 6s interval on mount, never pauses on hover, focus or via any control; the prev/next buttons (281-282) nudge the rail without stopping the timer. `HomePage.jsx:56/79-80` — `HeroSlider` advances every 5s and pauses on mouse only, so a keyboard user tabbing the dots (88-91) watches it move under them.
- **Fix:** Add a `paused` flag to `TestimonialSlider` honoured in the interval, driven by `onMouseEnter/Leave` + `onFocus/Blur` on the rail (line 262); add `onFocus`/`onBlur` to `HeroSlider`'s container and a visible pause toggle beside the dots.

### D7. Contrast failures on the facts people buy on — `S`
- **Wrong:** `text-slate-400` on white is ~2.5:1 (AA needs 4.5:1) and carries real content: tutor city and "+N more subjects" at `TutorCard.jsx:27` and `:24`; review count, struck price and per-unit at `HomePage.jsx:123`, `:133`, `:135`; tutor experience at `:508`. Footer legal bar `text-xs text-slate-500` on `bg-slate-900` is ~3.8:1 at 12px — `Footer.jsx:150`, carrying the Terms / Payment & Refund / Refer & Earn / Privacy links (151-157).
- **Fix:** Step the slate-400 instances to `text-slate-500`; change `Footer.jsx:150` to `text-slate-400` and link hovers (153-156) to `hover:text-white`.

### D8. Accordion state and a dead button — `S`
- **Wrong:** `CoursesPage.jsx:54` — the accordion header button has no `aria-expanded`/`aria-controls` for the panel at line 75; every other accordion in the repo gets this right (`FaqsPage.jsx:13`, `GroupClassesPage.jsx:45`, `CourseDetailPage.jsx:489`, `:540`). `HomePage.jsx:115` renders `<button aria-label="Save to wishlist">` with **no onClick** — a tab stop on every card in both rails that silently does nothing, despite a working wishlist existing (`Header.jsx:137`).
- **Fix:** Add `aria-expanded={open}` at `CoursesPage.jsx:54`. Wire the heart to the existing wishlist store, or remove the element.

### D9. Footer link names are prefixed with spoken emoji — `S`
- **Wrong:** `Footer.jsx:13-35` — labels are strings like `'🏠 Home'`, `'👩‍🏫 Become a Teacher'`, rendered into the link text at line 56, so screen readers say "woman teacher Become a Teacher".
- **Fix:** Change tuples to `[emoji, label, href]` and render `<span aria-hidden="true">{emoji}</span> {label}`. Visual result unchanged.

---

## SECTION E — Page weight
*~6 MB of avoidable image download. Almost all of it is re-encoding files, not writing code.*

### E1. Re-encode five image sets — recovers ~5 MB — `M`
- **`public/images/courses/clarinet.png`** is 2,440,235 B at 1536×1152, used as a 248×185 card (`courseImages.js:26`, painted at `HomePage.jsx:112` and `CourseCard.jsx:21`). A correctly sized hero copy already exists at `public/images/courses/hero/clarinet.png` (446 KB). It is 60% of the 3.98 MB the "Musical Instruments" tab downloads. → Re-encode to ~520×390 WebP (~35 KB) and update the one string.
- **`public/images/teachers/home/*.png`** — eight 760×1024 PNGs totalling 2,583,585 B, rendered as 80×80 circles at `HomePage.jsx:504` (`homeLive.js:13`). 778,240 pixels downloaded to display 6,400. Used nowhere else. → 160×160 WebP, ~6 KB each, and change line 13 to `.webp`.
- **`public/images/news/*.png`** — three 768×403 **photographs stored as PNG**, 1,114,488 B, rendered into a 190px card on /courses and every course page (`courseDetail.js:229-231`, `SocialProofSections.jsx:193-194`). → WebP q80 at ~800px, ~50 KB each.
- **`carousel-3.webp`** is 3638px wide for a ~900px slot. → downscale to ~1800px.

### E2. Hero carousel force-loads 705 KB that mobile never displays — `S`
- **Wrong:** `HomePage.jsx:84` maps all slides with `loading="eager"` (carousel-1 415,526 B + carousel-2 52,624 B + carousel-3 253,854 B). The container at line 78 is `hidden lg:block` — and an eager `<img>` inside a `display:none` subtree is still fetched by Chrome, Firefox and Safari. Every mobile visitor pays 705 KB for zero rendered pixels.
- **Fix:** `loading={i === 0 ? 'eager' : 'lazy'}` — lazy images in a `display:none` subtree are not fetched. Optionally gate `<HeroSlider/>` behind `matchMedia('(min-width:1024px)')`.

### E3. Homepage course cards use CSS `background-image`, so 1–4 MB below the fold cannot lazy-load — `S`
- **Wrong:** `HomePage.jsx:112` — `style={{ backgroundImage: url('${c.img}') }}`. CSS backgrounds have no `loading="lazy"` equivalent and fetch as soon as the element is laid out. Measured per tab: Academics 1-8 = 1.03 MB, Academics 9-12 = 1.79 MB, Musical Instruments = 3.98 MB — and only ~4 cards are on screen in the scroll rail. Every sibling on the same page already uses `<img loading="lazy">` (`HomePage.jsx:225`, `:504`, `CourseCard.jsx:21`).
- **Fix:** Replace with `<img src={c.img} alt="" loading="lazy" className="h-full w-full object-cover …" />` inside the existing fixed-height Link, as `DemoCourseRow` does at line 225. Container has fixed height, so no CLS risk.

### E4. One 958 KB entry chunk for all 35 pages — `M`
- **Wrong:** `resources/js/App.jsx:3-37` statically imports every route, producing a 980,698 B (256 KB gzipped) entry chunk with only AdminConsole split out. The worst passenger is `resources/js/data/legal.js` at 155.4 KB of legal prose — ~16% of the raw bundle, needed by well under 1% of sessions — pulled in eagerly because `LegalPage.jsx` is a static import. The Blade shell ships an empty `<div id="root">`, so nothing renders until this parses.
- **Fix:** `const X = lazy(() => import('./pages/X.jsx'))` + one `<Suspense>` around `<Routes>`, using the pattern already proven at `AdminPage.jsx:8`. Start with LegalPage, DashboardPage, CheckoutPage, CartPage, AccountPage, MyCoursesPage, WishlistPage, LoginPage — well over 250 KB raw.

### E5. Every course page fetches all 110 courses to render 8 related cards — `S`
- **Wrong:** `CourseDetailPage.jsx:298` calls `fetchCourses({ per_page: 200 })` then filters client-side (327-332). ~55.9 KB vs ~6.3 KB for a 12-row page. `CourseController::index` already supports `?category=` including descendants (lines 13-24). Repeated at `CartPage.jsx:18` and `DownloadCurriculumPage.jsx:92`.
- **Fix:** `fetchCourses({ category: course.categories?.[0]?.slug, per_page: 12 })` gated on `enabled: !!course`; drop the client filter; keep the queryKey category-scoped.

---

## SECTION F — Discoverability
*You are spending on pages Google can't index and telling it to ignore the ones it can.*

### F1. Every unknown URL returns HTTP 200 + `index, follow` (soft 404) — `M`
- **Wrong:** `routes/web.php:107` returns `view('app', …)` with a 200 for any path. When `SeoMeta` can't resolve, it returns `[]` (`app/Support/SeoMeta.php:129, 144, 158, 185, 218, 234`), so `array_merge` fills in the sitewide defaults from lines 22-26 — **including `'robots' => 'index, follow'`**. `/courses/deleted-slug`, `/tutor/gone`, `/blog/typo` all serve the homepage title + description + index,follow. `/tutors-in/{city}` is unbounded, so this is an infinite set of indexable near-duplicates.
- **Fix:** Have `SeoMeta::for` return `'robots' => 'noindex, nofollow'` plus a `notFound` flag when `resolve()` yields `[]`, and in `routes/web.php` return `response(view('app', […]), $meta['notFound'] ? 404 : 200)`.
- **Impact:** Crawl budget burned on dead URLs, Google's soft-404 detection suppresses rankings sitewide, and broken inbound links look healthy to monitoring because they answer 200.

### F2. Category pages canonicalize themselves away to /courses — `S`
- **Wrong:** `app/Support/SeoMeta.php:29` — `['canonical' => $canonical]` is the **last** argument to `array_merge`, so it always wins, and `$canonical` (line 18) is built from `$request->path()`, which drops the query string. The category branch (98-107) writes a unique title and description for `/courses?category=music`, then the page emits `<link rel="canonical" href="…/courses">` (`app.blade.php:21`, `:28`). Meanwhile `SitemapController.php:51` submits every category URL and `routes/web.php:87` 301s every legacy WordPress `/product-category/*` onto them.
- **Fix:** Preserve the whitelisted param after line 18 (`if ($path === 'courses' && $c = $request->query('category')) $canonical .= '?category='.$c;`), or move the canonical into the defaults array so a page-level value can win.
- **Impact:** All the link equity from your existing WooCommerce SEO footprint funnels into one page and every category ranking is lost.

### F3. sitemap.xml omits ~15 page families that already have hand-written meta — `S`
- **Wrong:** `app/Http/Controllers/SitemapController.php:21-25` lists 14 URLs. Absent: /physical-classes, /group-classes, /free-classes, /video-courses(+detail), /events-workshops(+detail), /competitive-exams, /skill-programmes, /faqs, /download-curriculum, the five /board/* pages, and every /subject/* archive — all of which already have titles and descriptions at `SeoMeta.php:53, 76-81, 89-90, 167-182, 198-214`.
- **Fix:** Add the paths to the static array and loops for `VideoCourse::published()`, `Event::published()`, the five board slugs and distinct subject slugs, mirroring the existing `$add()` calls.
- **Impact:** /physical-classes is the entire home-tuition business line and /board/cbse etc. are the highest-intent Indian search terms on the site. The metadata work is done; it just isn't advertised.

### F4. No og:image on the homepage or any static/board/city/subject page — `S`
- **Wrong:** `SeoMeta.php:25` sets `'image' => null` and none of the ~40 static entries (49-94) or the board/subject/city branches (167-244) supply one; `app.blade.php` only emits og:image/twitter:image when non-empty (29, 35) and downgrades twitter:card to `summary` (32).
- **Fix:** Add `'image' => $base.'/images/og-default.jpg'` to the defaults and drop a 1200×630 branded image at `public/images/og-default.jpg`.
- **Impact:** WhatsApp is the dominant tutoring referral channel in India, and every share of the homepage or a city/board page renders as a bare grey text link.

### F5. Every /subject/{slug} page has the h1 "Find Tutors" — `S`
- **Wrong:** `SubjectPage.jsx:24` passes `subjectOverride`, but `FindTutorsPage.jsx` uses it only to preset the filter (line 50) — the heading at line 90 is the literal `Find Tutors`. Meanwhile `SeoMeta.php:211` promises each page a unique title ("Piano — Indiatutors Online").
- **Fix:** `<h1>{subjectOverride ? `${subjectOverride} Tutors` : 'Find Tutors'}</h1>` at line 90; same for the subheading on 91.

### F6. /faqs: 18 Q&As, 17 answers absent from the DOM, no FAQPage schema — `M`
- **Wrong:** `FaqsPage.jsx:20` conditionally mounts the answer (`{open && <div>{a}</div>}`), so only the open one exists in the HTML. `SeoMeta.php:89` supplies title and description but no `jsonld` key.
- **Fix:** Render the answer always and hide with `className={open ? '' : 'hidden'}`; add a `'jsonld'` FAQPage entry at `SeoMeta.php:89` mirroring the `FAQS` data.
- **Impact:** Forfeits FAQ rich snippets and ranking credit for high-intent questions ("do you offer a free demo", "how do refunds work").

### F7. /blog republishes every post in full, links to none of them — `M`
- **Wrong:** `BlogPage.jsx:16` maps posts straight to `<PostBody html={p.body} />` — 12 full bodies, no titles, no `<Link>` to `/blog/{slug}`, no `<h1>` in the file. Posts are reachable only via sitemap.xml. `SeoMeta.php:66` also gives /blog a 98-char title that repeats the brand twice.
- **Fix:** Render cards with `<h2><Link to={`/blog/${p.slug}`}>{p.title}</Link></h2>` + excerpt; add an `<h1>`; shorten the title to `'Blog — ' . self::SITE`.

### F8. GA4 records zero page views for in-app navigation — `M`
- **Wrong:** No `document.title` assignment, Helmet, or title hook exists anywhere in `resources/js`; all meta comes from the server render (`app.blade.php:18-19`). `app.blade.php:10-11` fires `gtag('config')` once on load and nothing on route change, so every SPA navigation is invisible to analytics. Crawlers are unaffected (they request each URL fresh), but tab titles and bookmarks are wrong from the second page onward.
- **Fix:** One effect in `App.jsx`/`Layout.jsx` on location change that sets `document.title` from a route→title map and fires `gtag('event','page_view',{page_path})`.

### F9. Two indexable URLs per tutor profile — `S`
- **Wrong:** `App.jsx:59` and `:64` both route `/tutor/:slug` and `/tutors/:slug` to TutorProfilePage, and `SeoMeta.php:142` accepts both, emitting identical meta and Person JSON-LD that each self-canonicalize (line 29). The signals contradict on one page: `SitemapController.php:41` and all internal links (`TutorCard.jsx:8`, `FindTutorsPage.jsx:39`) use `/tutors/`, but the BreadcrumbList at `SeoMeta.php:153` names `/tutor/`.
- **Fix:** Standardise on `/tutors/`: return an explicit canonical in the tutor branch (needs F2's fix first), change line 153's breadcrumb, and add `Route::get('/tutor/{slug}', fn ($s) => redirect('/tutors/'.$s, 301));` ahead of the catch-all.
- **Impact:** Every tutor's page competes with a duplicate of itself for the highest-intent query a tutor marketplace can win — the tutor's own name.

### F10. Dead robots.txt route shadowed by a static file — `S`
- **Wrong:** `public/.htaccess:34` serves existing files directly, so `public/robots.txt` always wins and the route at `routes/web.php:10` never runs. The static file hardcodes `Sitemap: https://indiatutorsonline.com/sitemap.xml`; the unreachable `SitemapController::robots` (66-70) would derive it from `config('app.url')`.
- **Fix:** Delete one of the two. On any non-production host the current file points crawlers at another domain's sitemap.

---

## ⚡ Quick wins — under 15 minutes each

**Status as of 2026-08-11.** 19 of the 22 are shipped and live, plus one found
during the responsive sweep (item 23 / C6). **Every code-only quick win is done**,
and the entity name (item 6 / A10) was answered by the owner and shipped. The 3
that remain all need an owner decision on content, not engineering.

## ✅ Overseas claims removed from the policies (2026-08-11)

Owner instruction: remove the service claims, keep the data-protection provisions.
Scoped by a 7-agent inventory of all four documents plus a check of what the app
actually charges.

**Removed — things we said we sell or show but do not:** three printed dollar
figures (the Registration Fee was defined as "₹750 (₹750 INR / $10 USD)" in the
Terms definitions and body, and "approximately $10" in the refund policy); five
statements that a USD price is displayed (Terms pricing, refund fee-quoting, the
indicative-conversion sentence, the referral-reward parity sentence, and the
Privacy opener); "serves students across India **and abroad**" in both the Terms'
binding clause and the Privacy opener; "Families living abroad … do enrol with us
regularly"; "You may take part from outside India"; and the pointer to "overseas
bank and currency-conversion charges".

**Kept — provisions that protect the reader, per the owner's instruction:** all
GDPR / UK GDPR rights and legal bases, the EEA/UK rights list and supervisory-
authority route, Art. 8 children's thresholds, Art. 33 breach notification, and
International Data Transfers. The EU/UK cooling-off notice was also kept, though
it is consumer-contract rather than data protection: removing the *notice* does
not remove the *obligation*, and under Art. 10 / reg. 31 failing to give notice
extends the withdrawal window to twelve months — so deleting it would have made
the position worse, not cleaner.

**Renamed rather than deleted, and this mattered.** "Overseas & NRI Families"
(Terms) → "Users Resident in the EU or the UK"; "Overseas & NRI Students"
(Privacy) → "Data Protection Outside India"; "Overseas Students & the EU / UK
Cooling-Off Right" (Refund) → "The EU / UK Cooling-Off Right". Section `id`s were
left untouched so no anchor or bookmark breaks. Four cross-references quote those
headings verbatim in bold (Terms §Data Protection, Privacy opener, Privacy
children's clause, Privacy grievance clause) and were updated in the same commit.

⚠ **Deleting the refund section wholesale would have destroyed an India-only
protection.** "Nothing in this policy limits a student's or parent's rights under
the **Consumer Protection Act, 2019**" sits nested *inside* the overseas cooling-off
section. A wholesale delete would have stripped an Indian customer of a protection
during an India-only cleanup. Verified still rendered after the edit.

⚠ **STILL OPEN — the checkout contradicts the policies.** `CheckoutPage.jsx:142-145`
renders a **required** "Country / Region" select offering United States, United
Kingdom, Canada, Australia, United Arab Emirates, Singapore and Other; it is
validated at `OrderController.php:27` and persisted at `:60`. The India-only sweep
never reached it. The policies now say we serve students across India while the
page a customer actually transacts on invites a UAE billing address. Needs an owner
decision: pin checkout to India like the Plans page, or treat a foreign *billing*
address as a genuine exception (an NRI parent paying for a child studying in India
is plausible, which is why this was not changed unilaterally). This also governs
whether Privacy's "city, state and country" collection notice stays accurate.

ℹ **Dead USD code left in place, not blocking:** `pricing.js` `regFee.USD: 10`, 19
orphaned USD country entries, and the USD branches in `PlansPage.jsx` are all
unreachable while `country` is pinned to India — but `curOf()` reads
`PRICING.countries`, so restoring any country input would silently re-enable USD
quoting. Worth a separate cleanup.

---

⚠ **Superseded — the original finding, kept for history.**
The marketing site was swept India-only (commits f386b5b, 3cb66ec: "the overseas
claims the owner says are not true"), but `legal.js` was not part of that sweep and
still contains, as *binding* terms: an indicative USD price shown at checkout
(line 211) and a "$10" registration-fee equivalent (line 730); a statutory EU/UK
cooling-off right (`overseas-cooling-off`, line 845); GDPR and UK GDPR rights
(line 396); "Overseas & NRI Families" and "Overseas & NRI Students" clauses (lines
272, 1415); International Data Transfers with Standard Contractual Clauses (line
1471); and "serves students across India and abroad" in both the Terms' binding
clause (line 40) and the Privacy Policy opener (line 1178). If overseas service is
not real, these are promises in the most binding documents on the site — and the
USD-at-checkout clause describes a checkout that no longer exists. Needs an owner
decision plus counsel; do not quietly delete GDPR text, since it may be relied on
by anyone who already enrolled under it.

| # | Change | File:line | Status |
|---|---|---|---|
| 1 | Gate the "✓ Verified Tutor" badge on `tutor.verified` | `resources/js/pages/TutorProfilePage.jsx:121` | ✅ shipped |
| 2 | `/plans-pricing` → `/plans` (two links) | `CourseDetailPage.jsx:367`, `CoursesPage.jsx:202` | ✅ shipped |
| 3 | `contact@` → `connect@` in the homepage CTA | `HomePage.jsx:600` | ✅ shipped |
| 4 | Delete the hardcoded `4.8` star on every About course card | `AboutPage.jsx:142` | ⏸ owner decision (A5) |
| 5 | Replace "4.9 / 5 from 1,200+ reviews" with a non-numeric trust point | `resources/js/data/courseDetail.js:137` | ⏸ owner decision (A5) |
| 6 | Set `ENTITY` to the registered LLP / Pvt Ltd name, drop the TODO | `resources/js/data/legal.js:13-14` | ✅ shipped — "Indiatutors Online LLP" |
| 7 | Empty the four placeholder testimonial arrays + `ACHIEVEMENT_PHOTOS` | `courseDetail.js:62, 143, 152, 196, 236` | ⏸ owner decision (A3/A4) |
| 8 | `hidden lg:flex` → `hidden xl:flex` (recovers the off-screen hamburger) | `Header.jsx:158` | ✅ shipped |
| 9 | Add `group-focus-within:visible group-focus-within:opacity-100` to both dropdowns | `Header.jsx:90, 115` | ✅ shipped |
| 10 | Add `aria-label` to the three icon buttons + search input, `aria-expanded` on the burger | `Header.jsx:166, 167, 170, 180` | ✅ shipped |
| 11 | Add `aria-label` to the six filter controls | `FindTutorsPage.jsx:104-122` | ✅ shipped |
| 12 | Add `aria-expanded={open}` + `aria-controls` to the courses accordion | `CoursesPage.jsx:54` | ✅ shipped |
| 13 | `text-slate-500` on the footer bottom bar, `hover:text-white` on the policy links | `Footer.jsx:150-156` | ✅ shipped |
| 14 | `text-slate-400` → `text-slate-500` on content text | `TutorCard.jsx:24, 27`; `HomePage.jsx:118, 128, 130, 227, 498` | ✅ shipped |
| 15 | Add the `lg:grid-cols-3` step to the footer grid | `Footer.jsx:75` | ✅ shipped |
| 16 | Add the two missing `isError` messages | `Footer.jsx:98`, `PlansPage.jsx:48` | ✅ shipped (PlansPage was already done) |
| 17 | `target="_blank" rel="noopener noreferrer"` on the two policy links | `BecomeTeacherPage.jsx:187` | ✅ shipped |
| 18 | `loading={i === 0 ? 'eager' : 'lazy'}` on hero slides (−705 KB on mobile) | `HomePage.jsx:84` | ✅ shipped |
| 19 | Swap the Group Classes hero CTA destinations; repoint the duplicate "Book Now" | `GroupClassesPage.jsx:103-104, 79`; `CoursesPage.jsx:155` | ✅ shipped |
| 20 | Add the skip link + `id="main"` | `Layout.jsx:34` | ✅ shipped |
| 21 | Add `onFocus`/`onBlur` pause to the hero slider | `HomePage.jsx:79-80` | ✅ shipped |
| 22 | Fix the level-box grid breakpoint | `CoursesPage.jsx:86` | ✅ shipped |
| 23 | `[&>*]:min-w-0` on the catalogue layout grid — see C6 below | `CoursesPage.jsx:160` | ✅ shipped |

**Nothing code-only is left in this table.**

**Blocked on you:** 4, 5, 7 — all content, not code. (6, the entity name, was
answered on 11 August 2026 and is shipped.)

**D6 — `TestimonialSlider` now has a real pause mechanism (2026-08-11).** It keeps
two separate flags: `stopped` (the explicit, sticky user control) and `hovering`
(the transient courtesy pause). One shared flag would have resumed the carousel
the instant the pointer left the Pause button the visitor had just pressed. A
visible Pause/Play toggle sits between the prev/next buttons with `aria-pressed`,
because 2.2.2 asks for a *mechanism*, not merely pause-on-hover. Prev/next now
bump a nonce in the effect deps so the interval restarts — previously the timer
could fire a fraction of a second after the visitor picked a slide themselves.

Verified by spying on `setInterval`/`clearInterval` rather than by waiting, since
hidden-tab timer throttling makes elapsed-time tests unreliable: Pause → clear 1 /
set 0; Play → set 1; hover in → clear 1; leave hover and focus → set 1; Next →
clear 1 / set 1.

**D6 is fully closed (2026-08-11).** `HeroSlider` now carries the same two-flag
model and its own Pause/Play toggle, added to the existing dot row at the owner's
request. `items-center` on that row keeps the 20px control aligned with the 2px
dots (measured: button centre 722px, dot centre 722px). Choosing a dot bumps the
nonce too, so the visitor gets a full 5s on the slide they picked.

Verified the same way: Pause → clear 1 / set 0, label flips to "Play slideshow",
`aria-pressed="true"`; Play → set 1; dot click → clear 1 / set 1. Sweep clean
360–2560px. Both carousels on the site now satisfy 2.2.2 with a real mechanism
rather than hover alone.

---

### C6. `/courses` could not render below 511px — every phone scrolled sideways — `S` ✅ shipped
- **Found by** the 360–2560px sweep over the quick-win changes, not by the original audit pass.
- **Wrong:** `CoursesPage.jsx:160` — grid items default to `min-width:auto`, so neither child of `grid lg:grid-cols-[260px_1fr]` could shrink below its content's min-content width. Below `lg` that is a single shared column, which bottomed out at 511px. Measured at a 360px viewport: `document.documentElement.scrollWidth` = 511, i.e. ~150px of horizontal scroll on the catalogue page for every phone (360–414px).
- **Fix:** `[&>*]:min-w-0` on the grid. Measured after: scrollWidth 360 at a 360px viewport, an exact fit.
- **Confirmed pre-existing**, not introduced by item 22: with the accordion closed, and again with item 22's old classes swapped back in at runtime, the overflow was an identical 511px.