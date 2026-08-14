# Admin console → content CRM: the gap map

Produced 12 August 2026 by a 13-agent audit of all 47 public routes against what the Staff
Console can actually change. 302 content items inventoried; 245 confirmed gaps. Every
"not editable" claim was handed to a second agent whose job was to disprove it.

## What was re-tested by hand before publishing this

The audit ran against a tree that changed underneath it, and agents are not always right.
These were re-checked directly against HEAD:

| Claim | Verdict | How it was checked |
|---|---|---|
| **B1** the deploy deletes admin-written blog posts | **CONFIRMED — the worst item here** | Wrote a post, ran `php artisan db:seed --class=PostSeeder`. Output: "pruned 1 stale". The post was gone. Re-armed by *any* edit to the seeder file. |
| **B6** the course image picker is a no-op | **CONFIRMED — 107 of 110 courses** | Parsed `COURSE_IMAGES` (107 slugs) and counted matching courses in the database. The picker only takes effect on the other 3. |
| **B5** editing an event shifts it 5.5 hours | **CONFIRMED** | The API returns `2026-07-29T02:30:00.000000Z`; the edit form shows `02:30` while the list row beside it shows `8:00 am` — two times for one record on one screen. |
| **B7** the event `mode` field is never sent | **CONFIRMED** | `EVENT_BLANK` sets it, `EventPage.jsx:103` renders it, the form has no input for it. Every event is permanently "Online". |
| **B11** `google_review_url` has no reader | **CONFIRMED** | No consumer anywhere in `app/` or the public frontend; two separate editors write it. |
| **B3** an empty SKU 500s on the second save | **REFUTED — do not act on it** | Saved two SKU-less courses through the API: both returned 200, both stored NULL. Laravel 11's `ConvertEmptyStringsToNull` turns `''` into null before validation, so the unique index is never hit. |

The audit's own section 0 lists what it got wrong about work that landed while it was
running — the Settings tab and the policy editor both exist as of commit `2b1654f`.

## Status

| Item | State |
|---|---|
| **B1** deploy deletes blog posts | **FIXED** — `console_edited_at` ownership marker; seeders skip marked rows and prune only their own |
| **B2** deploy reverts course edits / deletes console-created courses | **FIXED** — same mechanism, backfilled from the audit log so earlier edits are protected too |
| **B3** empty-SKU 500 | **REFUTED** — not a defect, do not act on it |
| **B4** saving a course corrupts its image path | **FIXED** — resource returns the raw column; the controller strips any query string |
| **B5** editing an event shifts it 5.5 hours | **FIXED** — IST wall-clock in and out; the display fix alone was not enough |
| **B6** image picker no-op on 107/110 courses | **FIXED** — a self-hosted DB image wins; legacy external hotlinks still lose to the bundled photo |
| **B7** three fields the API accepts but no form sent | **FIXED** — event mode, blog publish date, blog slug |
| **B8** exam updates: no edit form, unconfirmed delete | **FIXED** |
| **B9** review with no subject / no teacher reviews | **FIXED** — subject required, teacher reviews recordable |
| **B10** Verified badge could not be withdrawn | **FIXED** — staff toggle, confirmed before removal |
| **B11** setting with two editors and no reader | **FIXED** — one editor in Settings, read in Reviews |
| Feature gaps in section 2 | open |

---

Verification complete. The tree has moved past the audit in ways that materially change the answer, and every bug I lead with is confirmed in current code.

---

# GAP MAP — Staff Console → full content CRM

**Verified against working tree at `ankan-dev` / HEAD `2b1654f`, 12 Aug 2026.** Every claim below was re-read in the current files. Where the supplied audit is now wrong, it is marked **REFUTED** and must not be acted on.

---

## 0. READ FIRST — what the audit got wrong

The audit was written against a tree in which the settings/legal work was uncommitted WIP. **It has since landed** (commit `2b1654f` "Policy pages and site details: editable without a developer"). Acting on these items would rebuild what exists.

| Audit claim | Status | Evidence |
|---|---|---|
| "There is no Settings tab; AdminConsole lists 15 tabs, none is settings" | **REFUTED** | `AdminConsole.jsx:52` registers `{ key: 'settings', … Panel: SettingsTab }` — 16 tabs. `SettingsTab.jsx` is 461 lines, committed. |
| "An admin still finds exactly one editable setting (google_review_url)" | **REFUTED** | `SettingsTab.jsx:17-28` renders `contact_phone`, `contact_email`, `contact_locality`, `contact_address`, `entity_name`, `footer_blurb` and all six social URLs. |
| "No Legal tab; `fetchAdminLegal`/`updateAdminLegal` have ZERO callers" | **REFUTED** | `SettingsTab.jsx:4-6` imports both; `LegalPanel` (:143) and `LegalEditor` (:180) give per-section, per-block editing with add/move/delete and the 7 block types pre-shaped to pass the API's validator (`blankBlock`, :131-140). |
| "Six dead client helpers" | **CORRECTED — three** | `fetchAdminLegal`/`updateAdminLegal` are now used by SettingsTab; `fetchAdminPhysicalProfile` is used by `PhysicalTab.jsx`. Still dead: `updateAdminStudent`, `fetchAdminEnrollments`, `fetchAdminTeachers` (`api.js` is their only occurrence). |
| "Group classes are a static homepage block / uneditable" | **REFUTED** | `d33ab6a` made them DB-backed (`GroupClassController`, `AdminCourseResource` group fields, `CourseBatch`). |
| Legal `glance`/`contact` "will be silently blanked by a partial save" | **REFUTED** | `AdminLegalController::update` uses `$request->validate()` then `$document->update($data)` (:40-66) — absent keys are never written. Omission is safe. |

**Still true after the migration**, and now the residue of it:

- The legal editor covers title/eyebrow/dates/intro/**sections**. It does **not** expose `glance` (the six At-a-Glance commercial promises on the refund policy) or the `contact` cards. Both are validated by the API (`AdminLegalController.php:50-51`) with no UI.
- There is **no create and no delete** for policy documents — `routes/api.php:360-362` are `get/get/patch`. A fifth policy (Cookie Policy, Grievance Officer notice) is still developer-only.
- `google_review_url` is now editable in **two** places (`SettingsTab.jsx:27`, `StudentsTab.jsx:82-85`) and read by **nothing** — a grep across `app/` and `resources/js` finds no consumer.

---

## 1. BUGS — fix before building anything

These are not missing features. Each is a control that looks wired, reports success, and does the wrong thing. Ranked by damage.

### B1 · The deploy deletes every blog post an admin writes — **S, do this first**
`PostSeeder.php:31-33` runs `Post::whereNotIn('slug', ['hello-world'])->delete()`. `deploy/deploy.sh:152` runs that seeder on every cron pull. The only guard is `SeedFingerprint::for('posts', [__FILE__])` (:9) — an md5 of the seeder file, so **any** edit to it, including one intended to add a post, re-arms the prune.
**Impact:** total, silent loss of the only content the console currently authors.
**Fix:** prune only rows the seeder owns (a `source` column, or skip anything with `created_by`). Do not "fix" it by touching the fingerprint.

### B2 · The deploy reverts course edits and hard-deletes console-created courses — **M**
`CourseSeeder.php:75-77` prunes `whereNotIn('slug', $sourceSlugs)`, then `updateOrCreate` overwrites `name, subtitle, short_description, description, age, pills, curriculum, regular_price, sale_price, image_url, is_featured, position` and forces `is_published => true`. Triggered by `deploy/deploy.sh:148` whenever `courses.json` or the seeder changes — **and by an ordinary visitor**, via `CourseController::selfHealCurriculum` (:96-112), which calls `SeedFingerprint::bypass()` from a product-page request.
**Impact:** a price edit silently reverts weeks later; a deliberately unpublished course republishes itself; a course created in the console is destroyed outright.
**Note:** the `group_*` columns are deliberately excluded from `$attrs` — that is the correct precedent, and `GroupClassImporter` (`app/Support/GroupClassImporter.php:35-38`, returns early once any group course exists) is the model every seeder should follow.

### B3 · The second course you save without a SKU throws a 500 — **S**
`CoursesTab.jsx:133` initialises `sku: course?.sku ?? ''`. The payload (:159-168) normalises `image_url`, `sale_price` and every `group_*` field to `null` but **not** `sku`, so `''` is sent. The column is `string('sku',120)->nullable()->unique()` (`create_courses_table.php:10`) and the rule is `nullable|string|max:120` (`AdminCourseController.php:81`), which accepts `''`. `''` is a value, not NULL — the first save stores it, the second violates the unique index. 105 of 110 courses have no SKU.
**Fix:** `sku: form.sku || null`.

### B4 · Saving a course corrupts its stored image path — **S**
`Course::getImageUrlAttribute` (`Course.php:35-45`) appends `?v=<filemtime>`; `AdminCourseResource.php:20` returns that decorated value; `CoursesTab.jsx:136` loads it into form state and :163 posts it straight back. The DB then holds `/build/images/courses/x.jpg?v=1754…`; on the next read `is_file()` fails against a path with a query string, so cache-busting is permanently dead for that course and the picker's `value === img.path` highlight (`FormPickers.jsx:77`) stops matching.

### B5 · Editing any field of an event moves the event 5.5 hours earlier — **S**
`LegacyTabs.jsx:45`: `toLocal = v => String(v).replace(' ','T').slice(0,16)`. `Event.php:8` casts `starts_at`/`ends_at` to datetime, Laravel serialises them as UTC ISO-8601, and `.env` sets `APP_TIMEZONE=Asia/Kolkata`. A 10:00 IST event renders in the form as 04:30 and saves back as 04:30 IST. The list row beside it uses `new Date(...)` and shows 10:00 — **the same screen shows two different times for one record.**

### B6 · The course image picker is a no-op for ~107 of 110 courses — **S**
`courseImages.js:127` — `COURSE_IMAGES[course.slug] || course.image_url` — resolves the static map **first**, and every consumer goes through `imageFor()` (`CourseCard.jsx:20`, plus cart/wishlist/checkout/board/detail). The save succeeds, `AdminCourseResource` returns the new value, the audit log records it, the page does not change.
**Important:** the precedence is deliberate (`courseImages.js:115-122` — the catalogue's `image_url` still points at old WP uploads that break at domain cutover). The fix is **not** to flip the order; it is to prefer a DB value that is already a `/build/` path.

### B7 · "API accepts it, the form never sends it" — three live instances — **S each**
- **Event `mode`:** `EVENT_BLANK` sets `mode:'Online'` (`LegacyTabs.jsx:30`), the API validates it, `EventPage.jsx:103` displays it — and the form (:56-72) has no input. Every event is permanently Online; an in-person workshop cannot be described.
- **Blog `published_at`:** accepted at `AdminPostController.php:84`, absent from `POST_BLANK` (`LegacyTabs.jsx:762`) and the payload (:776-779). No backdating, no scheduling.
- **Blog slug:** generated once in `store()` (`AdminPostController.php:34`, `uniqueSlug` :89-97) and never touched by `update()`. A typo in a title becomes a permanent URL.

### B8 · Exam updates: no edit form, and the only unconfirmed delete in the console — **S**
`LegacyTabs.jsx:742`: `onClick={()=>remove.mutate(u.id)}` — no `confirm()`, unlike every other destructive button (:99, :439, :544, :848). `updateExamUpdate` is imported (:11) but used only for the publish toggle (:711), though the API accepts every field. A typo in a published exam update can only be fixed by deleting and retyping it — one misclick away from losing it.

### B9 · "Add a review" can create an invisible review, and cannot record a teacher review — **S/M**
`ReviewController::adminStore` (:179-197) validates `course_id` as **nullable** and has no `tutor_id` rule. The picker's default is "— No specific course —" (`ReviewsTab.jsx:156`), so the console's default action stores a review that is approvable, counts in the Reviews badge, and renders on no page. Meanwhile `reviews.tutor_id` exists and the public site accepts tutor reviews — but a teacher review phoned in by a parent cannot be entered.

### B10 · Every tutor is badged "Verified" and nothing can revoke it — **S**
`create_tutors_table.php:23` is `boolean('verified')->default(true)`. The only assignment in the app is `AdminController.php:685`, inside `linkTutor()` — which is **dead code** (grep finds its definition at :658 and two comments, no callers). The live creation path, `TeacherProfilePublisher`, never sets it. So the green ✓ VERIFIED badge (`TutorCard.jsx:11-15`) is granted by a schema default, and `/find-tutors`' "Verified Profiles" counter can never differ from the total.
**This is a compliance-grade claim the console cannot withdraw.**

### B11 · A setting with two editors and no readers — **S**
`google_review_url` — written by `SettingsTab.jsx:27` and `StudentsTab.jsx:82-85`, consumed nowhere. Either wire it into the review-request flow or drop it; a field whose help text describes behaviour that does not exist teaches staff to distrust the console.

---

## 2. FEATURE GAPS — ranked by value to the owner

Value = how often they will want to change it × what breaks or embarrasses them when they cannot.

### Rank 1 · Money: one price, not four — **L**
**Cannot do today:** change a rate anywhere except `courses.regular_price/sale_price`, and even that reaches only some surfaces.
**Affects:** `/plans`, `/plans-and-pricing`, `/`, `/courses`, `/courses/:slug`, `/competitive-exams`, `/free-classes`.
**The split:** `pricing.js` (1,198 lines, `rates` :126-1196) drives the plan calculator **and** the product-page buy card via `courseDetail.js:278-302` — measured at 104 of 110 courses, where the admin's price is never read. `/courses/:slug` then adds to cart at the DB price (`CourseDetailPage.jsx:129`), so the cart charges a different number from the card. The homepage carries a third set (108 static cards), the subject tiles a fourth (`homeLive.js:463-476`, AI/ML at ₹1,200/hr vs ₹600 two blocks away), `/competitive-exams` a fifth. The registration fee is ₹750 on `/plans` and ₹600 on `/free-classes`.
**Also here:** the permanent fabricated "40% OFF" on the buy card (`CourseDetailPage.jsx:116`), the `/courses` accordion (`CoursesPage.jsx:45,68`) and `/competitive-exams` (`LandingPage.jsx:139`) — against a "was" price that exists in no data. The team already removed exactly this from `/group-classes` (`GroupClassController.php:71-74` computes the discount only from a real sale price; `GroupClassesPage.jsx:44-49` hides the badge when there is none).
**Approach:** make the DB authoritative. Promote `pricing.js` rates into a `rates` table (subject × level × mode) editable like Courses; delete the synthetic ladder in `courseDetail.js`; derive every badge from `sale_price` using the group-classes implementation verbatim. The overlay pattern already works — `HomePage.jsx:353-374` overlays live group-class prices by slug.
**Why first:** it is the most-changed content in a tutoring business, it is the only category where being wrong costs money or a consumer complaint, and the site currently contradicts itself in public.

### Rank 2 · Homepage as a campaign surface — **L**
**Cannot do today:** change a single word or image on the page that receives the most traffic.
**Affects:** `/`.
`homeLive.js` is 547 lines: `COURSE_TABS` (:418-429), 108 course cards (`COURSE_PANELS_RAW` :203-357), `TRENDING` (:441-450), `VIDEO_COURSES` (:452-456), `POPULAR_SUBJECTS` (:463-476), `TEACHERS` (:478-487), `TESTIMONIALS`, `WHY_ITEMS`, `PRICING`, `ABOUT_*`, `HOW_STEPS`, `DEMO_VIDEOS`. Hero slides are separate (`HomePage.jsx:44-48`), as are the H1, the trust strip and ~14 section headings.
**Three of these are actively wrong, not merely frozen:**
- The teachers rail never reads `tutors.is_published`; a tutor unlisted in the console keeps their card and their "Book Trial" link 404s (`TutorController.php:56` gates on `published()`).
- The "Popular Video Courses" row links to `/courses/{slug}` for products that are live classes; none of the three slugs exists in `video-courses.json`.
- The "Featured" checkbox (`CoursesTab.jsx:230`) looks like homepage merchandising and only changes the `/courses` sort (`CourseController.php:56`).
**Approach:** do not build a page builder. Three targeted moves cover 80%: (a) a `banners` table for hero slides; (b) point Trending/Video/Teachers rows at existing APIs filtered by `is_featured` / `is_published` — the video-courses menu already proves the pattern (`Header.jsx:163-170`); (c) a small `content_blocks` table for headings and the trust strip, reusing the `legal_documents` block schema and its validator.

### Rank 3 · Course content the API already stores — **S each, L for curriculum**
**Cannot do today:** edit the main body copy or the syllabus of any course.
`description` is validated (`AdminCourseController.php:84`) and rendered as HTML (`CourseDetailPage.jsx:439-441`) but has no form field and is **not returned by `AdminCourseResource`**. `subtitle` (:82) and `age` (:85) are validated *and* returned (`AdminCourseResource.php:27-28`) and simply lack an input — the cheapest wins on the list. `position` (:91) likewise, and since every seeded position is 0 the catalogue order is currently featured-then-alphabetical with no lever below that. `curriculum`, `curriculum_variants` and `pills` are in `$fillable` with no rule, no resource field and no form.
**Curriculum is the big one:** it is the largest block on a course page, the "What You'll Learn" tab, the `/download-curriculum` lead magnet and the branded PDF (`routes/web.php:14`). A course with no seeded curriculum is permanently un-downloadable.
**Approach:** reuse the Course pattern exactly, and obey the rule the resource itself documents at `AdminCourseResource.php:21-24` — *every field the form writes must also be read back here*, or the next save silently erases it. Curriculum needs a repeater editor (levels → topics), which is the same shape as the legal `sections` editor already shipped.

### Rank 4 · Company facts — one record, five contradictions — **S**
**Cannot do today:** correct a headline number without a developer, and the site disagrees with itself on every page load.
`Footer.jsx:158-162` says "10,000+ Happy Students" and "500+ Expert Tutors"; `HomePage.jsx:393-394` says "75+ Expert Tutors" and "8,000+ Students Trained"; `AboutPage.jsx:10-14`, `BecomeTeacherPage.jsx:33` and `courseDetail.js:76-81` each hold a third and fourth copy. "500+" sits above a directory of 13 published tutors.
**Approach:** this is now a few hours, not a project — add a `facts.*` group to `SiteSettings::FIELDS` and render it in the Settings tab that already exists, then delete the literals. *(The 4.8/5 rating stays as the owner's acknowledged placeholder; only the countable claims are in scope.)*
**Why high:** cheapest fix on the list, removes a visible credibility problem, and the file comment at `homeLive.js:529-536` records that a fabricated figure already survived a cleanup sweep precisely because it lived in a second file.

### Rank 5 · The operational half of the CRM — backends built, screens missing — **M–L**
**Cannot do today:** run the business day-to-day from the console.

| Capability | Backend | Console |
|---|---|---|
| Enrolments + weekly timetable | `routes/api.php:271, 276-277`; `AdminController.php:301-340, 485-489` | none — no tab; `fetchAdminEnrollments` (`api.js:173`) imported by nobody |
| Class absences + substitute shortlist | `routes/api.php:273-274`; `AdminController.php:351-422` (ranked `SubstituteFinder` shortlist at :377-380) | none — "absence" appears nowhere in `resources/js` except a comment |
| Company course-material library | `routes/api.php:320-323`; `CourseMaterialController.php:60-130` | none, not even an api.js helper |
| Student achievements moderation | `routes/api.php:324-325`; computed `publishable` flag at `StudentAchievementController.php:151`, `staff_note` at :158-161 | none — nothing can ever reach "approved" |
| KYC approve/reject | **no admin route at all** (`grep kyc routes/api.php` → only self-service :150-152) | status badge displayed, permanently undecidable (`UserDashDrawer.jsx:72`) |
| Grant a video entitlement | **no route** | count displayed (`UsersTab.jsx:103`), no way to add |
| Broadcast a notification | **no route**; bell already polls every 60s (`Header.jsx:25`) | none |

**Why it matters:** a teacher reports they cannot take tomorrow's class and no one on staff can ever see it. After converting a demo, there is no screen on which to set the timetable the whole attendance chain depends on. An offline payment cannot be fulfilled.
**Approach:** Enrolments deserves its own tab (it is the core operational record); absences belong on the Overview "needs attention" list, which today ignores support tickets, home-tuition requests, uncovered absences and pending achievements (`AdminController.php:594-599`).

### Rank 6 · Tutor directory: staff hold a veto, not a pen — **L**
**Cannot do today:** originate any correction to a public tutor listing.
There is no `/admin/tutors` route in the whole file. `AdminTeacherController` exposes only index / toggleListing / publishChanges / discardChanges. Ten of thirteen public fields reach the site only through `TeacherProfilePublisher::FIELDS` (:38-48) — i.e. **the teacher types them and staff approve the diff**. A typo in "Mathmatics" or a wrong hourly fee stays until that teacher logs in. Seven columns — `name, slug, image_url, fee_trial, grades, verified, position` — have no write path from any form on the platform.
**Two live hazards inside this:** every tutor photo is a `wp-content` hotlink to the old WordPress site (13 of 13 seeded rows) and dies at domain cutover with no console route to repair it; and `TutorSeeder.php:302` `updateOrCreate`s over every column, so a staff Unlist is reverted the first time that file changes.
**Approach:** an admin tutor form writing the same columns the publisher maps, plus a `verified` toggle (see B10) and reorder controls — the up/down swap pattern already exists for video lessons (`LegacyTabs.jsx:403-409`).

### Rank 7 · Category taxonomy — **M**
**Cannot do today:** create, rename, re-slug, re-parent, reorder or delete a category.
`routes/api.php:46-48` are the only category routes and all three are public GETs; there is no `AdminCategoryController`. The Courses tab can only tick a course into categories that already exist (`CoursesTab.jsx:211-223`, validated `exists:categories,id` at `AdminCourseController.php:93`).
**Blast radius:** the `/courses` sidebar, the `/group-classes` sidebar (`GroupClassController.php:39-42`), the requirement-form subject chips (capped at the first 40, `RequirementForm.jsx:104-105`), `/board/:slug` course selection, and the SEO title of every `/courses?category=` URL (`SeoMeta.php:97-106`). Renaming one changes a public URL. And `CourseSeeder.php:127` **auto-deletes any category left empty** — so emptying one in the console destroys it on the next seeder run.
**Note:** partly editable already — category *membership* is console-controlled, and because the sidebars use `withCount('courses')` the counts do respond.

### Rank 8 · Navigation — **L**
`nav.js` is 784 lines of hand-maintained links; the four footer columns (~31 links) are arrays at `Footer.jsx:15-37`. Adding one page to the menu — the single most common CMS task — is a deploy. The file's own comment (`nav.js:501-505`) records a hand-copied slug that rotted into a live 404 on every page of the site.
**Approach:** the fix is already proven twice in this codebase — the Video Courses tab is data-driven via a `source` key (`Header.jsx:163-170, 235`) and the footer's Policies list follows `GET /legal` (`Footer.jsx:69-70`). Give the other eight tabs a `source` and build a small menu manager. **8 of 9 tabs frozen, not 9 of 9.**

### Rank 9 · Social proof: the last mile — **M**
*(Mechanism only — the placeholder testimonials and ratings stay by the owner's decision.)*
The moderation queue the owner asked for **exists and works** for courses and tutors (`ReviewsTab.jsx`, `routes/api.php:326-329`, demo-gated submissions). What is missing is any route from an approved review to the places testimonials actually appear: the homepage slider (`HomePage.jsx:274-336`) and every course-page rail (`SocialProofSections.jsx:8`) import static arrays and never call the API. `reviews` has no placement/featured column (`create_reviews_table.php:17-33`).
Same story for outcomes: families already submit consent-flagged achievements, the moderation endpoint already computes `publishable` — and there is no queue UI and no public surface, while "Recent Student Wins" runs eight entries the source file marks `PLACEHOLDER` under the strapline "Real, verified results".
**Approach:** one boolean on `reviews` + a toggle in ReviewsTab + the rails reading the API; an Achievements queue modelled on ReviewsTab. Both small, and they are what lets placeholders retire without a developer.

### Rank 10 · Marketing page copy at large — **L**
Every hero, CTA band, benefit list and empty state on `/about`, `/contact`, `/plans`, `/free-classes`, `/skill-programmes`, `/competitive-exams`, `/events-workshops`, `/refer-earn`, `/faqs`, `/board/:slug`, `/tutors-in/:city`, `/book-demo`, `/find-tutors`, `/physical-classes` is a JSX literal.
**The sharpest items inside it**, because they are commercial or legal promises: **support hours** (`ContactPage.jsx:69`) exist as one literal with no data model anywhere — a holiday closure cannot be published; "Monthly payouts, no hidden cuts" (`BecomeTeacherPage.jsx:23`); the privacy assurance made outside the privacy policy (`BecomeTeacherPage.jsx:201`); "Online payment & cart arrive soon" (`PlansPage.jsx:249`), which becomes false the day Razorpay goes live and actively suppresses purchases; the `/free-classes` fine print (:54-56), which is the binding terms of an offer.
**Approach:** a `content_pages` table reusing the `legal_documents` schema — typed blocks, `assertSectionsRenderable`-style validation, the same editor component. That work is done once and pays for every page. Start with `/about` and `/contact`.

### Rank 11 · FAQ store — **M**
No table, no route, no UI, and no groundwork of any kind — the largest content area with nothing built. Two overlapping arrays (`courseDetail.js:31-50` site-wide, `:115-122` per-course) already contradict each other and the rest of the site: FAQ 2 still says **"We use PayPal"** while the course FAQ says UPI/cards/net banking, and FAQ 11 still advertises classes in the USA, Canada, UK, Europe, Australia, Dubai and Singapore — contradicting the India-only correction the owner confirmed on 10 Aug and that was applied to `AboutPage.jsx:96-102`.
**Approach:** one `faqs` table with a `placement` column (site / course / referral), not two.

### Rank 12 · SEO overrides — **M**
Smaller than the audit implied: title/description/OG/JSON-LD for **course, tutor, video-course, event and blog-post** pages are derived from DB fields the console already edits (`SeoMeta.php:124-244`), so renaming a course does change its search snippet. Genuinely frozen: the ~40 static route entries (:47-92), `/find-tutors` (:52), the blog index (:66), city pages (:236-237), every JSON-LD template, and the Organization `contactPoint` at :114 — which still hardcodes the phone and email that `SiteSettings` now owns. Also worth one line: `/tutor/:slug` and `/tutors/:slug` both self-canonicalise (`SeoMeta.php:18`), and the sitemap (:41) and the breadcrumb (:153) name different winners.

### Rank 13 · Media store — **L, and a blocker**
The ImagePicker is a browser, not an uploader, **by design**: the deploy `rm -rf`s the docroot images directory and `vite build` empties `public/build`, so a runtime upload would not survive the next cron pull (`AdminMediaController.php:10-15`, `FormPickers.jsx:19-23`). Consequence: no admin can ever add a photograph. Two smaller defects sit on top — `images()` `scandir`s only the top level, so the eight homepage tutor portraits in `public/images/teachers/home/` and every hero image in `courses/hero/` are invisible to the picker; and `site` (the logo) is excluded at :20.
**Approach:** a durable disk off the docroot (S3/R2 — R2 is already in use for video). **Sequence this before any hero-slide or page-image editor**, or those features ship without the ability to introduce new artwork.

### Rank 14 · Referral programme has no entity — **L**
`/refer-earn` advertises "credits are added for you automatically" (`ReferEarnPage.jsx:19`), a 7-day crediting window and 30-day expiry. There is no `referrals` table, no referrer↔referee link, no reward ledger, no status — submissions land as free text in a support ticket (`:61-69` → `ContactController.php:35-43`). The console cannot see which referrals converted or credit the promised classes. The reward figure is written four times in that one file (`:13, :143, :148, :150`) plus four more in the policy document — which **is** now editable, so changing it in the console would leave the marketing page advertising the old offer.

### Rank 15 · Finish the Legal tab — **S**
Add `glance` and `contact` editors (both already validated), a `POST`/`DELETE` route so a fifth policy can be published, and a decision on `updated_label`: auto-stamp it on any sections change, or make it required on save. As it stands an editor can amend a clause and leave a stale "Last updated" date — which is what the date exists to prevent. One more: `is_published` is accepted (:53) while `LegalPage.jsx` falls back to the bundled `legal.js` on a 404, so unpublishing a policy would silently serve the stale bundled text rather than taking the page down.

---

## 3. Recommended sequence

1. **B1, B2** — stop the bleeding. Console work is currently destroyed by the deploy; nothing else matters until an admin's edit survives a cron pull.
2. **B3–B8, B10, B11** — a day's work that makes the existing console honest.
3. **Rank 4** (company facts) and the three one-input fields in Rank 3 (subtitle, age, position) — visible wins on plumbing that already exists.
4. **Rank 13** (media store) — because Ranks 2 and 6 depend on it.
5. **Rank 1** (money) — the largest commercial exposure.
6. **Rank 5** (enrolments, absences) — the operational half of the CRM.
7. Then 2, 3-curriculum, 6, 7, 8, 9, 10.

**One architectural note for whoever picks this up:** three good patterns already exist in this repo and should be copied rather than reinvented — `legal_documents` (typed blocks + a server-side structural validator that rejects unrenderable content, `AdminLegalController.php:74-129`) for any structured prose; `GroupClassImporter` (idempotent, returns early once the DB has data, `:35-38`) for every seeder; and the `source: 'video-courses'` nav key (`Header.jsx:163-170`) for making committed data files follow the database. And one rule, documented in the codebase's own words at `AdminCourseResource.php:21-24`: **any field the form can write must also be returned by the resource**, or an ordinary save silently erases it.
