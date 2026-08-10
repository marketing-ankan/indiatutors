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
- ⬜ **A2. Public teacher profile page — full version.** Qualifications, testimonials, timetable /
  time availability, intro video, reviews, ranking position.
- ⬜ **A3. Teacher details capture — WinQuest parity.** All locations served + availability + time.
  *Partly exists for home-tuition teachers (`physical_teaching_profiles`); the directory `tutors` table is thinner.*
- ⬜ **A4. Admin approval gate for profile media.** Video and photos reviewed before they go public.

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

- 🔨 **C1. Teacher can contact the student after selection** — under coordinator guidance, not open
  contact. *Stage 4 — built, awaiting owner sign-off.*
- ✅ **C1a. DECIDED 2026-08-10 — nothing until a coordinator releases it.** A teacher sees the enquiry
  (subject, grade, area, proposed times) and never the phone, email or address until a human presses
  **Release contact**. Stored as `contact_released_at` + `contact_released_by`, not a boolean: when the
  question is *who gave this teacher our number, and when*, a flag cannot answer it. Withdrawal is
  possible (reassignment happens) and cannot unsee what was seen — which is why the audit row matters.
  The withholding lives in `TeacherDemoResource`, not at each call site: a field that is only safe
  because one query happened not to select it is one refactor from leaking.
- 🔨 **C2. Coordinator flow for physical demos.** demo → visit → coordinate → confirmation → time slot → final.
  *Stage 4 — built, awaiting owner sign-off.* **Decided: in-app by default, phone as fallback.** Slots
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
- ⬜ **C4. Class schedule after a successful demo.** Regular classes scheduled from the demo outcome.

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
- ❓ **D3a. Decision: low-volume protection.** One demo converted = "100%" would outrank a veteran at
  60% over 50 demos. Needs a minimum-demo floor or smoothing — founder's call on which.
  ✅ **DECIDED 2026-08-10 — smooth toward the platform average.** Ranking everyone from day one, rather
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
  *Note: today's testimonial arrays are placeholders. Real ones need consent — see WEBSITE-IMPROVEMENTS.md §A3.*
- ✅ **D5. Ranking feeds back into suggestions (B1).** *Owner-confirmed 2026-08-10 · commit `f01f28e`.*
  The loop is closed: reviews and conversions from held demos feed the score, the score breaks ties in
  `TutorMatcher`, and the shortlist a family sees is that ordering. **Fit still dominates** — track
  record only separates teachers who already match the subject and grade asked for, so a superb Physics
  teacher can never win a Piano enquiry on reputation alone.

## E. Student offering & retention (left column of the page)

- ⬜ **E1. Marketing — free plans + incentives.**
- ⬜ **E2. Backup classes.**
- ⬜ **E3. Materials — full access.** *Content source is WinQuest.*
- ⬜ **E4. Teacher materials.** *WinQuest.*
- ⬜ **E5. Terms & conditions.** *Policy pages exist; entity name still pending.*
- ⬜ **E6. Student contents.**
- ⬜ **E7. Student achievements.**
- ⬜ **E8. Certification.**
- ⬜ **E9. Club — 25% online class.** *Needs the owner to explain the mechanic.*

## F. Video courses — AI tutor player (bottom of the page)

- ⬜ **F1. AI assistant — free alternative to Claude.** *Gemini is already wired; blocked on a working key.*
- ⬜ **F2. Stop & ask mid-video — type + voice input.**
- ⬜ **F3. AI explains on a board.**
- ⬜ **F4. Presentations + live examples + diagrams.**
- ⬜ **F5. Openable diagram → simulator.**
- ⬜ **F6. End → continue; ask any question.**
- ⬜ **F7. Question bank, Levels 1–3.**
- ⬜ **F8. Weak-area detection with score thresholds (60% / 80% / 90%).**

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

## Boundaries to preserve

- **The console suggests; it does not assign.** Only the key-authed `/api/matching/v1` write-back sets
  `matched_profile_id`. Owner's decision, reaffirmed 2026-08-07.
- **Personal data stays gated.** Teacher and student home addresses and phones are why the export needs
  a key. Any new surface that exposes them needs the same deliberate gate.
- **No invented social proof.** Reviews, testimonials and ratings must come from real, consented,
  verifiable sources — the whole point of D1's demo gate.

## Blocked on credentials, not code

R2 keys (teacher video, course video) · a working Gemini key (AI tutor) · Razorpay keys (payments) ·
SMTP + messaging credentials (notifications through the flow).
