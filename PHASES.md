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

## Phase 2 — Full website parity 🔜 (retire WordPress)

**Kickoff decision needed:** SEO rendering strategy. The current SPA is client-rendered; a content/commerce site replacing WordPress needs server-rendered meta/content. Choose: SSR (Inertia+SSR) · prerendering · or per-route server-injected meta tags + sitemap. Decide before building Phase 2 pages.

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
- ⏸️ Landing pages: Group/Free/Video/Events/Competitive Exams/Skill Programmes — **deferred**: the source data has no group/video/free/delivery-mode split (all Live 1:1), so these need the commerce data model (Phase 7). Header no longer links to them.
- ✅ Blog: list (`/blog`) + post detail (`/blog/{slug}`) — 3 original articles seeded, Article JSON-LD, in sitemap
- ✅ Legal: Privacy Policy, Terms of Service, Refund & Cancellation
- ✅ Refer & Earn, Plans & Pricing, About, Contact (render + verified)

**SEO / technical**
- ✅ Per-route server-rendered meta/title + Open Graph + Twitter (via `SeoMeta`), dynamic `sitemap.xml` (272 URLs) + `robots.txt`
- ✅ Structured data / JSON-LD (Organization + WebSite, Course + Offer, Person, EducationalOrganization, BreadcrumbList)
- ⬜ 301 redirects from old WordPress URLs (needs old permalink map; do at real-domain go-live)
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

## Phase 5 — Teacher portal ✅ (v3 done 2026-07-10)
- ✅ **Teacher onboarding & profile** (v1): headline, qualification, subjects, languages, experience, fee, city, teaching mode, **service areas (pincodes)**, **availability (days + slots)**, bio — self-editable on the dashboard (KYC already from Phase 3)
- ✅ **Admin approval** (v1): Staff Console "Teacher Applications" tab — approve / reject (status pending→approved→rejected)
- ✅ **Approval → directory tutor link** (v2): approving a teacher auto-creates (idempotent) a listed `Tutor` record linked to their account, so demos can be assigned to them and their enrollments flow into the portal — bridges the Phase-4 enrollment engine to the teacher account
- ✅ **Teacher classroom** (v2): "My students" roster (assigned enrollments — demo/enrolled/ongoing), **upcoming assigned demos** (no parent PII), and a per-enrollment **class log / progress tracker** (topic, date, duration, homework, notes, status) — self-serve on the dashboard, ownership-scoped
- ✅ **Course proposals** (v3): teacher proposes a new subject → Staff Console "Course Proposals" tab → approval appends it to their directory subjects
- ✅ **Curriculum define/divide/edit** (v3): per-enrollment ordered topics with status (pending → in progress → done) — the classwise progress tracker parents see
- ✅ **Materials** (v3): notes / PPT / lesson plans / question bank / homework — private file upload (10 MB, KYC-style storage) or external link, per enrollment
- ⏸️ Deferred: class calendar UI (scheduled class logs cover v1 needs; full scheduling is Phase 8)

## Phase 6 — Student/Parent portal 🔨 (v1 done 2026-07-10)
- ✅ **Enrollment detail view**: parent expands any enrollment → assigned **teacher details** (photo, qualification, subjects, experience), **curriculum progress** (n/m done), **class history**, and **materials** (download files / open links) — ownership-checked, admin & assigned teacher may also download
- ⬜ Reschedule requests (Phase 8 scheduling), portfolio building, exam updates

## Phase 7 — Payments & payouts ⬜
- **Direct purchase** (video/self-paced): cart → checkout → Razorpay + GST invoice
- **Demo-first** (live): fees + GST at enrollment, per-class billing
- Teacher payouts: net of TDS, fixed margin, retention/conversion bonuses
- Refunds & receipts

## Phase 8 — Scheduling, messaging & location ⬜
- In-app notifications + WhatsApp/email/phone linkages
- Class scheduling/rescheduling, reminders
- Home-tuition location tracking / teacher check-in
- Issue/emergency reporting (student unavailable, teacher can't visit)

## Phase 9 — Admin dashboard & analytics ⬜
- Teachers & students/parents by location / state / subject / grade
- Revenue analytics (month / location / state / subject / grade)
- Teacher-payment analytics; approvals, moderation, security

## Phase 10 — PWA, hardening & go-live ⬜
- PWA (installable, offline shell, push notifications)
- Security/compliance pass, rate limiting, data protection
- Migrate to real domain (update `APP_URL`, `SANCTUM_STATEFUL_DOMAINS`), performance, monitoring
- *(Native React Native app — separate later track if needed)*

---

## Reference — source data model (from WP export)
- **Courses** (`product`, WooCommerce simple): meta `_ito_subtitle`, `_ito_age`, `_ito_pills`, `_ito_tier_labels`/`_ito_tier_o2o`/`_ito_tier_group`, `_ito_curriculum`, `_regular_price`/`_sale_price`
- **Tutors** (`ito_tutor`): full_name, tagline, qualification, teaching_mode, city/state/localities, fee_hourly, fee_trial, verified, languages, experience_years
- **Cities** (`ito_city`), **Teacher applications** (`ito_teacher_app`), **Blog** (`post`)
- Category tree: ~40 product categories (Academics, AP Courses, Musical Instruments, IT/Coding, Languages, Dance, Standardized Tests, Mind Sports, …)
