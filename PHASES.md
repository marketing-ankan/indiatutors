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

## Reference — source data model (from WP export)
- **Courses** (`product`, WooCommerce simple): meta `_ito_subtitle`, `_ito_age`, `_ito_pills`, `_ito_tier_labels`/`_ito_tier_o2o`/`_ito_tier_group`, `_ito_curriculum`, `_regular_price`/`_sale_price`
- **Tutors** (`ito_tutor`): full_name, tagline, qualification, teaching_mode, city/state/localities, fee_hourly, fee_trial, verified, languages, experience_years
- **Cities** (`ito_city`), **Teacher applications** (`ito_teacher_app`), **Blog** (`post`)
- Category tree: ~40 product categories (Academics, AP Courses, Musical Instruments, IT/Coding, Languages, Dance, Standardized Tests, Mind Sports, …)
