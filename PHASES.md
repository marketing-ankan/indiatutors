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
- ⬜ Category landing pages
- ⬜ Course listing filters: grade/class, board (CBSE/IGCSE/ICSE), mode (1:1 / group / self-paced video), price range (category + search + sort + pagination already work)
- ✅ Course detail: age, curriculum (level/topic), pills, subtitle, CTA — *(pricing tiers 1:1-vs-group deferred; source data is mostly single-price)*

**Tutors & local SEO**
- ✅ Full tutor profiles (qualification, subjects, city/localities, hourly+trial fee, languages, verified, experience) — 13 seeded
- ✅ Tutor directory filters (subject, city, mode) + sort
- ✅ City pages — `/tutors-in/{city}` local-SEO landing (tutors + subjects + localities), derived from tutor data; scales to any city. Discoverable from Find Tutors.

**Content & pages**
- ⬜ Landing pages: Group Classes, Free Classes, Video Courses, Events & Workshops, Competitive Exams, Skill Programmes
- ⬜ Blog: list + post detail (migrate 4 posts)
- ✅ Legal: Privacy Policy, Terms of Service, Refund & Cancellation
- ⬜ Refer & Earn, Plans & Pricing (driven by real tiers), polish About/Contact

**SEO / technical**
- ⬜ Per-page meta/title, Open Graph, structured data (Course, LocalBusiness), `sitemap.xml`, `robots.txt`
- ⬜ 301 redirects from old WordPress URLs (preserve rankings)
- ⬜ GA4 / analytics, performance pass

---

## Phase 3 — Accounts, roles & KYC ⬜
- Auth (Sanctum) with roles: parent/student, teacher, admin; email/OTP verification
- Parent account → multiple student profiles
- Profile management; KYC uploads: Aadhaar/PAN/photo/certificates
- "My Account" + role-based dashboard shells

## Phase 4 — Demo → enrollment engine ⬜
- Requirement/demo capture (subject, grade, mode, location)
- Teacher matching/allocation (subject/grade/pincode) — system + manual
- Teacher selection → call & confirm → security check → schedule demo (online/offline)
- Conversion → enrollment record linking student + teacher + course

## Phase 5 — Teacher portal ⬜
- Onboarding: CV, KYC, service areas by pincode, schedule/availability
- Course/subject approval workflow
- Students views: demo / enrolled / ongoing (grade, subject, location)
- Progress tracker (curriculum classwise, update after each class); curriculum define/divide/edit
- Notes/PPT/homework/lesson plans/question bank (scan/upload); class calendar; feedback

## Phase 6 — Student/Parent portal ⬜
- Access teacher details + curriculum + progress tracker
- Videos, notes, lesson plans, question bank
- Class schedules, reschedule requests, portfolio building, exam updates

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
