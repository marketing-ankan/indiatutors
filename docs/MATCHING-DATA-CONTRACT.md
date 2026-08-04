# Physical (home) tuition — matching data contract

**What this is.** IndiaTutors captures the data. The **leads-management software** decides
which teacher goes to which student. This document is the agreement between the two: what we
collect, why each field exists, and how to read it.

**The website does not match or suggest anybody.** There is no scoring, no ranking, no
candidate list and no assign action anywhere in this codebase — deliberately, so there is
exactly one system that decides an assignment and exactly one place to change how it decides.
This side is the system of record: forms, validation, normalisation, geocoding, and a
versioned read API. The leads software reads it and writes back which teacher it chose.

**One rule underneath the schema:** a field belongs on our forms only if the leads software
either *filters* on it or *ranks* by it. Everything below is one or the other, and the "why"
column says which. Anything you cannot answer that for should not be on the form — it costs a
teacher thirty seconds and buys nothing.

---

## 1. What decides a physical match

Online tutoring matches on subject and timezone. Home tuition adds three constraints that
break matches far more often, and all three are geography-shaped:

1. **Can they get there, repeatedly?** Not "same city" — same *reachable distance*, in
   minutes, in the direction people actually travel. A match at 14 km looks fine in a
   spreadsheet and quietly dies in month two.
2. **Do the hours actually overlap?** A family wanting Tue/Thu 5–7pm and a teacher free
   Sat mornings is not a match at any distance.
3. **Would this family accept this person in their home?** Gender, language, verification.
   In India these are asked openly and ignoring them wastes the lead.

Everything in the schema serves one of those three, plus the obvious subject/class fit.

---

## 2. Teacher fields

Captured on **/become-a-teacher** (public) and **/dashboard → Home & physical tuition**
(signed-in). Both write the same rows.

### 2.1 Identity — `physical_teaching_profiles`

| Field | Why the matcher needs it |
|---|---|
| `gender` | **Filter, both ways.** Families request a female teacher for a daughter often enough that ignoring it burns leads; teachers set their own limit too. |
| `date_of_birth` | **Rank.** Age bands matter to families of young children; also an eligibility check. |
| `nationality` | Default `Indian`. Captured for compliance and payout paperwork. |
| `languages` (CSV) | **Filter + rank.** The medium of instruction. A brilliant Physics teacher who cannot teach in Bengali is not a match for a Bengali-medium child. |
| `experience_years` | **Rank**, and filtered when a family sets `min_teacher_experience`. |
| `police_verified`, `police_verified_on` | **Rank, heavily.** Someone is entering a home with a child. Staff set this from the console after an offline check. |

### 2.2 Location — the part online tutoring never needed

| Field | Why |
|---|---|
| `address_line1/2`, `landmark`, `locality` | Operational — the teacher has to be told where to go. Not used for matching, never shown publicly. |
| `city`, `district`, `state`, `pincode`, `country` | **Filter.** District/state group candidates when coordinates are missing. Autofilled from the pincode so the values are consistent — free-text districts cannot be grouped. |
| `latitude`, `longitude` | **The filter.** A radius is a circle and a circle needs a centre. |
| `geo_source` | **Precision flag** — `device` \| `pincode` \| `approx` \| `manual`. See §5. Never treat an `approx` point as exact. |
| `geo_accuracy_m` | Metres, present when `geo_source = device`. |

### 2.3 Travel

| Field | Why |
|---|---|
| `service_radius_km` | **The primary distance filter.** 0 = does not travel to students. |
| `extra_pincodes` (CSV) | **Filter override.** Pincodes reachable *outside* the circle — a route they already take. Treat as reachable regardless of distance. |
| `travel_mode` | **Rank.** Converts km to minutes: 10 km on a scooter ≠ 10 km on a bus. |
| `max_travel_minutes` | **Filter.** Often the truer constraint than km inside a city. |
| `travel_outside_city`, `travel_fee_per_visit` | Commercial terms surfaced before assignment. |

### 2.4 Venue — `at_student_home`, `at_own_place`, `at_public_place`, `own_place_capacity`

**Hard filter.** Exported as `service_area.venues`. A family wanting classes at home and a
teacher who only hosts are not a match, however close they are. `own_place_capacity` caps
group assignment.

### 2.5 Subjects — `teaching_offerings`, one row per subject × class range × boards

This is the table that replaces a comma-separated `subjects` string, and it is the single
biggest accuracy win in the schema.

> "Maths, Physics" cannot express *"Physics for 11–12 CBSE, but Maths only up to Class 8."*
> A CSV match sends that teacher a Class 12 Maths lead. They decline. The lead and some of
> the relationship are gone.

| Field | Why |
|---|---|
| `subject` | **Filter.** |
| `grade_from`, `grade_to` | **Filter.** Ordinals, see §4. Null = no bound that side. |
| `boards` (JSON) | **Filter + rank.** Empty = board-agnostic. |
| `medium` | **Filter.** Per subject — someone may teach Science in English but Bengali literature in Bengali. |
| `level`, `exam_target` | **Filter** for competitive-exam requests. |
| `fee_hourly`, `fee_monthly` | **Filter (budget) + rank.** Per subject-and-class, because Class 12 Physics is never priced like Class 3 Maths. |
| `experience_years` | **Rank.** Experience *in this subject*, not in total. |
| `is_primary` | **Rank.** Their strongest subject. |

### 2.6 Availability — `teaching_availability_slots` (+ `_exceptions`)

Recurring `(weekday, start_time, end_time)` rows, ISO weekdays (1 = Monday).

**Why not free text.** The old profile stored `"5-8pm weekdays"`. Nothing can intersect that
with a family's preferred times, so availability could not be matched at all — it could only
be read by a human on a phone call. Ranges can be intersected; the export ships
`availability.weekly_hours` precomputed.

`teaching_availability_exceptions` carries single-date overrides (`is_available = false` for
a block-out). Matching on the weekly pattern alone books teachers who are not there.

Supporting: `notice_hours`, `preferred_session_minutes`, `max_hours_per_week`,
`max_students`, `available_from`, `on_break_until` — all **capacity filters**. Without
`max_hours_per_week` a popular teacher gets assigned a 40-hour week and drops half of it.

### 2.7 Preferences — `preferred_student_gender`, `teaches_group`, `max_batch_size`,
`special_needs_experience`, `min_fee_hourly`, `min_fee_monthly`

Filters. `special_needs_experience` is a hard filter for requests flagged `special_needs`.

### 2.8 Lifecycle — `status`

`draft` → `submitted` → `active` → `paused`. **Only `active` is exported by default.** A
half-filled draft handed to a matcher fails every filter and looks like a matcher bug.

---

## 3. Student fields — `tuition_requirements`

Captured on **/physical-classes** (guests welcome) and the parent dashboard. One row per
open request, not per student: two children, or one child needing Maths now and Science in
June, are two different matches with different budgets and timings.

### 3.1 Learner

`learner_name`, `learner_gender` (**filter** against the teacher's preference), `learner_dob`,
`grade` (**filter**, ordinal), `board` (**filter**), `school`, `medium` (**filter** — the
language they learn in), `languages`, `learner_count` (siblings taught together → group
capacity), `special_needs` + `special_needs_note` (**filter**).

### 3.2 Need

`subjects` (**filter**), `goal`, `exam_target` (**filter** for competitive), `focus_areas`
(briefing, not matching), `sessions_per_week` + `session_minutes` (**capacity filter** —
this is what consumes the teacher's `max_hours_per_week`), `start_date`, `urgency`
(**queue priority**).

### 3.3 Where

Same address block as the teacher, plus:

| Field | Why |
|---|---|
| `venue_preference` | `student_home` \| `teacher_place` \| `either`. **Hard filter**, and it decides *whose* distance limit applies. |
| `max_teacher_distance_km` | **Filter.** How far the family will let a teacher travel — a proxy for "will they still be coming in July". |
| `willing_to_travel_km` | **Filter**, used instead of the above when the class is at the teacher's place. |

### 3.4 When — `preferred_days` (ISO weekdays), `preferred_time_windows` (`[{start,end}]`)

**Hard filter** against the teacher's slots. Empty = flexible.

### 3.5 Money — `budget_min_hourly`, `budget_max_hourly`, `budget_monthly`

**Filter + rank** against the offering fee. Only scored when both sides state a number.

### 3.6 Teacher preferences — `preferred_teacher_gender`, `preferred_teacher_languages`,
`min_teacher_experience`, `group_ok`

Filters, and the ones families feel most strongly about.

### 3.7 Contact & lifecycle

`contact_name/phone/email`, `relationship`, `whatsapp_consent`, `best_time_to_call` —
operational, needed the moment a match is made. `status` (`open` → `matched` → `closed`),
`matched_profile_id`, `matched_at` — the assignment app writes these back (§6).

---

## 4. Shared vocabulary

**Grades are ordinals, not text.** Five forms produce "Class 10", "10th", "X" and "Grade 10";
none of them range-checks. Everything normalises to:

```
0     Pre-primary / nursery / KG
1-12  Class 1 - Class 12
13    Above Class 12 (college, adult, skill course)
```

Defined in `app/Support/GradeScale.php`, mirrored in `resources/js/data/physical.js`. Keep
the two in step.

**Weekdays are ISO-8601**: 1 = Monday … 7 = Sunday. Everywhere, no exceptions.

**Boards, enums and the live subject list**: read `GET /api/matching/v1/reference` at start-up
rather than hard-coding our strings on the other side.

---

## 5. Geocoding, and how much to trust it

No maps API, no key, no bill. Coordinates come from, in order of precision:

| `geo_source` | Where it comes from | Accuracy |
|---|---|---|
| `device` | The browser's own geolocation, with the user's consent, from the "use my current location" button. | metres |
| `pincode` | Centroid from the bundled `pincodes` table. | ~1 km |
| `approx` | Averaged from known pincodes sharing the first 3 digits (the postal sorting district). | ~10–20 km |
| `manual` | Entered by staff. | varies |

`approx` is a hint for ranking, not a distance you should filter tightly on. Both sides of a
match should be compared at the *worse* of their two sources.

**Loading the full postal directory.** The repo ships ~200 anchor pincodes (dense for
Kolkata, one or more per major city) so the forms and radius matching work on a fresh
install. Replace them with the official dataset — any release with latitude/longitude
columns — via:

```bash
php artisan pincodes:import storage/app/pincodes.csv
```

The importer matches columns by name, not position, aggregates post offices to one row per
pincode, and re-tags the rows `import` so re-seeding will not overwrite them.

Unknown pincodes fall through to India Post's open endpoint (`api.postalpincode.in`) for
district/state — no key, cached and written back so each pincode costs one call ever. Set
`PINCODE_LOOKUP_API=false` to stay fully offline.

---

## 6. The export API

Base: `/api/matching/v1`. Auth: `X-Matching-Key: <MATCHING_API_KEY>` (a bearer token is also
accepted). **With the key unset the entire prefix returns 503** — this is home addresses on
both sides, and it is never open by default. Rate limit 120/min.

| Endpoint | Purpose |
|---|---|
| `GET /reference` | Grades, boards, subjects, every enum. Read once at start-up. Note the two gender vocabularies: `gender` for a person, `preference_gender` (which adds `any`) for the two preference fields. The `subjects` list is our catalogue offered as picker suggestions — **not** a closed set; both forms accept free text, so compare subject strings case-insensitively. |
| `GET /teachers` | Published teacher profiles. Defaults to `status=active`. |
| `GET /teachers/{id}` | One profile. |
| `GET /requirements` | Student requests. Defaults to `status=open`. |
| `GET /requirements/{id}` | One request. |
| `PATCH /requirements/{id}` | **Write-back**: `status`, `matched_profile_id`, `notes`. |

**Query parameters** (list endpoints): `updated_since` (ISO 8601), `status`, `pincode`,
`state`, `page`, `per_page` (max 500).

**Incremental sync.** Rows are ordered by `updated_at`, and `meta.checkpoint` is the newest
`updated_at` *in the page you just received* — not "now". Store it and send it back as
`updated_since` next run; a row written mid-page is then re-read rather than skipped.

```
GET /api/matching/v1/teachers?updated_since=2026-08-03T09:00:00Z&per_page=200
X-Matching-Key: ...
```

**Stable ids.** `teacher:{profile_id}` and `requirement:{id}` never change or get reused, so
the assignment app can hold its own state against them.

**Shape.** Flat and pre-resolved: coordinates computed, grades as ordinals, availability as
ranges with `weekly_hours` summed. The consumer never has to re-parse anything.

Write-back example:

```
PATCH /api/matching/v1/requirements/42
X-Matching-Key: ...
{"matched_profile_id": 17, "notes": "Assigned; first class Tue 5pm"}
```

`status` defaults to `matched` and `matched_at` is stamped server-side. Both come back on the
next read (`matched_profile_id`, `matched_at`), so an interrupted sync can be reconciled
rather than leaving a timestamp that was written and never readable.

This is deliberately the *only* mutation in the export: IndiaTutors stays the source of truth
for everything a human typed, and owns nothing about how the match was made.

---

## 7. What this system deliberately does not do

No matching. No scoring, ranking, shortlisting or auto-assignment lives here, and none should
be added: the leads-management software owns that decision, and a second implementation would
be a second answer to the same question with no way to tell which one was used.

Concretely, the website will never:

- rank or score teachers against a request;
- return a candidate list from any endpoint;
- set `tuition_requirements.matched_profile_id` from the admin console (only the export
  write-back in §6 can set it).

What the console **does** offer is triage: read the full request, add a staff note, put it on
hold, close it — and, on the teacher side, a **Ready?** column flagging the three things
without which a record is unusable by anything downstream (coordinates, at least one subject,
some availability). That column is the console's real job: a teacher stuck at 40% complete is
invisible to the leads software however good they are, and that is a phone call to make.

### Suggested filters for the leads software

Not our implementation — a checklist of what the captured data supports, so nothing is
collected that nobody uses and nothing needed is missing:

**Hard filters:** venue compatibility · teacher not on a break · gender (both directions) ·
subject × class range × board · distance within the binding radius, whichever side's limit
binds (or an `extra_pincodes` opt-in, which should override the radius) · non-zero
availability overlap when the family stated timings · `special_needs_experience` when the
request is flagged.

**Reasonable ranking inputs:** distance and travel time · size of the availability overlap ·
how many of the requested subjects are covered · fee against budget · police verification ·
experience · board and language overlap.

**Careful with `geo_source`.** Compare two records at the *worse* of their two sources, and do
not filter tightly on `approx` (§5) — it can be 15 km out.

---

## 8. Setup checklist

```bash
php artisan migrate
php artisan db:seed --class=PincodeSeeder      # anchor pincodes
php artisan pincodes:import <official.csv>     # optional, recommended before launch
```

`.env`:

```
MATCHING_API_KEY=<long random string>   # required before the export answers at all
PINCODE_LOOKUP_API=true                 # false to disable the India Post fallback
```
