# Ecosystem Plan — Demo → Review → Ranking flywheel

Source: the founder's handwritten system page, walked through by the owner on **2026-08-07**.

**What this document is.** The page describes how the *whole* ecosystem works — this website plus the
other web applications around it (WinQuest for materials, the coordinator/leads side). It is not a
website-only spec. This file records the whole system so nothing is lost, then marks which parts are
**for this repo** and which belong elsewhere.

**Standing instruction (2026-08-07):** the owner is no longer working on the LMS. Everything the page
routes "through the LMS" is therefore read as *belongs on this website*, unless the owner says
otherwise item by item.

**How to use this file.** Nothing here is marked done on my own initiative. Items move to ✅ **only
when the owner says to mark them**, one at a time, and we then move to the next point.

Legend: ⬜ not started · 🔨 in progress · ✅ done (owner-confirmed) · 🚫 not this repo · ❓ needs a decision

---

## Build sequence — and why this order

Agreed 2026-08-07. The order is not the order the page is written in, for one reason:

> **A ranking is worthless on the day it ships.** With zero reviews and zero recorded conversions it
> ranks nothing. So the parts that *collect* the signals must ship first and start accruing data while
> the rest is being built. By the time the ranking exists it has months of history to rank on.

**Stage 1 — the demo lifecycle** (C3, B3) — ✅ **done 2026-08-07** (`cb5ca16`)
Everything downstream keys off two facts this stage establishes: **did the demo actually happen**, and
**which teacher did the student choose**. Reviews gate on the first; conversion rate and ranking need
both. Today's four statuses (new/scheduled/converted/closed) cannot express "completed but not
converted", so a review gate and an honest conversion rate are both impossible until this lands.

**Stage 2 — collect the two signals** (D1 reviews, D2 conversion) — ✅ **done 2026-08-10** (`6af9625`)
Shipped early precisely because they need *time*, not because they're urgent. Every demo that happens
from this point forward becomes ranking data.

**Stage 3 — rank and surface it** (D3 + D3a, D5, B1, B2) — ✅ **done 2026-08-10** (`f01f28e`)
*A2 moved to Stage 4: the profile now shows real reviews, but the media that makes it worth
visiting — the intro video — is blocked on R2 keys and belongs with the other media work.*
Now there is something to rank. The suggestion engine already exists (`TeacherMatcher`); this stage
adds the ranking term and turns the staff-only shortlist into the student-facing one.

**Stage 4 — coordination and media** (C1 + C1a, C2, C4, A2, A3, A4, A1, D4) ← *in progress*
The human workflow around the demo, and the profile media that makes a profile worth viewing.
A1 stays last in this stage because it is blocked on R2 keys regardless.

**Stage 5 — independent tracks** (E student offering, F AI tutor player)
Neither blocks the flywheel; both can run in parallel or later. F is effectively its own project.

---

## The core loop

```
student searches → teacher suggestions → views teacher profile → books demo (= the lead)
      ↑                                                                      ↓
      │                                                        coordinator schedules the demo
 teacher ranking                                                            ↓
      ↑                                                              demo happens
      │                                                                     ↓
 reviews (5★, only after a successful demo)  ←──────────────────────────────┤
 conversion rate (demo → regular enrolment) ←───────────────────────────────┘
```

Two independent signals feed the ranking: what students **say** (reviews) and what students **do**
(conversion). The review gate — only after a completed demo — is what keeps the first signal honest.

---

## A. Teacher profile & approval

- ⬜ **A1. Teacher profile video.** Recorded/uploaded at profile creation, published **only after admin
  approval**. Shown on the public teacher profile.
  *Blocked on R2 keys (same storage as video courses).*
- ✅ **A2. Public teacher profile page — full version.** *Owner-confirmed 2026-08-10.*
  Qualifications, timetable / time availability, reviews.
  **The timetable was the missing piece** — the section showed mode, city and areas but no *times*.
  Published from the STRUCTURED weekly slots (weekday + start + end) the home-tuition intake already
  captures, not `teacher_profiles.availability` (the old free-text `{days, slots}`): the grid that
  replaced that box says why in its own comment — "5-8pm weekdays" cannot be intersected by any booking
  flow, so publishing it would put times on a public page nothing can honour.
  A teacher with no slots shows **no section at all** — an invented timetable is worse than none — and
  the same for a paused teacher, or one who has declared a break.
  Rating summary also surfaced in the hero, sharing one cache key with the reviews section so the two
  can never disagree.
  **Deliberately NOT shipped: ranking position on the public profile.** A public rank is gameable and
  turns a quiet month into a visible demotion; the score exists to *order* lists, not to be printed
  beside someone's name. Ask if you want it.
  *Still outstanding: testimonials (D4, needs consent decisions) and the intro video (A1, needs R2).*
- ✅ **A3. Teacher details capture — WinQuest parity.** *Owner-confirmed 2026-08-10 · commit `1bf33e5`.*
  All locations served + availability + time.
  **Fixed a silent data bug found here:** `linkTutor` copied a profile into the public `tutors` row
  exactly once, at approval, and returned early forever after; `updateMine` wrote only to
  `teacher_profiles`. So every public listing was frozen at its approval-day snapshot. Demonstrated on
  the preview DB: a teacher raised their fee from ₹800 to ₹1500 and the public page kept quoting ₹800.
  Nobody notices stale-but-plausible data, and families are quoted from it.
  One `App\Support\TeacherProfilePublisher` now owns the profile → listing mapping, so the create and
  update paths cannot drift. `verified`, `is_published` and `slug` are deliberately NOT publishable
  from a profile — they are claims the platform makes, not fields a teacher fills in.
  *Still thin: the directory has no structured availability/time. `physical_teaching_profiles` has the
  rich version (geocoded, radius, slot table); the `tutors` row carries only a comma string.*
- ✅ **A4. Admin approval gate for profile content.** *Owner-confirmed 2026-08-10 · commit `1bf33e5`.*
  Reviewed before it goes public. An approved teacher's edits mark the
  profile for review (`changes_submitted_at`) and reach the public listing only when staff press
  **Publish**. Staff see a field-by-field before/after — a reviewer who cannot see the change can only
  rubber-stamp it, and the fee line is the one that matters: a teacher can quietly double their rate
  and families are quoted from the public listing.
  Noise guards, so the queue stays worth reading: a no-op save creates no review item, and editing back
  to the published value clears the flag. `changes_submitted_at` / `published_at` are **not fillable**,
  so a teacher cannot mass-assign their way past the gate (verified — the attempt is ignored).
  *Media (video/photos) is A1, blocked on R2 keys, and will use this same gate.*

## B. Search → suggestion → selection (student-facing)

- ✅ **B1. Student-facing teacher suggestions.** *Owner-confirmed 2026-08-10 · commit `f01f28e`.*
  The ranked shortlist now appears **inside the booking flow**, matching the page's own drawing of the
  journey (search → suggestion → select → demo = the lead). `GET /api/tutors/suggestions` is public and
  carries only what helps a family choose — subjects, experience, fee, city, and the star rating real
  families left after real demos. Score, conversion rate and demo counts are absent (verified).
  New `App\Support\TutorMatcher` holds the fit scoring, shared with the Staff Console: two copies would
  drift, and the first time parent and coordinator saw different orders nobody could say which was right.
- ✅ **B2. Teacher list → profile view → select.** *Owner-confirmed 2026-08-10 · commit `f01f28e`.*
  Each shortlist card names *why* it was suggested and links to the full profile in a new tab, so a
  parent can check qualifications, availability and reviews without losing a part-filled form.
  Selecting is optional — blank still means "a coordinator will match us". Arriving from a tutor's own
  profile (`?tutor=slug`) now records that as the choice too, instead of only mentioning it in the
  message box.
- ✅ **B3. Demo booking is the lead.** *Owner-confirmed 2026-08-07 · commit `cb5ca16`.*
  `requested_tutor_id` records who the **family chose**, separate from the staff-set
  `assigned_tutor_id` — one shared column would have moved conversion credit to the wrong teacher on
  every coordinator reassignment. Captured on the public booking, gated on the tutor being published
  (an unlisted id is dropped, the lead is still saved). The console drawer shows both and flags when
  they differ.
  *Still to come in Stage 3 (B1/B2): the student-facing UI that lets them pick that teacher — the
  column and the API accept it today, the public booking form does not yet offer it.*

## C. Demo scheduling & coordination

- ✅ **C1. Teacher can contact the student after selection** — under coordinator guidance, not open
  contact. *Owner-confirmed 2026-08-10 · commit `c3cfa94`.*
- ✅ **C1a. DECIDED 2026-08-10 — nothing until a coordinator releases it.** A teacher sees the enquiry
  (subject, grade, area, proposed times) and never the phone, email or address until a human presses
  **Release contact**. Stored as `contact_released_at` + `contact_released_by`, not a boolean: when the
  question is *who gave this teacher our number, and when*, a flag cannot answer it. Withdrawal is
  possible (reassignment happens) and cannot unsee what was seen — which is why the audit row matters.
  The withholding lives in `TeacherDemoResource`, not at each call site: a field that is only safe
  because one query happened not to select it is one refactor from leaking.
- ✅ **C2. Coordinator flow for physical demos.** demo → visit → coordinate → confirmation → time slot → final.
  *Owner-confirmed 2026-08-10 · commit `c3cfa94`.* **Decided: in-app by default, phone as fallback.** Slots
  are rows (`demo_slot_proposals`), not prose in a notes box — a teacher proposes, the family accepts
  from their dashboard, and a coordinator can settle it on a call and log the result. `source` records
  which happened, because "the parent chose this" and "staff were told this on a call" are different
  facts and only one is the family's own word. Accepting is atomic: it schedules the demo, closes the
  competing offers, and stamps `scheduled_at`. Only one accepted slot may ever stand.
- ✅ **C3. Demo state machine.** *Owner-confirmed 2026-08-07 · commit `cb5ca16`.*
  `new → contacted → scheduled → completed → converted`, plus `no_show` as its own state (deliberately
  not `closed`: a no-show must not count against a teacher the way a held-but-unsold demo does).
  **`completed_at` is a timestamp, not a status lookup**, so "this demo happened" survives any later
  status change — that single fact is what D1's review gate and D2's denominator both hang on.
  Console drives it with buttons that offer only the states valid from where the demo actually is.
- ✅ **C4. Class schedule after a successful demo.** *Owner-confirmed 2026-08-10 · commit `412a392`.*
  Regular classes scheduled from the demo outcome. New `enrollment_schedules` holds the recurring weekly
  timetable (a rule — "Tuesdays at 16:00" — not dated events; those are `class_logs`). **Converting a
  demo carries its agreed time straight into the timetable**, so nobody re-negotiates a slot the family
  already agreed once; staff can edit it afterwards. Removing a class deactivates rather than deletes,
  so what a family was promised survives a timetable change.
  **Not done: a staff editor.** The API is built and tested, but the console has no enrolments surface
  at all to hang it on (only analytics counts) — that needs its own tab.
  **Known limitation: timezones.** Weekdays and times are derived in the app timezone (Asia/Kolkata).
  For an NRI family a "Tuesday 3:00 PM" class may fall on Monday evening locally. This is the existing
  site-wide convention (`scheduled_at`, class logs), not new here — but it should be fixed properly
  before the overseas audience the marketing copy claims is served in earnest.

## D. Reviews & ranking (the heart of the page)

- ✅ **D1. Teacher reviews, up to 5★, gated on a completed demo.** *Owner-confirmed 2026-08-10 ·
  commit `6af9625`.* Only a student who actually sat the demo can review that teacher.
  The gate is `reviews.demo_request_id` (UNIQUE), not a
  permission check: the demo *is* the proof, so "one review per demo" is an index rather than
  application logic that a double-submit could race, and a review can never describe a class the
  reviewer did not attend. Extends the existing `reviews` table so staff keep one moderation queue.
  Reviews still land `pending`.
  **Also killed a live lie:** `TutorProfilePage` shipped a "Write a Review" form whose submit handler
  called `setSent(true)` and stored nothing, above a hardcoded empty state that never fetched — the
  exact deceit the `reviews` table was created to end for courses, left in place for teachers.
- ✅ **D2. Conversion tracking — demo → regular enrolment.** *Owner-confirmed 2026-08-10 · commit
  `6af9625`.* The "efficiency" number.
  `App\Support\TeacherPerformance` computes it over
  **held demos only** — never all bookings, which would punish a teacher for the coordinator's
  backlog, and never counting no-shows against them. Staff-only: a conversion rate is an internal
  management number and is absent from every public endpoint (verified).
  Kept in the same class as the review gate on purpose: both must agree on *which demos count*, and a
  teacher scored on one basis but reviewed on another is a bug nobody would notice for months.
- ✅ **D3. Teacher ranking score.** *Owner-confirmed 2026-08-10 · commit `f01f28e`.* Combines review
  score + conversion rate. Applies to **online and physical** teachers alike.
  `TeacherPerformance::score()` blends conversion (0.6)
  and rating (0.4), each Bayesian-smoothed toward the platform mean. Weighted so conversion leads,
  because it is the harder signal to game: a teacher with 5.0★ from 15 reviews but 4 conversions in 40
  demos scores **46**, below a quiet closer at 28/40 with no reviews at all (**69.7**). The score
  orders lists and is never shown to a family — it is not a grade to publish beside someone's name.
- ✅ **D3a. Decision: low-volume protection.** One demo converted = "100%" would outrank a veteran at
  60% over 50 demos. Needed a minimum-demo floor or smoothing — founder's call on which.
  **DECIDED 2026-08-10 — smooth toward the platform average.** Ranking everyone from day one, rather
  than parking newcomers at the bottom, because last place is self-fulfilling: no bookings → no demos
  → never leaves last place, and the roster freezes. Implemented as Bayesian shrinkage
  (`PRIOR_DEMOS = 5`, `PRIOR_REVIEWS = 3`). A 1-for-1 newcomer scores **57.5**, below a 60% veteran at
  **69.9** — the protection the decision was for.
  Displayed figures keep the stricter rule: `conversion_rate` is still withheld below
  `MIN_DEMOS_FOR_RATE = 5` and the console shows raw "4/7 demos". Smoothing decides *order*; it never
  puts an invented percentage in front of a human.
  **A second guard was needed and added:** the mean itself must be earned. With one 5★ review sitewide,
  the "average rating" was 5.0, so a teacher with *no* reviews outranked a 4.6★ veteran with twenty.
  Below `MEAN_MIN_DEMOS = 20` / `MEAN_MIN_REVIEWS = 10` the priors fall back to modest seeds (35%, 4.0)
  — a cautious assumption beats a confident one drawn from four data points.
- ⬜ **D4. Testimonials & social proof on the profile.** WhatsApp testimonials, performance photos/videos.
  *Today's testimonial arrays are placeholders. Real ones need consent — see WEBSITE-IMPROVEMENTS.md §A3.*
  **Now has a source: E7.** The owner's 2026-08-10 answer makes student-submitted achievements the
  origin of real testimonials — self-written, attributable, and consented at submission. D4 stops being
  "find some testimonials" and becomes "publish the ones E7 collects, once approved".
- ✅ **D5. Ranking feeds back into suggestions (B1).** *Owner-confirmed 2026-08-10 · commit `f01f28e`.*
  The loop is closed: reviews and conversions from held demos feed the score, the score breaks ties in
  `TutorMatcher`, and the shortlist a family sees is that ordering. **Fit still dominates** — track
  record only separates teachers who already match the subject and grade asked for, so a superb Physics
  teacher can never win a Piano enquiry on reputation alone.

## E. Student offering & retention (left column of the page)

*Explained by the owner 2026-08-10. Several of these are not what the shorthand on the page suggested —
recorded here in his own terms so the next reader does not re-guess them.*

- 🔨 **E1. Marketing — free plans + incentives.** 🚫 **Owner: "decided later" — nothing to show.**
  *Owner, 2026-08-10: "keep the buttons and options, but there will be nothing shown."* So a
  **Plans & offers** card sits on the parent dashboard holding an honest empty state, and no invented
  tier. Filling it with a plausible-looking plan is exactly the placeholder habit that had to be
  cleaned out of this site in August.
- 🔨 **E2. Backup classes — a substitute-teacher system.** *Stage 5 — built, awaiting owner sign-off.*
  *Not "extra classes for the student", which is how the two words read.* When the allotted teacher is
  not available, another teacher covers — chosen on demand and availability.
  **Owner, 2026-08-10: "substitute is for that one class only."** So it is a dated deviation
  (`class_absences`) and never touches `enrollment_schedules`; the original teacher returns next week.
  **This is the first place the platform ASSIGNS rather than suggests** — the direction change above.
  Three things make that defensible: it is scoped to one lesson (a wrong pick costs one class and
  self-corrects), `auto_assigned` + an audit row make "is the automation actually right?" answerable,
  and an empty candidate list becomes `uncovered` for a human instead of silently picking the
  least-bad option.
  A candidate must clear three gates: *can* they teach it (subject overlap — falling back to the
  original teacher's subjects, because plenty of enrolments carry no `course_id`), *are they free*
  (inside declared availability, not already teaching that slot, not absent themselves, not on a
  break), and only then *are they good* (`TeacherPerformance` breaks ties). The free-check is what
  makes it trustworthy: offering someone already teaching at 4pm is worse than offering nobody.
- 🔨 **E3 + E4. Company-provided teaching material.** *Stage 5 — built together, awaiting sign-off.*
  **One table, two audiences** (`course_materials`), because they are one artefact: the company
  publishes a PPT/PDF to a course, the teacher teaches from it, and every enrolled student gets the
  same file. Two tables would mean two upload paths and an inevitable day where the teacher is on v2
  and the class is reading v1.
  **Not `class_materials`**, which already exists and is the opposite direction: a *teacher* uploading
  to *one* enrolment. Same file shape, different owner, different lifetime.
  **Entitlement is derived, never stored.** No join table says who may read what — a learner sees the
  courses they are enrolled in, a teacher sees the courses they teach. Enrol someone and access
  appears; end the enrolment and it vanishes, with no second list to keep in step (verified: ending an
  enrolment drops the list to zero and the direct download to 403).
  Files sit on the private disk and every download re-checks entitlement, like class materials and KYC
  — a public URL would outlive the enrolment. Unpublished material is staff-only, so a half-finished
  deck cannot reach a class because someone uploaded it early.
  *Known gap: targeting is by `course_id`, so enrolments created from a free-text demo (no course) get
  no company material. Same data gap that surfaced in E2.*
- ⬜ ~~**E4. Company-provided teaching material.**~~ *Merged into E3 above — see why.*
  **The company supplies the PPT/PDF** for a given class or syllabus; the teacher teaches from it, and
  **the same file is given to the enrolled student**. So E3 and E4 are two ends of ONE artefact: one
  upload, two audiences. Build them together or they will drift into two libraries of the same file.
  *Supersedes the earlier "content source is WinQuest" note — that was my inference from the word
  "winquest" on the page, not an instruction.*
- ⬜ **E5. Terms & conditions.** *Policy pages exist; entity name still pending.*
- 🔨 **E6. Student contents — the student's own record.** *Stage 5 — built, awaiting sign-off.*
  Classes attended, hours taught, materials held, achievements. A "learning so far" summary, not a
  content library — distinct from E3, which is the material itself. Shown to the guardian and to a
  student account, from the same figures.
  **Every number is counted, never estimated.** Attendance reads `class_logs` and counts only
  `completed`: a `scheduled` row is an intention, and counting it would inflate the figure the moment a
  class is booked. Verified — 2 completed + 1 scheduled + 1 missed reads as "2 attended, 1 missed".
  `missed` is reported rather than hidden, and substitute-covered classes are surfaced, because it is
  the family's class that changed.
  This is exactly the surface where a plausible invented figure would never be challenged, and this
  project has already had to delete two sets of those.
- ⬜ **E7. Student achievements — the real testimonial engine.** *Defined 2026-08-10, and bigger than
  the page's two words suggest.*
  A place for a **student to record an achievement they credit to IndiaTutors or a teacher** — "I got
  this because of them". It doubles as the **review / testimonial** source.
  **This is the answer to D4.** The site currently shows demo testimonials plus some carried over from
  the WinQuest site; the owner's intent is that real ones replace them, sourced here.
  **Sequence, owner's words: "first integrate it in the student profile, and teacher profile will
  connect later."**
  ⚠️ **Consent is not optional here.** The August audit flagged achievement photos of identifiable
  minors reused from a sister brand. Anything built for E7 must capture explicit publish-consent at
  submission and default to private.
- ⬜ **E8. Certification.** Certificates for **some** courses. 🚫 **Owner: "we haven't decided about
  certification"** — which courses, and what the certificate asserts, are open.
  Same treatment as E1: a **Certificates** card exists on both the parent and student dashboards with
  an empty state, so the place is reserved without asserting a credential nobody has defined.
- ⬜ **E9. 25% online allowance — a TEACHER entitlement, not a student club.**
  The page's "Club — 25% online class" is not a membership tier. A teacher who normally teaches
  **offline/physical** classes may take a class **online** when they cannot attend in person, capped at
  **25% of the classes they are required to take**. The owner's words: *"something like leaves, but not
  exactly leaves."* So it is a per-teacher quota measured against their own class obligation, spent one
  class at a time.
  **Owner, 2026-08-10: the period is PER CALENDAR MONTH.** *Stage 5 — built, awaiting sign-off.*
  Shares the `class_absences` trigger with E2, because both answer the same event ("I cannot take this
  class") with different resolutions.
  **The denominator is the obligation, not the attendance** — computed from the standing timetable, not
  `class_logs`. Counting what actually happened would make the allowance shrink each time it is spent:
  take a class online, teach one fewer in person, and the 25% ceiling drops with it.
  Only teachers who visit homes are eligible; an online-only teacher has no travel to be relieved of,
  so the option is never offered rather than offered and then confusingly refused.

## F. Video courses — AI tutor player (bottom of the page)

- 🔨 **F1. AI assistant.** *Owner supplied the key 2026-08-10 — LIVE and answering.*
  Gemini, grounded on the lesson transcript. **The pinned `gemini-2.0-flash` was returning HTTP 429
  `limit: 0` — zero free-tier quota, not overuse.** Switched to the `gemini-flash-latest` alias, which
  answered immediately on the same key: Google moves free quota between versions and a pinned model
  silently dies with it.
- 🔨 **F2. Stop & ask mid-video — type + voice input.** *Built 2026-08-10.*
  Engaging the assistant (focusing the box, tapping the mic) pauses the video — one handler covering
  the R2 `<video>` directly and YouTube/Bunny by postMessage. Voice uses the browser`s own
  SpeechRecognition (en-IN): no audio reaches our servers, only the text, exactly as if typed. The mic
  button does not render where the API is absent (Firefox) rather than sitting there dead.
- 🔨 **F3. AI explains on a board.** *Built 2026-08-10.* A validated STRUCTURED board (headline,
  numbered steps, optional formula chips) — never model-authored markup, which in a page children use
  is both an XSS surface and a layout lottery.
- 🔨 **F4. Presentations + live examples + diagrams.** *Built 2026-08-10.* The board carries an
  optional bar diagram, drawn by us from numbers the model supplies. Emitted only when the lesson
  genuinely compares quantities; otherwise omitted rather than invented.
- 🔨 **F5. Openable diagram → simulator.** *Built 2026-08-10, narrow but real.* A slider bound to a
  one-variable arithmetic expression, evaluated by a hand-written shunting-yard parser — **no `eval`,
  no `new Function`**, because the expression comes from a language model. Whitelisted server-side and
  again in the browser, so a change on one side cannot quietly unlock the other. 18 unit cases pass,
  including `alert(1)` and `x; window.x=1` returning null.
- 🔨 **F6. End → continue; ask any question.** *Built 2026-08-10.* On video end: continue to the next
  UNLOCKED lesson (never onto a padlock), or jump to the assistant. Nothing auto-advances — that would
  drag a confused student past the thing that confused them.
- 🔨 **F7. Question bank, Levels 1–3.** *Stage 5 — built, awaiting sign-off.*
- 🔨 **F8. Weak-area detection with score thresholds (60% / 80% / 90%).** *Stage 5 — built, awaiting sign-off.*

---

## Already in place that this plan builds on

Not achievements of this plan — context so we don't rebuild what exists.

- `App\Support\TeacherMatcher` — distance (haversine, no maps API) + subject qualification and ranking,
  shared by the key-gated matching export and the Staff Console suggestion panels (2026-08-07).
- Staff Console suggestions — read-only shortlists for home-tuition requests and demo bookings.
- `DemoRequest` → `assignDemo` → `convert` → `Enrollment` — the rail the conversion metric rides on.
- `physical_teaching_profiles` — geocoded location, service radius, timetable slots, police-verified flag.
- Video player + Gemini study assistant, shipped dark pending keys.
- Pincode directory + geocoding with no maps API.

## Portal design direction — 2026-08-10

The owner supplied two reference dashboards (a purple "Student Portal" mobile app with a Quick Access
tile grid; an "EDUBUZZ" web dashboard with a left nav, progress cards and a stats rail) and said:
**"options will be as per the role, but designs more or less will be like this — maintain the colour
palette of IndiaTutors."**

Read as: adopt the *shape* — a tile/grid launcher, progress and streak cards, a left nav on desktop —
not the palette. IndiaTutors is brand blue `#1E40AF` / navy `#0B1220` with gold `#D4AF37`; the
references are purple and orange. Copying their colours would undo the parity work.

**Role-based, not one dashboard with hidden rows.** Teachers get what a teacher needs to work; students
and parents get what they need to learn and pay. The existing `ParentDashboard` / `StudentDashboard`
split already reflects that and is the right seam to build on.

**Do not import the reference tiles wholesale.** Those apps show Fees, Attendance, GradeSheet, Library,
Exams, Notices, Gallery — a school MIS, not a tutoring marketplace. A tile that opens an empty
"Library" is the placeholder habit this project keeps having to clean up. Tiles land when the thing
behind them exists.

## Direction change — 2026-08-10

Two owner instructions that **supersede earlier decisions in this file**. Recorded loudly because both
contradict something already built, and a future reader following the old rule would be wrong.

### 1. Assignment becomes automatic, inside this website

> *"This whole thing of automatically assigning of teachers to the students and the whole operation
> will be automated inside the website. There will be options for the admin (coordinator) to intervene,
> but make the system so solid that coordinators hardly get into it."*

**This reverses the suggest-only boundary.** Until now the console deliberately *suggested and never
assigned*, because assignment belonged to the leads-management software — the owner confirmed that
choice explicitly on 2026-08-07, and `AdminPhysicalController::updateRequirement` still carries a
docblock saying a second writer of `matched_profile_id` would be a second source of truth.

That reasoning held only while another system owned the decision. It no longer does. The target is now:
**the website assigns by default; a coordinator overrides by exception.** The parts already built are
the right foundation — `TutorMatcher` and `TeacherMatcher` decide *who fits*, `TeacherPerformance`
decides *who is good*, `enrollment_schedules` says *when the class is* — what is missing is the step
that commits the choice, plus an audit trail and an override path so an intervention is cheap.

*Not yet done, and not to be done silently: this needs the suggest-only docblocks retired and
`matched_profile_id` given a legitimate second writer.*

### 2. The old LMS is dead

> *"Coordinators will do their job using the LMS. A new LMS will be made later. The previous LMS we made
> and connected will not be in use."*

⚠️ **Live consequence to deal with before it bites.** `App\Support\LmsLeadPush` still pushes every demo
booking (`DemoRequestController:67`), contact ticket (`ContactController:48`) and tuition requirement
(`TuitionRequirementController:137`) into that LMS. It is gated only on `LMS_BASE_URL` +
`LMS_INTAKE_TOKEN` being set, so **wherever those are still configured it is still firing.**

The failure mode is quiet and expensive: leads keep being delivered to a system nobody is watching, and
the `lms_lead_no` stamp marks them as already pushed, so they look handled. Unset the two env vars to
stop it (the code fails dark by design), and treat the intake contract as frozen until the new LMS
exists. `docs/MATCHING-DATA-CONTRACT.md` describes the export for the *old* consumer.

## Boundaries to preserve

- ~~**The console suggests; it does not assign.**~~ **SUPERSEDED 2026-08-10** — see *Direction change*
  above. Assignment moves into this website and becomes automatic, with coordinator override. The old
  rule existed because another system owned the decision; it no longer does.
- **Personal data stays gated.** Teacher and student home addresses and phones are why the export needs
  a key. Any new surface that exposes them needs the same deliberate gate.
- **No invented social proof.** Reviews, testimonials and ratings must come from real, consented,
  verifiable sources — the whole point of D1's demo gate.

## Blocked on credentials, not code

R2 keys (teacher video, course video) · a working Gemini key (AI tutor) · Razorpay keys (payments) ·
SMTP + messaging credentials (notifications through the flow).
