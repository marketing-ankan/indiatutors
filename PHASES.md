# IndiaTutors Online — Build Roadmap

Rebuild of the WordPress site (winquestonline / indiatutorsonline.com) as a Laravel 11 API + React SPA, then extend it into a full two-sided tutoring marketplace.

**Two objectives:**
1. **Parity** — match every feature of the existing WordPress site.
2. **Improve** — build the marketplace platform from the founder's product vision (teacher/parent/student portals, KYC, demo→enrollment, in-app payments, progress tracking, admin dashboard, mobile).

**Decisions locked (2026-07-08):**
- Sequence: **website parity first**, then the platform.
- Commerce: **both** — self-paced/video courses bought directly (cart/checkout); live 1:1 & group tutoring via demo-first flow.
- Mobile: **PWA / responsive web first**; native (React Native) deferred to a later phase.

Legend: ✅ done · 🔜 next · ⬜ planned

---

## Phase 1 — Foundation & marketing site ✅
- ✅ Laravel 11 API + React (Vite/Tailwind) SPA, served same-origin (`/api`)
- ✅ Course catalog browse, tutor directory browse (read-only)
- ✅ Book-a-Demo + Contact lead forms
- ✅ Marketing home + static About/Plans/Refer pages
- ✅ GitHub `dev`/`main`, Hostinger deploy + cron auto-deploy pipeline
- ✅ Live: https://deepskyblue-quetzal-247991.hostingersite.com (134 courses, 13 tutors)

---

## Phase 2 — Full website parity ✅ (2026-07-14; only the 301 map remains, deferred to real-domain go-live)

**Catalog**
- ✅ Migrate courses from the WP XML (134 published, real `wp:post_name` slugs, subtitle, age, pills, curriculum, prices, category hierarchy, images) → `database/seeders/data/courses.json`
- ✅ Hierarchical category taxonomy (parent/child) from the export (112 categories)
- ✅ Category landing pages (category context header + breadcrumb on `/courses?category=`)
- ✅ Course listing filters: price range (buckets) + category + search + sort + pagination. *(grade/board are learner attributes captured at demo booking, not course fields; delivery-mode filter deferred to commerce — data is ~all Live 1:1)*
- ✅ Course detail: age, curriculum (level/topic), pills, subtitle, CTA — *(pricing tiers 1:1-vs-group deferred; source data is mostly single-price)*

**Tutors & local SEO**
- ✅ Full tutor profiles (qualification, subjects, city/localities, hourly+trial fee, languages, verified, experience) — 13 seeded
- ✅ Tutor directory filters (subject, city, mode) + sort
- ✅ City pages — `/tutors-in/{city}` local-SEO landing (tutors + subjects + localities), derived from tutor data; scales to any city. Discoverable from Find Tutors.

**Content & pages**
- ✅ Landing pages: Group Classes (full live accordion template), Free Classes, Video Courses, Events & Workshops, Competitive Exams, Skill Programmes — all rebuilt 1:1 from the live templates (2026-07-13/14)
- ✅ Blog: list (`/blog`) + post detail (`/blog/{slug}`) — 3 original articles seeded, Article JSON-LD, in sitemap
- ✅ Legal: Privacy Policy, Terms of Service, Refund & Cancellation
- ✅ Refer & Earn, Plans & Pricing, About, Contact (render + verified)

**SEO / technical**
- ✅ Per-route server-rendered meta/title + Open Graph + Twitter (via `SeoMeta`), dynamic `sitemap.xml` (272 URLs) + `robots.txt`
- ✅ Structured data / JSON-LD (Organization + WebSite, Course + Offer, Person, EducationalOrganization, BreadcrumbList)
- ✅ 301 redirects from old WordPress URLs (server-side map for every WP-only URL, 2026-07-15 — see Phase 10)
- ✅ GA4 analytics (env-driven: set `GOOGLE_ANALYTICS_ID` in server .env to activate). Performance verified (no N+1).

---

## Phase 3 — Accounts, roles & KYC ✅ (2026-07-09)
- ✅ Auth via **Sanctum bearer tokens** (register/login/logout/me), rate-limited; roles parent/student/teacher/admin
- ✅ Parent → many **students** (owner-scoped CRUD); teacher self-register creates a teacher_profile shell
- ✅ **KYC uploads** (Aadhaar/PAN/photo/certificate) to **private** storage, mime/size validated, path never exposed
- ✅ **Dashboard** (`/dashboard`, protected): profile, students management, KYC upload/list; auth-aware header; real Login/Register
- ⬜ Deferred: email/OTP verification; an admin login UI (admin user created manually via tinker/seeder for now)

## Phase 4 — Demo → enrollment engine ✅ (2026-07-09)
- ✅ **Requirement capture linked to accounts**: signed-in parents book demos tied to account + chosen student (ownership-checked); guests still work; book-demo prefills contact/student
- ✅ **Teacher matching**: admin gets tutors matched by subject/city per demo
- ✅ **Assign + schedule** (assigned_tutor_id, status, scheduled_at) via a role-gated **Staff Console** (`/admin`)
- ✅ **Conversion → enrollment** (student + tutor + course + plan); parent sees **"My demo requests"** + **"My enrollments"** on the dashboard
- Admin user is env-gated (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) — no default-password admin
- Deferred to later: call/confirm telephony, pincode-level matching, richer scheduling calendar

## Phase 5 — Teacher portal ✅ (complete 2026-07-13)
- ✅ **Teacher onboarding & profile** (v1): headline, qualification, subjects, languages, experience, fee, city, teaching mode, **service areas (pincodes)**, **availability (days + slots)**, bio — self-editable on the dashboard (KYC already from Phase 3)
- ✅ **Admin approval** (v1): Staff Console "Teacher Applications" tab — approve / reject (status pending→approved→rejected)
- ✅ **Approval → directory tutor link** (v2): approving a teacher auto-creates (idempotent) a listed `Tutor` record linked to their account, so demos can be assigned to them and their enrollments flow into the portal — bridges the Phase-4 enrollment engine to the teacher account
- ✅ **Teacher classroom** (v2): "My students" roster (assigned enrollments — demo/enrolled/ongoing), **upcoming assigned demos** (no parent PII), and a per-enrollment **class log / progress tracker** (topic, date, duration, homework, notes, status) — self-serve on the dashboard, ownership-scoped
- ✅ **Course proposals** (v3): teacher proposes a new subject → Staff Console "Course Proposals" tab → approval appends it to their directory subjects
- ✅ **Curriculum define/divide/edit** (v3): per-enrollment ordered topics with status (pending → in progress → done) — the classwise progress tracker parents see
- ✅ **Materials** (v3): notes / PPT / lesson plans / question bank / homework — private file upload (10 MB, KYC-style storage) or external link, per enrollment
- ✅ **Class calendar** (v4, 2026-07-13): month grid on the teacher dashboard — logged/scheduled/missed classes + assigned demos, colour-coded, with an upcoming list and month navigation

## Phase 6 — Student/Parent portal ✅ (complete 2026-07-13)
- ✅ **Enrollment detail view**: parent expands any enrollment → assigned **teacher details** (photo, qualification, subjects, experience), **curriculum progress** (n/m done), **class history**, and **materials** (download files / open links) — ownership-checked, admin & assigned teacher may also download
- ✅ **Reschedule requests** (shipped with Phase 8 v1)
- ✅ **Class schedules**: "Upcoming classes" card on the parent dashboard (scheduled classes across all enrollments, with teacher/course)
- ✅ **Portfolio building**: per-student achievements/certificates/milestones/artwork — parent and assigned teacher can add (files stored privately, links supported); teacher-added entries notify the parent
- ✅ **Exam updates**: Staff Console "Exam Updates" tab (publish/draft/delete) → feed card on the parent dashboard

## Video courses as gated playlists (point #4, 2026-07-16)
- ✅ **Self-paced video courses** at /video-courses + /video-courses/{slug}: playlist with a gated player. Free-preview lessons play for everyone; paid lessons are locked until purchase.
- ✅ **Purchase → entitlement**: buying a video course (requires login) creates an order tied to user_id; on paid (Razorpay or admin mark-paid) a video_entitlement is granted → all lessons unlock. Reuses the cart/checkout/Razorpay flow (cart items carry kind=course|video).
- ✅ **Bunny.net Stream adapter** (config-driven, AppSupportBunnyStream): signs short-lived embed URLs — token=SHA256(key+videoId+expires) — when BUNNY_STREAM_* are set; without keys only preview/YouTube lessons play. Lessons store provider (bunny|youtube) + video_id.
- ✅ **Staff Console “Video Courses” tab**: course CRUD + per-course lessons manager (add/reorder-by-position/preview-toggle/delete). **/my/video-courses** endpoint for the buyer’s library.
- ✅ **Cloudflare R2 adapter** (config-driven, AppSupportR2Video) — **the default host, 2026-07-31**. Presigns S3 SigV4 GET URLs (4h TTL) against a private bucket; signer written by hand so the AWS SDK stays out of the committed vendor/. Verified against AWS's documented SigV4 test vector. Lessons store provider (r2|bunny|youtube) + video_id (for r2, the object key).
  - **Why R2 over a metered free tier**: the buy rail promises “Lifetime access” + “Rewatch as often as you like” — an unmetered promise. R2 never bills egress, so unlimited rewatching by unbounded lifetime buyers stays free; only stored bytes bill (10 GB free, ~$0.015/GB/mo after). Cloudinary/ImageKit free tiers (~20–25 GB/mo delivery ≈ 3–4 students/mo on a 4 GB course) get *tighter* as lifetime buyers accumulate, so they cannot back the promise.
  - API returns `playback_kind` (`video` for r2's bare MP4, `iframe` for Bunny/YouTube); the player branches on it.
- ✅ **Player controls** (LessonPlayer, R2 lessons only): 0.25×–2× speed persisted in localStorage, ±10s skip, scrub, keyboard shortcuts. iframe providers keep their own chrome — we can't reach into them.
- ✅ **Study assistant** (AppSupportCourseAi): auto-loading lesson summary + grounded Q&A, answering **only** from a staff-entered transcript and saying so when a topic isn't covered — a children's tutoring product can't afford a confident wrong answer. No transcript ⇒ no assistant on that lesson. Summaries cache in `ai_summary` (one API call per lesson lifetime, not per viewer). Gemini default (free tier); provider swaps via one branch in `CourseAi::complete()`.
- ✅ **Upload from Staff Console** (2026-07-31): pick a file → presigned PUT (2h TTL) → browser uploads **direct to R2**, key + duration auto-filled. Bytes never touch the app server: Hostinger's `upload_max_filesize` would reject a 300 MB POST, and proxying would undo R2's free egress. Server builds the key (`{course-slug}/{clean-name}-{random}.mp4`) rather than trusting the filename — traversal is stripped, and the random suffix stops a re-upload silently overwriting a selling lesson.
  - **Upload needs the R2 token to have Object Read *and Write*** (read-only suffices for playback but 403s a PUT), **and a bucket CORS rule allowing PUT from the site's origin**.
- ⬜ Left: create the Cloudflare R2 bucket + set R2_ACCOUNT_ID/BUCKET/ACCESS_KEY_ID/SECRET_ACCESS_KEY (then paid playback goes live); replace the exposed Gemini key with one on a project that has free-tier *text* quota (the current key's project is image-gen only and returns 429 RESOURCE_EXHAUSTED); upload real lesson videos. Bunny stays wired as the paid upgrade path (adaptive bitrate) if buffering complaints appear.
- 🔜 Next: **dashboard “My Courses” page** — `/my/video-courses` exists but nothing in the front end calls it, so a buyer has no library to reach their purchases from; plus a Staff Console **Users** tab (promote/demote/reset password) so admins stop being created by hand via tinker.

## Physical Classes module (note #5, 2026-07-16)
- ✅ **Tutor location/grade data**: tutors carry service pincodes (CSV) + grades taught (Pre-primary–Class 12); seeded for all 13 demo tutors (pincodes derived from localities; Kolkata tutors home-capable); teacher approval now mirrors service_areas → pincodes and defaults full grades
- ✅ **/physical-classes**: location-first Home Tuition search — pincode + subject + class → home-capable tutors serving that pincode (LIKE match), “Serves your pincode” badge, and a subject/grade fallback with a tell-us-your-area banner when no tutor lists the pincode; nav “Physical Classes” now points here
- ✅ **API**: /api/tutors gains home=1, grade=, pincode= filters; TutorResource exposes pincodes/grades/teaches_home; book-demo prefills the physical-tutor flow from ?pincode= (and ?board=)
- ⬜ Later (needs your input/ops): Google-location + map view (config-driven add-on, needs a Maps key), the full coordination workflow (visit assignment/confirmation/check-in — Phase 8 territory)

## Phase 7 — Payments & payouts 🔨 (v1 done 2026-07-14; live capture blocked on Razorpay keys + GST details)
- ✅ **Cart → checkout → order**: WooCommerce-parity /cart, /checkout, /wishlist; guest orders re-priced server-side, recorded as `pending` with items (POST /api/orders)
- ✅ **Razorpay integration (config-driven)**: set `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` and checkout creates a gateway order + opens the Razorpay modal; `POST /api/orders/verify` checks the HMAC signature and marks the order `paid`. Without keys the pending-payment stub flow runs unchanged.
- ✅ **Staff Console “Orders” tab**: list/filter orders, mark paid / cancel / reopen (manual settlement until keys land)
- ⬜ Live payment capture (needs Razorpay keys), GST invoice, webhooks for out-of-band capture
- ⬜ **Demo-first** (live): fees + GST at enrollment, per-class billing
- ⬜ Teacher payouts: net of TDS, fixed margin, retention/conversion bonuses; refunds & receipts

## Phase 8 — Scheduling, messaging & location 🔨 (v1 done 2026-07-10)
- ✅ **In-app notifications**: header bell + unread badge; raised on teacher approval, proposal decision, demo scheduled, enrollment confirmed, material shared, reschedule requested/decided; mark read / mark all read
- ✅ **Reschedule requests**: parent requests (date + reason) from the enrollment detail → teacher notified → accepts/declines from the dashboard → parent notified
- ⬜ WhatsApp/email linkages (needs provider credentials), reminders
- ⬜ Home-tuition location tracking / teacher check-in; issue/emergency reporting

## Phase 9 — Admin dashboard & analytics 🔨 (v1 done 2026-07-10)
- ✅ **Staff Console "Analytics" tab**: headline tiles (parents, teachers ± status, students, listed tutors, demos ± status, active enrollments, classes logged, pending proposals/reschedules), 6-month trends (demos / enrollments / signups), breakdowns by city & subject
- ⬜ Revenue & teacher-payment analytics (after Phase 7); state/grade dimensions when captured

## Phase 10 — PWA, hardening & go-live 🔨 (UI + redirects ready 2026-07-15)
- ✅ **PWA**: manifest (192/512 + maskable icons from the site logo), service worker (offline shell, cache-first hashed assets, network-first pages, API never cached), registered in production builds — installable from the browser
- ✅ **301 redirect map**: every WP-only URL redirects server-side (shop→courses, product/*→courses/*, product-category/*→category archive, legal renames, my-account→login, hello-world, tutors/kolkata, WP defaults) — live now, ready for cutover
- ⬜ Cutover checklist: buy domain → update `APP_URL` + `SANCTUM_STATEFUL_DOMAINS` → **copy the WP `wp-content/uploads` folder to the new server** (course/tutor images currently hotlink indiatutorsonline.com/wp-content/uploads/… and will break when WP is retired) → re-verify → submit sitemap to Search Console
- ⬜ Push notifications (needs a push provider / VAPID setup)
- ⬜ Final security/compliance pass, monitoring
- *(Native React Native app — separate later track if needed)*

---

## WinQuest feature adoption (sister site winquestonline.com; audited 2026-07-15)
User triage of the gap report: instruments store, SAT/Vedic calculators and CA/DEIB policies = NOT required; geo pages = later, India-city-specific; approved trio built 2026-07-15:
- ✅ **/faqs** — site-wide FAQ page (the 18 real FAQs, accordion + demo CTA); footer FAQ link now points here
- ✅ **/download-curriculum** — lead-gen gated curriculum download (course picker → lead into contact_messages → full curriculum unlocks on-page with Print/Save-as-PDF); product-page “Download Full Curriculum” links here prefilled
- ✅ **Events system** — events table (initial 3 events seeded in the migration), public /events/{slug} detail pages (countdown, details grid, Google-Calendar link, registration → contact_messages), “Scheduled Events” section on /events-workshops, Staff Console “Events” tab (create/edit/publish/complete/delete), Event JSON-LD
- ❌ **Instruments & Robotics-Kits store** — built 2026-07-15 (catalog + enquiry, /instruments + /buying-guide + Staff Console tab), then **fully removed 2026-07-23 at the user's request** (section + whole store not wanted on the India site): pages, routes, API, model, seeder data and Store tab deleted; store_products table dropped via migration. Footer slot now links /physical-classes.
- ⬜ Later (user list): India-city geo pages; deeper round-2 audit (portals detailing, lead capture, teacher profiles, referral bonus system, YouTube linkages, product-page upgrades, video-courses front, physical-classes module)

---

## India-localisation of the catalog ✅ (2026-07-28)

The catalog was inherited from the US-facing sister site, so it carried subjects that have no counterpart anywhere in Indian schooling. Verified against the official CBSE 2025-26 curriculum documents and the CISCE ICSE/ISC regulations — the strings "Social Studies", "Algebra I/II", "Pre-Calculus", "Integrated Math", "Honors", "Elementary/Middle/High School" appear **zero times** in all four.

**Removed (16 courses)** — US College Board tests (SAT/PSAT Math Mastery, Digital SAT/PSAT Math, English SAT/PSAT, Math SAT/PSAT, NMSQT, ACT) and the US high-school maths pathway (Integrated Math I/II/III, Algebra I, Algebra II, Algebra I Foundation, Geometry, Pre-Calculus, Calculus, Honors Chemistry/Biology/Physics). In India algebra, geometry and calculus are *units inside Mathematics*, never separate subjects, and "Honors" is a US GPA-weighting label no Indian board uses. Also purged the leftover **AP Courses** branch (20 dead links still rendering on the homepage and Plans page after the courses themselves were pruned) and the whole **Standardized Tests** branch. All old URLs 301 to `/courses`.

**Renamed** — `Social Studies` → `Social Science` (CBSE's actual name; ICSE calls it "History, Civics and Geography"); the two category bands → **Academics — Primary & Middle (Classes 1-8)** and **Academics — Secondary & Senior Secondary (Classes 9-12)**. "Elementary" was not just un-Indian: under the RTE Act it means Classes 1–8, so using it for Classes 1–5 was actively wrong. Old course and category URLs 301 to the new slugs.

**Added (13 courses, curricula authored from the official syllabi — not copied from WinQuest)**
- Classes 11-12 humanities, replacing the bogus single "Social Studies Grade 11-12": **History** (027), **Political Science** (028), **Geography** (029, incl. the Practical Work paper)
- Commerce stream, previously absent entirely: **Accountancy** (055), **Business Studies** (054), **Applied Mathematics** (241 — the Commerce maths track, no US equivalent)
- Computing: **Computer Science** (083, Python) and **Informatics Practices** (065, Pandas/Matplotlib) — two distinct, mutually-exclusive CBSE subjects
- Competitive exams as real course pages rather than book-a-demo links: **JEE Main**, **JEE Advanced**, **NEET (UG)**, **CUET (UG)**, **Olympiad Preparation (IMO/NSO/IEO)**
- Each academic course ships a CBSE curriculum plus an **ISC (CISCE)** variant reflecting the genuinely different CISCE syllabus (e.g. ISC Computer Science is Java-based, ISC calls Accountancy "Accounts")

**Also** — Essay Writing moved from Academics to Creative Skills (a skill, not an Indian board subject); the `/competitive-exams` landing page rebuilt around Indian exams; the "Digital SAT Math" video course replaced with "NCERT Class 10 Maths"; 32 orphaned course images deleted; board-page subject chips deduped across the two bands.

### Hobby & skill curricula ✅ (2026-07-29)

The second pass. **71 courses** — the 55 that had no curriculum at all, plus **16 that turned out to be raw WinQuest scrapes** and failed the same "author it ourselves" rule: Saxophone was one "level" of 88 fragments, Guitar opened with an "About the Curriculum" level that was just links to abrsm.org / trinitycollege.com / rslawards.com, and topics included `Prerequisites:`, `None`, `Requirements:` and `Stable Internet Connection`.

All 71 were re-authored against the real graded traditions — Prayag Sangit Samiti / Gandharva Mahavidyalaya for Hindustani and Carnatic music, the Trinity/ABRSM grade *shape* for Western instruments (named in prose only, never linked), CEFR A1–B2 for foreign languages, script-first progressions for Indian languages, and CFOP/FIDE for mind sports. Every course is now 5–6 levels × 6–8 topics, each topic a full sentence with a real `age` and `duration`.

Verified mechanically before merging: **zero** topics carried over from the old scrapes, zero URLs, zero cross-tradition terminology leakage (no adavu/araimandi in Kathak, no bansuri terms in Western flute, no varisai in Hindustani), and 0% topic overlap between every deliberately-paired course (Python vs Python for Beginners, AI&ML vs its school-age version, Robotics vs Computational Thinking, Chess vs Chess Strategy, Piano vs Keyboard). Catalogue now: **110 courses, 633 levels, 4,708 topics, 0 empty.**

Also fixed in this pass: 12 homepage card descriptions that were HTML-strip artifacts with the spaces eaten (`For Parents:This program`, `MoreCertificates of Completion`, `(6–8 months)Level 2 →`), 5 feature lists that still read "Expert AP mentors" or advertised "Trinity / ABRSM / RSL aligned", and the duplicated course name "Western Dance Dance" → "Western Dance" (slug left alone for URL stability).

### Curriculum PDF, security pass & generated course art ✅ (2026-07-29)

**Designed curriculum PDF.** `/download-curriculum` printed the whole web page — site header, marketing band and footer all appeared, level cards split across pages leaving ~40% blank gaps, and there was no print stylesheet anywhere in the project. Two fixes:
- A proper `@media print` block in `app.css` (levels are `break-inside: avoid`, headings `break-after: avoid`, single-column topics, A4 portrait). Scratch went 6 pages → 2. Header/Footer/MarketplaceBand now carry `print:hidden`.
- The real deliverable: **`GET /curriculum/{slug}.pdf`** generated server-side by **mPDF** (`CurriculumPdfController` + `resources/views/pdf/curriculum.blade.php`) — cover page, running header/footer, and true "Page 3 of 4" numbering, which browser print cannot do because Chrome does not implement CSS `@page` margin boxes. Output is deterministic rather than varying with each visitor's print dialog.
- mPDF was chosen over dompdf specifically because the Hindi and Sanskrit curricula contain Devanagari conjuncts and matras (क्ष, त्र, ज्ञ, का/कि/की); verified the generated PDFs embed FreeSerif alongside DejaVu and map matras as separate codepoints — dompdf has no Indic shaping and would have produced garbage. Browsershot/Puppeteer was ruled out: the server has no Node.
- `vendor/mpdf` ships ~87 MB of fonts. **`scripts/trim-mpdf-fonts.php`** prunes it to the families reachable from the languages the catalogue teaches (94 MB → 26 MB, 67.5 MB freed), is wired into composer's `post-install-cmd`/`post-update-cmd` so it survives a reinstall, is idempotent, and refuses to run if the keep-set resolves to fewer than 10 files. All 110 courses re-rendered clean after the trim. The controller also falls back to a plain render if a font is ever missing, rather than 500ing.

**Security pass — `composer audit` now reports zero advisories** (was 7).
- `guzzlehttp/guzzle` 7.13.2 → 7.15.2 (4 advisories). Pre-existing production dependency pulled in by Laravel, not by mPDF.
- `laravel/framework` v11.54 → **v12.64** (3 advisories, incl. a high-severity CRLF injection in the default email rule). Gated on the test suite; all 41 tests green before and after, and every route re-checked.
- Exposure at the time was limited — nothing used signed URLs and nothing sent mail — but the CRLF issue becomes live the moment messaging is wired up, so it was worth fixing now rather than later.
- Fixed a stale test (`CategorySlugSeederTest`) left behind by the India-localisation pass: it still asserted the removed `ap-biology`/`algebra`/`math-sat-psat` slugs. It now also asserts the retired US categories do **not** come back.

**Generated course art.** The 10 courses added in the localisation passes had no photography. Rather than fake stock photos, each got a branded illustration (navy→blue brand gradient, gold accent, a distinct subject motif — ledger, bar chart, curve, code brackets, data grid, atom, gear, DNA, campus, medal):
- **SVG** for card and hero (37 kB for all 20 files, crisp at any size), wired into `courseImages.js`
- **One PNG at 1200×630** per course for `og:image`/JSON-LD, since WhatsApp and Facebook do not render SVG. A flat-colour variant is used for the raster because the gradient version cost 415 kB as PNG versus 25 kB flat — and flat reads better at thumbnail size anyway. `image_url` in `courses.json` points at these, which is also the first self-hosted `image_url` in the catalogue (the other 72 still hotlink the old WordPress uploads and will break at cutover).

⚠️ **Open items** — NTSE and KVPY links were removed rather than rebuilt: both appear to have been discontinued/merged and this could not be verified in-session, so confirm status before advertising either. SAT/ACT were cut per product decision even though Indian students do sit them for overseas admissions; if study-abroad prep is wanted later, add it as an explicitly separate "Study Abroad" category, never inside the school-syllabus tree. The 10 new courses without photos fall back to the gradient tile — client photography still needed. Homepage testimonials remain placeholder marketing copy and should be replaced with real ones before go-live.

---

## Reference — source data model (from WP export)
- **Courses** (`product`, WooCommerce simple): meta `_ito_subtitle`, `_ito_age`, `_ito_pills`, `_ito_tier_labels`/`_ito_tier_o2o`/`_ito_tier_group`, `_ito_curriculum`, `_regular_price`/`_sale_price`
- **Tutors** (`ito_tutor`): full_name, tagline, qualification, teaching_mode, city/state/localities, fee_hourly, fee_trial, verified, languages, experience_years
- **Cities** (`ito_city`), **Teacher applications** (`ito_teacher_app`), **Blog** (`post`)
- Category tree: ~40 product categories (Academics, AP Courses, Musical Instruments, IT/Coding, Languages, Dance, Standardized Tests, Mind Sports, …)
