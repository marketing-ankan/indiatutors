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

### Role-split dashboards & the Admin Console ✅ (2026-08-03)

`/dashboard` rendered the **same parent-shaped page for parents, students and admins** — only teachers branched. An admin's own dashboard offered to add their children and upload their Aadhaar; a student saw a page about managing other students. Each role now gets its own view behind one shared, role-tinted hero:

| Role | Lands on |
|---|---|
| **admin** | the Admin Console (the same component `/admin` renders — one console, two entry points) |
| **teacher** | profile, KYC, classroom, calendar, reschedules, proposals — unchanged |
| **parent** | demo requests, enrolments, upcoming classes, exam updates, students, KYC |
| **student** | their own enrolments, upcoming classes, exam updates and portfolio. No "my students", no KYC, no demo-booking card |

**The console** is modelled on WinQuest's — pill tabs deep-linked by hash (`#ac-orders` etc.), count badges on every tab, stat tiles and a live "needs attention" queue — but in IndiaTutors' own navy palette, and honest about what this platform actually has:
- **Teachers** merges `teacher_profiles` with `teacher_applications` that have no matching account, de-duplicated by email, each row carrying `kind` so it only offers actions it can perform. Until now the public "Become a Teacher" submissions had **no UI at all**. The reference's "Active" maps to `tutors.is_published` and is labelled **Listed**, because that is what it does.
- **Users** gains create / edit / delete, plus "create student account (linked to a parent)". Creating an admin needs an explicit confirmation; no password is ever generated; deleting a guardian warns that `students.user_id` cascades. **"View dash" is a read-only, server-composed snapshot — never impersonation**, since minting a token for another account has no policy layer to constrain it. Every open is logged.
- **Orders** refuses to delete a `paid` order: video entitlements point at it with `nullOnDelete`, so deleting one would leave the buyer's access alive with nothing behind it. Cancel instead.

**Four new tables.** `reviews` (real course reviews — the review form on `/courses/{slug}` previously only *pretended* to submit, and the star rating was a hash of the slug; both are now real, and **no rating renders at all until a course has an approved review**), `audit_logs` (who changed what — role changes previously left no record of who made them), `settings` (key/value, first user the Google review URL), plus `students.code` (`STU-100514`, stored not derived) and `students.account_user_id` (a student's own login, distinct from the guardian who owns the profile).

**Also fixed in this pass:** `AccountSettingsCard`/`MyOrdersCard` were committed but imported nowhere and called three `api.js` helpers that did not exist; `AuthController::updateMe`/`changePassword` existed with **no routes**. All now wired into a new `/account` page. Event sign-ups moved from `contact_messages` to real workshop bookings (`demo_requests.type`), so the console can finally count them — the phone field became required as a result. The console is `React.lazy`'d: despite everything added, `main.js` **shrank 937 kB → 907 kB**.

Verified end-to-end: 76 tests / 301 assertions green (was 41/131); migrations run clean on a throwaway DB; approving a review in the console makes it appear on the public course page; all four role dashboards checked in-browser; zero horizontal overflow across all 12 console tabs at 360 / 768 / 1024 / 1440 / 1920 / 2560.

⚠️ **Deliberate divergence from WP parity** — `PARITY-AUDIT.md` already marks `/dashboard` as intentionally different from the live WordPress site. This deepens that: the console is modelled on the sister site's admin, not on anything indiatutorsonline.com currently serves. The audit log starts empty and only fills from this release; historical actions cannot be reconstructed. Event sign-ups made *before* this release remain in `contact_messages` and are not shown in Bookings.

---

## Physical / home tuition — matching data capture ✅ (2026-08-03)

**Why this exists.** A separate app will assign teachers to students for in-person classes. This site is the system of record it reads: what a teacher can do and where, what a family needs and where. So the job was not "a form" — it was capturing the specific fields a geographic match can actually be computed from, and exposing them as a stable contract. Full field dictionary: **`docs/MATCHING-DATA-CONTRACT.md`**.

**What breaks a physical match that never mattered online:** can the teacher *repeatedly* get there, do the hours actually intersect, and would this family accept this person in their home. Three things followed from that:

- **`teaching_offerings`, one row per subject × class range × boards × fee** — replaces the comma-separated `subjects` string. A CSV cannot say *"Physics for 11–12 CBSE, but Maths only up to Class 8"*, so it sends that teacher a Class 12 Maths lead and burns both the lead and the relationship. Fees live here too, because Class 12 Physics is never priced like Class 3 Maths.
- **`teaching_availability_slots` — real `(weekday, start, end)` rows.** The old profile stored `"5-8pm weekdays"`, which nothing can intersect with a family's preferred times; availability could only be read by a human on a phone call. Plus `_exceptions` for single dates, because matching on the weekly pattern alone books teachers who are not there.
- **Coordinates, with their precision recorded.** A radius is a circle and a circle needs a centre. No maps API and no bill: the browser's own geolocation gives an exact fix from a "use my current location" button, the bundled `pincodes` table gives a ~1 km centroid otherwise, and unknown pincodes average from the 3-digit postal sorting district. Every coordinate carries `geo_source` so a ~15 km guess is never mistaken for a doorstep. `php artisan pincodes:import` loads the official directory over the ~200 bundled anchors.

**Six tables** — `pincodes`, `physical_teaching_profiles`, `teaching_offerings`, `teaching_availability_slots` + `_exceptions`, `tuition_requirements`. The teacher profile carries **two nullable owners** (`user_id`, `teacher_application_id`): the public apply form captures it before an account exists, and approval hands the *same row* to their account rather than copying it, so the two can never drift.

**Both front doors write the same rows** through one `PhysicalProfileWriter` — /become-a-teacher (rebuilt around the shared components) and the dashboard's four-step wizard. The family side is `tuition_requirements`, one row per open request (two children, or Maths now and Science in June, are two different matches), captured signed-out on /physical-classes and signed-in from the parent dashboard.

**The export** is `/api/matching/v1/*`, gated by `MATCHING_API_KEY` in an `X-Matching-Key` header. **Unset ⇒ the whole prefix 503s** — it is home addresses on both sides and must never be open by default. Flat and pre-resolved (coordinates computed, grades as ordinals, availability as ranges), stable `teacher:{id}` ids, `updated_since` + a `meta.checkpoint` read from the *last row in the page* rather than "now", so a record written mid-page is re-read rather than skipped. One write-back only: which teacher was assigned.

**No matching lives here — by instruction and by design.** A first pass shipped a reference matcher and an admin "Find matches" preview; the founder confirmed matching and suggesting belong in the **leads-management software**, so it was removed rather than left as a second opinion. `TutorMatcher` and `Geo` are deleted, along with the candidate endpoint and its UI. The admin PATCH deliberately **cannot** set `matched_profile_id` — only the key-authed export write-back can, so there is exactly one system that decides an assignment.

What the console does instead is *triage*: read the whole request before calling the family, note/hold/close it, and — on the teacher side — a **Ready?** column flagging the three things without which a record is unusable downstream (coordinates, ≥1 subject, some availability). A teacher stuck at 40% complete is invisible to the leads software however good they are; that is a phone call, not a mystery to discover later.

Verified: 94 tests / 391 assertions green; the full guest → requirement → publish → export path driven through the real UI; zero horizontal overflow at 360 / 375 / 390 / 414 / 640 / 768 / 1024 / 1280 / 1440 / 1920 / 2560 on all four touched pages (one pre-existing 8px overflow in the teacher calendar header fixed on the way).

**Two bugs the removal pass surfaced, both fixed.**
1. 🔒 The guest `POST /api/tuition-requirements` accepted a `student_id` and only ownership-checked it on the *signed-in* branch. `exists:students,id` proves an id is real, not that it is yours — so a stranger could bind their lead to any child's profile, and the export dereferences that FK (`student_code`, and the child's name whenever `learner_name` is blank), carrying another family's details out to the leads software inside an attacker-created record. Now `unset` for guests, matching `DemoRequestController`'s long-standing guard. Regression test added.
2. An unmatched `/api/*` path fell through to the SPA catch-all and answered **200 with HTML**, so a typo'd or deleted endpoint looked like a success and JSON clients failed later somewhere unrelated. `routes/web.php` now 404s API paths.

Found by an adversarial audit of the removal (four independent lenses → a skeptic per finding; 37 raised, 36 refuted, 1 confirmed — the guest IDOR). The same pass also stripped the last matching-shaped code that had no caller left: `TeachingOffering::coversGrade/coversBoard` and `Availability::overlapMinutes`, both of which compared a teacher against a student and now belong solely to the leads software.

**`suggestTutors` removed too (2026-08-04).** The Phase-4 demo→enrolment flow ranked tutors by a booking's subject and city and handed staff a shortlist — the same thing under another name, so it went as well. What stayed is `assignDemo`/`convert`: **recording** who was assigned is what the enrolment → classroom → curriculum → class-log chain hangs off, and removing that would break Phases 4–6. The console's dropdown is now every published tutor, alphabetical and unranked, with a search box and a line saying where the decision is actually made. Net effect: this codebase can record a match but can no longer form an opinion about one.

⬜ **Left:** set `MATCHING_API_KEY` on the server and hand it to the leads software; load the official pincode CSV before launch (the bundled anchors are ~1 km centroids); police-verification is staff-set from the console with no workflow behind it yet. The public tutor search on `/physical-classes` stays — a visitor filtering the directory themselves is browse, not lead matching — say the word if that should go too.

---

## Deploy reliability — the white-screen window ⬜ (two of three fixes shipped 2026-08-04)

**The symptom, measured.** Every push that changed a frontend file blanked the live site for **3.5, 4.9 and ~4 minutes** on three consecutive deploys. Not an error page — the served HTML asked for `main-<newhash>.js` while the web root still held the previous build, so the bundle 404'd and the SPA painted nothing. It always recovered on its own, because the pre-gate self-heal (b7ea9c6) re-copies the build at the top of every cron cycle. It just recovered slowly, in public.

**The cause.** The cron deploy rewrites 134 courses, 112 categories and every curriculum row on *every* push, whether or not `courses.json` moved. Shared hosting caps how long that job may run and kills it partway — and the step that copies the new build to the web root sits *after* that work. Proof without SSH: `sw.js` (written in the pre-gate block) updates on every deploy, while `manifest.webmanifest` (written in the tail) has not moved since **15 July**. The script reliably finishes its opening block and has not reached its own end in three weeks.

**Fix 1 — `SeedFingerprint`.** Each seeder gates on a CONTENT hash of its inputs, stored in `settings`. Content, not mtime: git does not preserve mtimes, so an mtime fingerprint would look changed on every pull and skip nothing. CourseSeeder drops **4.7s → 0.9s** when nothing changed, and 0.9s of that is Laravel booting.
- ⚠️ This nearly caused a worse bug than it fixed. These seeders do two jobs — **import** the catalogue and **repair** drifted data — and a content hash cannot tell them apart, because the source file is identical either way. Gating both would have silently disabled the `CourseController` curriculum self-heal, which exists *because* this deploy step dies. Repair callers now say so: `SeedFingerprint::bypass()`, or `SEED_FORCE=1` from the CLI. `CategorySlugSeederTest` caught it, and now pins both directions plus "a wiped catalogue re-seeds even though the hash matches".

**Fix 2 — `DocrootBuild`.** The request that renders the SPA shell is, by definition, the request about to reference a bundle that may not be there. It now checks and merge-copies the build across, once, behind a cache lock: minutes of white screen become one ~250ms request, with no cron and no SSH. Merge rather than replace, so the web root is never momentarily without a build — safe because Vite names carry a content hash and can only be added; `manifest.json` is written last so the pointer never lands before what it points at. The PWA files the dead tail owns ride along.
- Guarded hard: it acts only when `dirname(base_path())` really is the Hostinger split layout, identified by the patched `index.php` the installer writes. On a dev box that path is the whole XAMPP htdocs root. Tested both ways — including against the installer's own `sed`, so the marker cannot drift out of sync and turn the fix into a silent no-op — and end-to-end against a replica of the real layout.

**Fix 3 — the real one: reorder, and retire the append-only rule.** ✅
- `deploy/run.sh` is a stable launcher: it pulls, then `exec`s the deploy as a **fresh process**. Because that process opens `deploy.sh` *after* the pull, the deploy script can never be rewritten underneath itself — so it is now ordinary, freely-editable code rather than append-only. The pull and the `exec` share one line, since bash reads a whole line before running it.
- `deploy/deploy.sh` reverses the order that caused everything: **assets first, database last.** Everything a visitor can see — build swap, PWA files, icons, images, caches — completes before anything that can be killed. If the DB step dies now, the site is already correct and it simply retries next cycle. Verified by running it against a scratch web root with a deliberately broken DB: the bundle shipped anyway.
- **Two markers, not one** (`storage/app/deploy-state/{assets,db}.sha`). A killed migration retries without redoing the asset copy; a finished asset copy is never repeated because the DB is still pending. The asset step also re-syncs whenever the web root is missing the bundle the manifest names, whatever the marker says — so a partial copy self-heals.
- Every artisan call is wrapped in `timeout`, so one hung command can no longer consume the whole budget.
- **No cron change needed.** `hostinger-deploy.sh` became a 470-byte shim that `exec`s the launcher. The old version self-pulled at byte 721, so a mid-run swap to something shorter lands past EOF instead of part-way through a command — a garbled cycle is impossible, worst case is one idle cycle before the new chain takes over.

⚠️ Fixes 1 and 2 stay: 1 keeps the DB step cheap so it stops being killed at all, 2 protects visitors on the one cycle where the web root is briefly behind. But **Fix 3 is what makes the blank page structurally impossible** rather than merely recovered-from, and it is robust to the cause of the kill being something other than the seeders — which, after the adoption stamp still did not get the body to its `cp`, it may well be.

**Fix 1 shipped inert, and had to be rescued (commit 4518f93).** The gate only starts saving work *after* a seeder completes and stamps — but `CourseSeeder` is exactly what keeps being killed. It never finished, never stamped, the gate never engaged: a fix that could not activate, by construction. Confirmed on the server after a fresh push — the pull landed (PHASES.md updated in the checkout) while `build/assets/main-*.js` still carried the previous day's mtime, so the body never reached its `cp`; and no migrations were pending that run, which rules out `migrate` and leaves the seeders.
- The escape: the database does not need seeding at all — it has served the correct catalogue for weeks, so the seeder is *redundant*, not pending. `SeedFingerprint::adopt()` lets a caller that can PROVE the data matches the source stamp on the seeder's behalf; `CourseController` does so on a product-page view, behind the same 6h lock as the curriculum heal. The proof is exact — every slug in `courses.json` present AND the sentinel's curriculum non-empty — because stamping a half-seeded database would tell every future deploy to stop repairing it. Both refusal cases are tested.

**Verification traps, both hit for real — save the next person the hour:**
1. The server varies HTTP header casing (`Last-Modified` vs `last-modified`). A case-sensitive diff reported "fixed" when nothing had changed. Always `grep -i`.
2. The deploy body only runs when there is a **new commit to pull** (`BEFORE==AFTER → exit 0`). A deploy-script or seeder fix therefore cannot be tested by watching idle cron cycles — it needs a push. A docs-only commit is the clean experiment: no bundle change, so no blank-page risk.
3. Fetching `/laravel/**/*.php` over HTTP returns an EMPTY 200 — Apache executes the file rather than showing source, and a class file prints nothing. Only non-PHP files (`.md`, `.sh`, `.json`) work as "did the pull land" markers.

**Progress marker:** `manifest.webmanifest` Last-Modified is stuck at 15 Jul 2026. The day it moves, the script has reached its tail for the first time and Fix 1 is finally doing its job.

---

## Reference — source data model (from WP export)
- **Courses** (`product`, WooCommerce simple): meta `_ito_subtitle`, `_ito_age`, `_ito_pills`, `_ito_tier_labels`/`_ito_tier_o2o`/`_ito_tier_group`, `_ito_curriculum`, `_regular_price`/`_sale_price`
- **Tutors** (`ito_tutor`): full_name, tagline, qualification, teaching_mode, city/state/localities, fee_hourly, fee_trial, verified, languages, experience_years
- **Cities** (`ito_city`), **Teacher applications** (`ito_teacher_app`), **Blog** (`post`)
- Category tree: ~40 product categories (Academics, AP Courses, Musical Instruments, IT/Coding, Languages, Dance, Standardized Tests, Mind Sports, …)
