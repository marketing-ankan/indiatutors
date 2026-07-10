# IndiaTutors Online — Progress Log

Rebuild of the WordPress site (indiatutorsonline.com) as a **Laravel 11 API + React SPA**, extended into a two-sided tutoring marketplace. Source-of-truth roadmap: [`PHASES.md`](PHASES.md).

**Live (staging):** https://deepskyblue-quetzal-247991.hostingersite.com

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation, marketing site & deploy pipeline | ✅ Done · Live |
| 2 | Full website parity, SEO, UI match | ✅ Done · Live |
| 3 | Accounts, auth & KYC | ✅ Done · Live |
| 4 | Demo → enrollment engine + staff console | ✅ Done · Live |
| 5 | Teacher portal (profile, approval, classroom, curriculum, materials, proposals) | ✅ Done |
| 6 | Student/Parent portal (teacher + curriculum + progress + materials) | 🔨 v1 done |

---

## ✅ Phase 1 — Foundation & marketing site
- Laravel 11 API + React (Vite + Tailwind) SPA, served **same-origin**
- Course catalog & tutor directory (browse); Book-a-Demo + Contact lead forms
- GitHub `dev`/`main`, `push.bat` / `promote.bat`
- **Hostinger cron deploy pipeline** — pulls `main`, runs migrations + idempotent seeders, rebuilds caches; **non-destructive**
- `vendor/` and `public/build` committed (server has no Composer/Node; `proc_*` disabled)

## ✅ Phase 2 — Full website parity (WordPress retired)
- **Catalog:** 134 courses from the WP export (real slugs, pills, age, curriculum); hierarchical categories (112); price filter, search, sort, pagination; self-pruning seeder
- **Tutors & local SEO:** full profiles (13) + filters; city pages (`/tutors-in/kolkata`)
- **Content:** blog (3 articles), legal (privacy/terms/refund), Refer/Plans/About/Contact
- **SEO:** server-rendered per-route meta + `sitemap.xml` + `robots.txt`; JSON-LD (Org, Course+Offer, Person, EducationalOrg, Article, Breadcrumb); GA4 (env-driven)
- **QA:** 8 bugs fixed; **UI aligned to real site** — exact brand `#1E40AF`, % OFF badges, star ratings

## ✅ Phase 3 — Accounts, Auth & KYC (verified on production)
- Sanctum **bearer-token** auth (register/login/logout/me), rate-limited; roles parent/student/teacher/admin
- Parent → many **students** (owner-scoped CRUD, 403 on cross-access)
- **KYC uploads** → private storage, MIME/size validated, path never exposed
- Protected **Dashboard**, auth-aware header, real Login/Register
- **QA:** 26 auth tests + KYC + full browser flow

## ✅ Phase 4 — Demo → enrollment engine
- Demos linked to accounts + student (ownership-checked); guests still work; book-demo prefills
- **Enrollments** (student + tutor + course + plan + status); demo requests gained `assigned_tutor_id` + `scheduled_at`
- **Teacher matching** (subject + city)
- **Staff Console** (`/admin`, role-gated): assign & schedule tutor → **convert demo to enrollment**
- Parent dashboard: **My demo requests** + **My enrollments**
- Admin is **env-gated** (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) — no default-password admin
- **QA:** 11 enrollment-flow tests + admin UI verified

## 🔨 Phase 6 — Student/Parent portal (v1 done 2026-07-10)
- ✅ **Parent enrollment detail**: expand any enrollment → assigned teacher (photo, qualification, subjects, experience), **curriculum progress** (n/m done), class history, **materials download** (files stream via authed endpoint; links open directly)
- ✅ Ownership-checked: only the owning parent (plus assigned teacher/admin) can view or download
- ⬜ Next: reschedule requests (Phase 8), portfolio, exam updates
- QA: covered by the 9 curriculum/materials feature tests + full browser flow (teacher creates → admin approves → parent consumes)

## ✅ Phase 5 — Teacher portal (v3 done 2026-07-10)
- ✅ **Teacher onboarding & profile** (v1): headline, qualification, subjects, languages, experience, fee, city, mode, service areas (pincodes), **availability (days + slots)**, bio — self-editable on the dashboard (KYC from Phase 3)
- ✅ **Admin approval** (v1): Staff Console "Teacher Applications" tab (approve / reject)
- ✅ **Approval → tutor bridge** (v2): approving a teacher auto-creates a listed directory `Tutor` linked to their account (`tutors.user_id`), so Phase-4 demos/enrollments now reach the teacher's portal
- ✅ **Teacher classroom** (v2): "My students" roster (assigned enrollments), upcoming assigned demos (parent PII withheld), and a per-enrollment **class log / progress tracker** (topic, date, duration, homework, notes, status) — ownership-scoped, self-serve on the dashboard
- ✅ **Course proposals** (v3): teacher proposes a subject → Staff Console "Course Proposals" tab → approval appends it to the tutor's directory subjects
- ✅ **Curriculum define/divide/edit** (v3): ordered topics per enrollment with pending → in-progress → done status (classwise progress tracker)
- ✅ **Materials** (v3): notes/PPT/lesson-plan/question-bank/homework — private 10 MB file upload (KYC-style storage, path never exposed) or external link; parent downloads via authed streaming endpoint
- ⏸️ Deferred: class calendar UI (scheduled class logs cover it; full scheduling is Phase 8)
- QA: **20 feature tests green** (8 classroom + 9 curriculum/materials/proposals + auth 401 + 2 example) on isolated sqlite; teacher→admin→parent flow verified end-to-end in the browser

---

### Cumulative QA
42 general API + 26 auth + 11 enrollment tests — all green. Auth & forms verified end-to-end in the browser; auth smoke-tested on production.

### To activate the live admin console
Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in the **server `.env`** → the cron's AdminSeeder creates the admin on the next deploy → log in at `/login`, the **Staff** button appears.
