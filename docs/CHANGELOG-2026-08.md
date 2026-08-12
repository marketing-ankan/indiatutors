# IndiaTutors Online — work log

Running record of what changed, why, and what is still open. Committed to the
repo, so it travels to Hostinger with every deploy and is present locally —
`docs/CHANGELOG-2026-08.md` on all three.

Newest first. Each entry says what was **verified**, not just what was written,
because several things in this codebase look finished and are not.

---

## 12 August 2026

### Admin forms: image picker and category dropdown
Two fields in the Staff Console expected the operator to know a value by heart.

- **Thumbnail** was a free-text path. A typo rendered a broken image with no
  error anywhere. It is now a **picker over the 147 images the site actually
  ships**, with search and a live preview. New endpoint `GET /api/admin/media/images`
  scans `public/images/{courses,home,workshops,teachers,news,achievements}` and
  returns the `/build/images/...` paths that actually resolve.
- **Category** was free text, so "IT Technologies" and "IT technologies" became
  two categories that filtered as different things. It is now a dropdown of the
  **104 existing categories**. An existing value that is not in the list is kept
  and labelled, so opening an old record and saving it cannot silently retag it.

Both live in `resources/js/components/admin/FormPickers.jsx` as shared controls,
because the group-classes work and the planned LMS will want the same two.

**Deliberately not an uploader.** The deploy does `rm -rf` on the docroot images
directory before re-copying it, and `vite build` empties `public/build`, so a
file written at runtime is destroyed by the next cron pull. New artwork is
committed to `public/images/` and appears in the picker automatically.

*Verified:* endpoint returns 147 images correctly grouped; the form shows a
104-option dropdown with the current value preserved; searching "python" narrows
the grid to 2; picking one stored
`/build/images/courses/python-programming-for-beginners.webp` and it came back
through the public API. Test edit reverted.

### Lists now say the request failed, instead of "there are none"
Every list fell through to its empty-state copy when the request errored, so a
backend hiccup told visitors we sell no video courses, no courses, have no
tutors. One `ListLoadError` component now covers `/video-courses`, `/courses`
and `/find-tutors`, naming what failed and offering a retry.

*Verified with the backend actually stopped* — all three showed the error and
retry, none showed their false empty state.

**Testing note that cost two false results:** with the server down the service
worker serves the cached `/` shell, which keeps pointing at whatever bundle was
current when it was last cached. A fresh build appears not to work until you
load `/` once with the server **up**, then stop it. The tell is the page title
reverting to the generic homepage one.

### Video course menu is data-driven
The header's VIDEO COURSES dropdown listed three hand-copied names, and one had
already drifted: it pointed at `ncert-class-10-maths-video`, which does not
exist in production — **a live 404** for anyone who clicked it. It now reads the
published courses. Renaming a course in the console changes the menu with no
reload, because the console already invalidates that cache key.

`(videoCourses ?? [])` is load-bearing: `CatalogTab` dereferences
`item.items.length` unguarded, so an undefined during the in-flight request
would white-screen the header on **every** route, checkout included.

### Mobile menu opens the catalog tabs
The burger menu flattened every catalog tab to its top-level link, so the video
courses, 12 Events & Workshops entries, 7 Free Classes and 6 Competitive Exams
pages had **no route in on a phone** — desktop only. Four tabs now expand. "Our
Courses" (108 destinations) and "Group Classes" stay plain links on purpose.

### Admin video-course fields
`thumbnail_url`, `position` and `is_published` were all validated server-side and
rendered publicly but had **no input** — the columns were unsettable except by
SQL. Added. Also relaxed `thumbnail_url` from `url` to `string`: as `url` it
rejected the site's own `/build/images/...` convention, and since the form saves
the whole row, one relative path would have made every later save 422 with an
error the form had no field to correct.

### Video lessons: paste a link, and never sell a YouTube lesson
The lesson form asked for a YouTube **id**, so pasting a normal watch URL stored
it verbatim and the lesson silently never played. `App\Support\VideoSource` now
parses watch / youtu.be / embed / shorts / live / bare-id forms.

`provider=youtube` now **forces `is_preview=true`**, on update as well as create.
A YouTube video is public to anyone holding its id — unlisted is not private —
so a paid lesson hosted there would give the course away. Forcing on update too
closes the two-step version (save as preview, flip the flag after).

*Verified against the running API:* a URL with `&t=42s` stored as the bare id; a
lesson posted with `is_preview=false` came back free; the same flip over PATCH
stayed free; an uploaded (r2) lesson stayed paid; a non-YouTube link 422'd.

### Accounts: add an email, then remove the old one
Email was read-only ("Contact us to change the email") because there is no SMTP
to verify a new address with. An account now holds several addresses: you **add**
one, make it main, then remove the old. **Any address on the account signs in**,
so both work during the changeover and a typo cannot strand anyone.

All three actions require the current password — otherwise anyone holding a live
session could attach their own address and keep signing in after the real owner
changed their password.

### Teacher logins for the already-listed teachers
The 13 teachers listed before accounts existed had a public profile and no way
in; `tutors.user_id` was NULL and the tutors table has **no email column**, so
there was no identity to derive one from.

- `teachers:provision` (artisan) and a **Staff Console → Teachers** button both
  run `App\Support\TeacherAccountProvisioner`, so they cannot drift.
- One account per teacher, each with **its own random password** — never a shared
  one. The command writes them to a file; the button shows them once, because a
  file on the server is no use to an owner who cannot reach a shell.
- The private profile is seeded **from the public listing**, so a teacher's first
  sign-in shows their real details rather than a blank form they might save over.
- The audit entry records the address and **never** the password.

### Duplicate-profile bug, fixed before it could bite
Publishing a teacher looked up `$user->tutor()`, found nothing for the seeded
rows, and **created a second listing** (`angeline-2`) while the original — the
one parents visit and search engines index — was orphaned. That would have
happened on day one of handing out logins. It now claims the existing listing,
keeping the row **and its slug**, and only when exactly one unclaimed listing
carries that name; on any ambiguity it declines rather than risk attaching the
wrong person to someone else's public page.

Found while testing it: `payload()` copied null profile fields into columns that
are NOT NULL, so publishing a profile that had not been filled in threw an
integrity violation on **both** the create and update paths — approving a teacher
who registered but never completed their profile has been 500-ing. Fixed.

### Layout and accessibility
- Four pages capped their own width (book-demo at **672px** on any monitor);
  now full-bleed. The demo form's four fixed two-field rows became one flowing
  grid, 1 → 2 → 3 → 4 columns, so fields multiply instead of stretching.
- `/courses` could not render below **511px** — every phone got ~150px of
  horizontal scroll on the catalogue. Grid items default to `min-width:auto`;
  `[&>*]:min-w-0` fixed it. Confirmed pre-existing, not introduced.
- Tutor profile "Book a Trial Class" and "Schedule Online Session" were anchors
  to a form at the page bottom; the enquiry recorded the chosen teacher only as
  prose. They now go to `/book-demo?tutor={slug}`, which stores
  `requested_tutor_id`.
- Hero search box and footer newsletter field had no accessible name. The hero
  form had `role="search"` and a label, but that names the *landmark*, not the
  field. Zero unnamed controls remain on the home page.
- Both carousels can now be paused (WCAG 2.2.2), with a visible control rather
  than hover-only — hover does nothing for someone simply reading.

### India-only sweep completed
The marketing site had been swept, but the **legal documents had not**. Removed
three printed dollar figures, five claims that a USD price is displayed, "serves
students across India **and abroad**", and the overseas-bank-charges pointer.
**Kept** all GDPR/data-protection provisions, per the owner's instruction, plus
the EU/UK cooling-off notice — removing the *notice* does not remove the
*obligation*, and failing to give it extends the withdrawal window to 12 months.

Deleting the refund policy's overseas section wholesale would have destroyed the
**Consumer Protection Act 2019 saving clause nested inside it** — stripping an
Indian customer of a protection during an India-only cleanup.

Also: checkout no longer offers foreign countries (pinned in the form **and**
server-side, since `/api/orders` is public), and the unreachable USD pricing data
was deleted — 96 `usd` arrays, 96 `usdG`, `regFee.USD` and the 20-entry
`countries` list. Prices verified identical before and after, on both the 1-to-1
and group paths.

### Registered entity named
`ENTITY` was the brand, not a legal person, with a TODO beside it. Now
**Indiatutors Online LLP** across all 14 slots in the four policies. The
E-Commerce Rules require the legal name and principal address to be displayed.

### Group classes moved onto the database, and the blog became publishable

`/group-classes` read a **committed JSON file**, so the 19 cards — prices,
descriptions, schedules — could not be changed without a developer and a deploy.
They are now `Course` rows behind an `is_group` flag, edited in the Staff Console
like any other course, with their levels ("Beginner / Intermediate / Advanced")
as `course_batches`.

Verified end to end: edited a group class in the console, and the change appeared
on the public page. 19 cards, 57 batches, 5 sidebar filters, no horizontal
overflow from 360px to 2560px.

What deliberately did **not** come across is every invented figure: the
"119 Batches done" and "16 Ongoing" chips, the 57 per-level student counts, and
the 19 strike-through prices with their "40% OFF" badges. Those numbers existed
nowhere but the JSON file. The fields exist and are blank; each chip renders only
once a real number is typed, and the discount badge is now **computed** from the
actual sale price, so it cannot claim a saving that is not being given.

The badge and the counters remain the owner decisions recorded below — the
difference is that answering them is now a typing job, not a code change.

**The homepage had a second, independent copy of the same 19 cards.** Its prices
are now overlaid from the same endpoint, so editing a price cannot update
`/group-classes` and leave the homepage quoting the old figure. Layout, blurbs
and sub-tabs there are still static.

**Blog publishing** was added to the Content tab. The `Post` model, the API and
the public `/blog` pages all already existed; the only missing piece was any way
to write one without a database client, so the blog was frozen at whatever the
seeder inserted. Drafts stay private, publishing stamps the date once, and
unpublishing to fix a typo and republishing does not move the post in the feed.
Slugs are permanent, and every action is recorded in the audit log with the
actor. All verified against a running server.

### A silent data-loss bug in the course editor

Opening any course in the console and pressing **Save changes** wiped its short
description. The admin API never returned `short_description`, so the edit form
loaded it as empty and saved that empty value back — no error, no warning, the
text simply gone. Reproduced, then fixed by returning every field the form can
write. Confirmed: the description now survives a save.

Two further traps were found and closed before they could ship:

- The migration imported the group data from the JSON file **that the same commit
  deleted**, and a missing file returned quietly — production would have migrated
  cleanly and served an empty `/group-classes` with nothing in any log. The seed
  data now lives in `database/data/`, where a frontend refactor cannot reach it.
- On a **fresh** install the import produced nothing, because `migrate:fresh`
  runs every migration before the first seeder, so the catalogue was empty when
  the import looked for courses to match. Now covered by `GroupClassSeeder`,
  running after `CourseSeeder`. Proved on a scratch database: 0 → 19 courses and
  57 batches, and re-running it adds nothing.

### The policy pages and the site's contact details became editable

Two more pieces of the site that could only be changed by a developer.

**The four policies** — Terms, Payment & Refund, Refer & Earn, Privacy — were
158KB of JavaScript compiled into the frontend bundle. Correcting a refund window
meant a code change, a build and a deploy. They are now database records edited
in a new **Settings** tab, section by section, with all seven content types the
pages use (paragraphs, bulleted and numbered lists, callouts, definition tables,
data tables and step lists).

Nothing was retyped and nothing was reformatted. The content was exported
programmatically and the page renders it through the *same* renderer as before —
verified by comparing all four documents field by field against the shipped
version: **byte-identical**, 58 sections, 81 subsections, 286 blocks.

Two safeguards, because these are the documents a customer is told to read
before paying:

- The bundled copy stays in the app as a **fallback**. Proved by making the API
  return 404 for a document: the page still rendered all 20 sections and 7,300
  words. A backend problem cannot blank a policy page.
- The API **rejects content the page could not draw**. Its renderer silently
  skips a block it does not recognise, so a typo could have dropped a clause out
  of a live policy with no error anywhere. A bad block type, a missing heading, an
  empty list or a table row that does not match its header is now refused with a
  message naming the section.

**Site details** — the phone number, email, address, footer description and six
social links were hardcoded in three components *and* repeated throughout the
policy text. All are now in the Settings tab and take effect immediately in the
header and footer. The registered entity name is a single setting substituted
into the policies wherever the legal name appears, so it stays correct in all 14
places at once.

Every field falls back to the value that was hardcoded, so this shipped without
changing a single thing on the site until someone edits it. Clearing a social
link hides its icon; clearing a contact field hides that line.

---

## Open — needs an owner decision

| Item | What is needed |
|---|---|
| **"40% OFF" badge** | The struck-through price is back-calculated (`price / 0.6`) and was never charged. Textbook misleading advertisement under Indian consumer rules. Confirm a real original price, or the badge goes. |
| **Group-class counters** | "119 Batches done", "16 Ongoing", 57 student counts, 19 strike-through prices — all invented, all frozen. Recommendation: keep the fields, ship them empty, hide each chip when blank. |
| **Testimonials / ratings** | Owner decided 2026-08-11 to keep as-is until real ones arrive via an admin moderation queue. **Not a defect — do not re-raise.** |
| **Legal docs vs overseas** | The policies still grant GDPR rights (deliberate). If overseas service is genuinely never happening, counsel should confirm the remaining EU/UK clauses. |
| **"Schedule Online Session"** | Reaches the same flow as "Book a Trial Class". There is no paid-ongoing booking type, so the two labels promise a distinction the system does not make. |

## Open — engineering, no decision needed

- ~~**Group classes are static.**~~ **Done** — see above. `/free-classes` is still
  three entries hardcoded in `FreeClassesPage.jsx`, one of them ("Hand Writing")
  with no matching course, so its link goes nowhere. Same treatment applies.
- **The homepage group cards are only half dynamic.** Prices come from the
  database; the titles, blurbs, feature bullets and sub-tabs are still the static
  list in `homeLive.js`. Adding a group class in the console puts it on
  `/group-classes` but **not** on the homepage.
- **`CourseSeeder` overwrites admin edits.** It `updateOrCreate`s name, price,
  description, image and position from `courses.json`, and forces
  `is_published => true` — so **unpublishing a course does not stick**. Gated on a
  content fingerprint, so it only fires when `courses.json` or the seeder changes.
  New columns it does not list are safe, which is why the group work can still
  ride on Course.
- **No test coverage on the paid-video gate.** Nothing pins "locked lesson ⇒ 403".
  `phpunit` is not in the committed vendor directory.
- **Orphaned R2 objects**: deleting a lesson removes the row, not the file.

## Blocked on credentials

| Needs | Effect until supplied |
|---|---|
| Cloudflare R2 keys | Uploaded lesson files cannot play. The `.env` block here is a **localhost test stub flagged for removal before deploy** — if it reaches production, paid lessons yield an unplayable URL instead of a clean "being prepared". |
| Razorpay keys | No automatic unlock on payment. Staff marking an order paid in the admin does grant access today. |
| `INSTAGRAM_ACCESS_TOKEN` | The feed shows placeholder tiles. Adding it to the production `.env` is enough — the deploy runs `config:cache` every pull. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | If unset in the production `.env`, **no admin account exists at all**. The seeder deliberately refuses to create a default-password admin. |

---

## Notes for whoever works on this next

- **The deploy has a blank-page window.** Every frontend push costs ~3–5 minutes
  where the served shell references a bundle that has not been copied yet. Batch
  frontend changes into one push. PHP-only changes have no window.
- **Watch a deploy land** by polling until the HTML's `main-*.js` and that asset
  both resolve. The shell advances first; a 404 on the asset mid-window is
  expected, not a broken deploy.
- **`public/images` is the source**, `public/build` is generated — `vite build`
  wipes it. Never edit anything under `public/build`.
- **A stale service worker will make your change look unapplied.** Compare the
  `<script src>` against `public/build/manifest.json` before debugging anything.
- **CSS transitions do not advance when the browser pane is not compositing**, so
  `getComputedStyle` reports animated properties pinned at their start value.
  Settle with `el.getAnimations().forEach(a => a.finish())` before measuring.
- **Sweep 360→2560px before deploying any UI change** — owner mandate, and 768
  and 1024 in particular have caught real breakage.
- **The `:803x` preview servers run on SQLite**, not the MySQL in `.env` — see
  `.claude/launch.json`. An API token minted with plain `artisan tinker` goes into
  MySQL and the preview server rejects it as unauthenticated. Pass
  `DB_CONNECTION=sqlite DB_DATABASE=storage/app/preview.sqlite` when setting up
  data for anything served on those ports.
- **Anything the console's edit form writes must also be returned by its API
  resource.** A field the form can save but cannot read back loads as empty and
  is silently erased on the next save — this is how the course descriptions were
  being wiped.
- **A migration must never read a file outside `database/`.** Frontend data files
  get deleted by the very refactors that motivate the migration, and a
  quietly-skipped import fails invisibly in production.
- **Policy pages are deliberately not unpublishable from the console.** The
  column exists and the public API honours it, but no toggle is offered: there is
  no legitimate state where the footer of every page links a Terms page that
  404s, and because the frontend falls back to its bundled copy, "unpublished"
  would look like "still there" anyway.
- **Seeding that matches existing rows cannot live only in a migration.**
  `migrate:fresh --seed` runs all migrations before the first seeder, so the
  table it wants to match against is still empty.
