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

- ⬜ **B1. Student-facing teacher suggestions.** The ranked shortlist a student sees when booking a
  demo, from their own details (subject, grade, location) against teacher details.
  *Engine exists: `App\Support\TeacherMatcher` (distance + subject), currently staff-only.*
- ⬜ **B2. Teacher list → profile view → select.** The browse/compare step before booking.
- ⬜ **B3. Demo booking is the lead.** Selecting a teacher and booking creates the lead record.
  *Exists as `DemoRequest`; needs the chosen teacher attached at booking time.*

## C. Demo scheduling & coordination

- ⬜ **C1. Teacher can contact the student after selection** — under coordinator guidance, not open contact.
- ❓ **C1a. Decision: contact reveal policy.** Does the student's phone go to the teacher directly, or
  only through the coordinator? (The matching export is key-gated precisely because these are home
  addresses and phone numbers — the same care applies here.)
- ⬜ **C2. Coordinator flow for physical demos.** demo → visit → coordinate → confirmation → time slot → final.
- ⬜ **C3. Demo state machine.** selected → contacted → time-confirmed → scheduled → completed / no-show.
  *Today `DemoRequest.status` is only new/scheduled/converted/closed — too coarse for this.*
- ⬜ **C4. Class schedule after a successful demo.** Regular classes scheduled from the demo outcome.

## D. Reviews & ranking (the heart of the page)

- ⬜ **D1. Teacher reviews, up to 5★, gated on a completed demo.** Only a student who actually sat the
  demo can review that teacher.
  *New schema — the existing `Review` model attaches to **courses**, not tutors.*
- ⬜ **D2. Conversion tracking — demo → regular enrolment.** The "efficiency" number.
  *The data is already being recorded: `assignDemo` → `convert` → `Enrollment`.*
- ⬜ **D3. Teacher ranking score.** Combines review score + conversion rate (+ other efficiency signals).
  Applies to **online and physical** teachers alike.
- ❓ **D3a. Decision: low-volume protection.** One demo converted = "100%" would outrank a veteran at
  60% over 50 demos. Needs a minimum-demo floor or smoothing — founder's call on which.
- ⬜ **D4. Testimonials & social proof on the profile.** WhatsApp testimonials, performance photos/videos.
  *Note: today's testimonial arrays are placeholders. Real ones need consent — see WEBSITE-IMPROVEMENTS.md §A3.*
- ⬜ **D5. Ranking feeds back into suggestions (B1).** Closing the loop.

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
