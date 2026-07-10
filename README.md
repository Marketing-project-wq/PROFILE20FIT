# Handoff: 20fit Health Profile Dashboard

## Overview
A complete member health dashboard for 20FIT Sport Clinic Indonesia. Members can track their health, upload medical check-up documents, get personalised exercise + nutrition recommendations, track calories, menstrual cycle (female), sleep, water, breathing exercises, and book 20fit services.

This is the **design spec and reference prototype** for implementing these screens inside the existing `my20fit` React + Vite + Supabase codebase at `artifacts/my20fit/`.

## ⚠️ Workflow & Secrets (WAJIB dibaca sebelum commit)

- **Alur git staging-first** — semua perubahan lewat branch kerja → `staging`;
  merge ke `main` (production) hanya atas perintah eksplisit pemilik produk.
  Lihat [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).
- **Token & API key tidak boleh di-commit** — simpan di GitHub Actions Secrets /
  Railway Variables / `.env` lokal. Daftar nama secret dan status rotasi ada di
  [`docs/GITHUB_SECRETS.md`](docs/GITHUB_SECRETS.md).
- CI menjalankan secret scan (gitleaks) di setiap push/PR
  (`.github/workflows/secret-scan.yml`).

## About the Design Files
The files in this bundle (`20fit-login.html` and `20fit-dashboard.html`) are **high-fidelity HTML prototypes** — they show exact intended look, layout, interactions, and copy. They are **not production code**. The task is to **recreate these designs as React components** inside the existing codebase (`artifacts/my20fit/src/`), using the established patterns (Radix UI, Tailwind CSS v4, TanStack Query, wouter, Framer Motion, Recharts) and wiring to real Supabase data.

## Fidelity
**High-fidelity** — pixel-perfect mockups with final colors, typography, spacing, copy, and all interactions. Recreate exactly using the codebase's existing libraries. Design system tokens are in `src/index.css`.

---

## Design Tokens

### Colors
```
Brand Red:      #C41101   (primary CTA, active nav, badges)
Brand Gold:     #D4A800   (Plus member)
Background:     #EDE8DF   (warm off-white)
Card:           #FFFFFF
Card2:          #F0EDE5   (secondary bg)
Text:           #0A0908
Text Soft:      #555555
Muted:          #9E8E7A
Border:         #E8E2DB
Border Warm:    #DDD5C8
Dark BG:        #0A0908   (dark cards/sidebar)
Dark Card:      #131310
Dark Text:      #F0EDE6
```

### Typography
```
Anton (400)          → Display/hero headings, large numbers
Barlow Condensed (900) → Section labels (9px, 3px letter-spacing, uppercase)
Inter (400/500/600/700) → Body, forms, paragraphs
JetBrains Mono (400/700) → Data values, numbers, metrics
```

### Spacing / Radius
```
Card border-radius: 16px
Button border-radius: 10-12px
Badge border-radius: 20px (pill)
Content max-width: 720px (desktop content column)
Sidebar: 220px wide, fixed, dark bg #0A0908
```

### Shadows
```
Card: 0 2px 12px rgba(10,9,8,0.06)
Card hover: 0 4px 20px rgba(10,9,8,0.10)
CTA button: 0 4px 14px rgba(196,17,1,0.25)
```

---

## Layout Pattern
- **Desktop (≥1024px):** Fixed sidebar (220px, dark) + scrollable main content (max-w-[720px] mx-auto)
- **Mobile (<1024px):** Sticky top header (52px) + fixed bottom nav (5 items) + content padding-bottom 120px
- **Sidebar items:** Home, Medical Record & Plan, Progress, Calorie Tracker, Profile
- **Bottom nav items:** Home, Medical, Progress, Calories, Profile

---

## Screens

---

### 1. Login / Register (Login.dc.html → `src/pages/Login.tsx`)

**Desktop layout:** Split panel — left 45% dark (#0A0908) hero with logo + tagline, right 55% white form card.
**Mobile:** Single centered card, logo top.

#### Tabs: Sign In / Buat Akun
Toggle between login and register. Active tab has red underline border.

#### Sign In Form Fields:
- Email (type=email, autocomplete=email)
- Password (type=password, show/hide toggle)
- "Forgot password?" link → `/reset-password`
- CTA button: "Masuk" (red, full width)
- Divider "atau"
- Google OAuth button (outline, Google icon)
- Magic Link button (outline, envelope icon) → `/magic-link`

#### Register Form Fields (in order):
1. **Gender** — radio button cards: "Pria" / "Wanita" (selected = dark bg, red border)
2. **Full Name** (text, autocomplete=name)
3. **Email** (email, autocomplete=email)
4. **Phone** — prefix "+62" box + number input
5. **Date of Birth** (type=date, max=today)
6. **Height** (number, min=100 max=250, suffix "cm")
7. **Weight** (number, min=30 max=200, suffix "kg")
8. **BMI Preview** — auto-calculates when height+weight filled:
   - Formula: `weight / (height/100)²`
   - < 18.5 → "Underweight" red
   - 18.5–24.9 → "Normal Weight" green (#2A7A4F)
   - 25–29.9 → "Overweight" orange (#C87000)
   - ≥ 30 → "Obese" red
   - Show colored card with BMI number, label, one-line description
9. **Password** (min 8 chars)
10. **Goals questionnaire** (after main form, separate step):
    - "What is your main goal?" → cards: Lose Weight / Build Muscle / Get Healthier / Improve Fitness
    - "Do you have any medical conditions we should know about?" → multi-select checkboxes + free text
    - Save to `my20fit_profile` as `main_goal` and `health_conditions`

#### On successful register:
- Save profile data to `my20fit_profile` (Supabase): name, email, phone, gender, birthdate, height_cm, weight_kg, calculated BMI
- Redirect to welcome/onboarding walkthrough → then dashboard

#### State to save:
```typescript
// In my20fit_profile table:
gender: 'male' | 'female' | 'other'
birthdate: string (ISO date)
height_cm: number
weight_kg: number
// Computed on frontend, not stored:
bmi: number
// In profile or separate field:
main_goal: 'lose' | 'muscle' | 'health' | 'fit'
health_conditions: string[] // multi-select
```

---

### 2. Onboarding Walkthrough (after first login)
Full-screen overlay with steps explaining features:
1. Welcome + name greeting
2. Medical Check-Up upload
3. Health Plan & Recommendations
4. Daily Tracking (sleep, water, calories)
5. Book 20fit Services

On complete → set `onboarding_completed: true` in profile.

---

### 3. Home Dashboard (`src/pages/Dashboard.tsx`)

#### 3a. Greeting Card
- "Selamat pagi/siang/sore/malam, [Name]!" (time-based)
- Date + day in Barlow Condensed
- If female: show current menstrual cycle phase badge (Menstrual/Follicular/Ovulation/Luteal)

#### 3b. Stats Row (3 cards, horizontal scroll mobile)
- **BMI card** — large Anton number, colored by category, label badge
- **Weight card** — current weight_kg + height_cm
- **Cycle Phase card** (female only) — current phase name + emoji + days info

#### 3c. Daily Achievement Progress
- Horizontal progress bar showing % of daily tasks done
- Label: "X / Y tasks completed today"
- Tasks: drink 8 glasses water, 7+ hours sleep, log meal, complete workout, breathing session
- When 100%: red bar turns green + confetti popup

#### 3d. Weather + AQI Widget (side-by-side, 2-col grid)

**Weather panel:**
- Section label "Weather · Jakarta"
- Weather icon (SVG) + temperature (°C) large Anton + description
- Outdoor/Indoor recommendation badge
- "Try today" list: 2-3 workout types based on weather

**AQI panel:**
- Section label "Air Quality · AQI"
- Animated mini scene (60px tall):
  - AQI ≤ 50: blue sky gradient + sun pulse animation + floating clouds
  - AQI 51–100: golden hazy sky + pulsing haze overlay
  - AQI > 100: dark brown sky + floating particle dots animation
- Large AQI number (Anton, colored) + progress bar
- Label (Good/Moderate/Unhealthy) + advice text

**Animations needed:**
```css
@keyframes sunPulse { scale 1→1.06→1, opacity 1→.85→1, 3s }
@keyframes floatCloud { translateX 0→6px→0, 4s }
@keyframes floatCloud2 { translateX 0→-8px→0, 5s }
@keyframes hazePulse { opacity .4→.7→.4, 3s }
@keyframes grimPulse { opacity .6→1→.6, 4s }
@keyframes particleDrift { translateY 0→-24px + fade out, 3s }
```

#### 3e. Recommended Workouts Widget
- Dark card (#0A0908)
- 3 exercise rows: icon + name + duration/intensity + reason (italic)
- Tag badges: "MCU" (red, from medical check-up result) / "Goal" (dark) / "Sleep" (grey)
- Logic:
  - Read `my20fit_mcu_result` from localStorage
  - Read `main_goal` from profile
  - Read sleep hours logged today
  - AQI > 100 → force indoor workouts
  - Sleep < 5h → downgrade intensity to Light
  - LDL high in MCU → recommend EMS + Cardio with tag "MCU"
- "Booked ✓" badge (red) if session booked today
- "Book →" button (dark) → navigate to Calendar/Progress

#### 3f. Breathing Exercise Widget
- Section label + "✓ Session Done" badge when complete
- Pattern selector (3 buttons):
  - **4-7-8** — Inhale 4s, Hold 7s, Exhale 8s (4 cycles)
  - **Box 4×4** — Inhale 4s, Hold 4s, Exhale 4s, Hold 4s (4 cycles)
  - **Relax 5-5** — Inhale 5s, Exhale 5s (6 cycles)
- Animated ring (100px circle):
  - Inhale: scale 1→1.55, opacity .7→1 (css animation)
  - Exhale: scale 1.55→1, opacity 1→.7
  - Hold: opacity pulse
- Phase label (Anton 22px) + countdown seconds
- Progress dots (one per cycle, fill red as completed)
- Start/Stop button
- On complete: Congrats popup + achievement unlocked

#### 3g. Sleep + Water Tracker (side-by-side)

**Sleep card:**
- Section label + hours display (Anton large)
- +/- stepper (0–12h in 0.5h steps)
- Progress bar (0–8h target)
- "Log Sleep →" button → saves, checks if ≥8h → congrats popup

**Water card:**
- Section label + glasses display (Anton large)
- Glass icons grid (8 total, filled red when drunk)
- Tap to add glass (up to 8)
- Progress bar
- When 8 glasses: congrats popup

#### 3h. Calorie Quick View
- Link/button → navigate to Calorie Tracker page
- Shows: consumed / goal kcal, ring chart

#### 3i. Food Recommendation (Today's Plan)
Below calorie view, always visible:
- Dark header card with goal kcal + remaining kcal
- Breakfast / Lunch / Dinner / Snack sections
- Each meal item: emoji icon + name + macro pills (kcal, P, C, F) + tag badge
- Based on `main_goal` + MCU results
- "Book with nutritionist" CTA at bottom

#### 3j. Menstrual Cycle Widget (FEMALE ONLY)
Shown only when `gender === 'female'`:

**Input mode:**
- "🔴 Today is my period" big red button → sets Day 1, transitions to result
- OR: "How many days ago was your last period?" number input + Set button

**Result mode (after setting):**
- Phase name (Menstrual/Follicular/Ovulation/Luteal) in large Anton
- Days until next period
- Phase description + exercise/food tip
- Edit button → back to input

**Phase calculation (28-day default):**
- Day 1–5: Menstrual (red)
- Day 6–13: Follicular (orange)
- Day 14: Ovulation (yellow)
- Day 15–28: Luteal (purple)

---

### 4. Medical Record & Plan (`src/pages/MedicalRecord.tsx`)

#### Tabs: Records / Upload / Doctor's Records

**Records tab (default):**

History list — each record card shows:
- Date + source (e.g., "RS Pondok Indah" or "20fit Clinic")
- Document type label
- Overall grade badge (A/B/C/D)
- "Uploaded by Dr. [Name]" note if from doctor
- "View Results →" button

**On "View Results"** → opens full result view:

*Document Summary section:*
- Document title, date, patient name, source
- Grade badge (A/B/C/D) with description
- 2-sentence summary (from AI analysis or doctor notes)
- "Uploaded by [Doctor name + specialization]" if doctor-uploaded

*Parameters Found section:*
- "Needs Attention" red card — for each abnormal value:
  - Parameter name + value (JetBrains Mono) + status badge
  - Normal range
  - What this value means (plain language, no diagnosis)
  - Note: "Consult your 20fit doctor for proper advice"
- "Within Normal Range" green card — for normal values:
  - Same fields, less emphasis

*Exercise for Your Results section:*
- 3 service cards (EMS, Personal Training, Physio) each with:
  - Service name + why relevant to their specific values
  - Duration/frequency tags
  - Book → button

*Nutrition for Your Results section:*
- Cards per abnormal finding (e.g., "Because of borderline LDL")
- Bullet list of foods to eat more of + why
- Card for each normal value to maintain
- "Book with nutritionist" CTA

*Your Plan section:*
- 20fit service recommendations as action cards
- Book a session with doctor button

**Upload tab:**
- Choose: Medical Document or Food/Calorie scan
- Method: Take Photo (camera) or Upload from Album
- Processing animation (scan lines)
- Result display → auto-navigates to Records with new entry

**Doctor's Records tab:**
- Same format as user records but with "Uploaded by Dr. [Name]" badge
- Privacy note: "Only visible to you and your 20fit doctor"

#### Data model:
```typescript
interface MCUResult {
  id: string
  uploaded_at: string
  source: 'self' | 'doctor'
  doctor_name?: string
  document_type: string
  grade: 'A' | 'B' | 'C' | 'D'
  summary: string
  parameters: Array<{
    label: string
    value: string
    status: 'ok' | 'high' | 'low' | 'warning'
    normal_range: string
    explanation: string
  }>
  exercise_recs: Array<{ service: string; why: string; frequency: string }>
  nutrition_recs: Array<{ trigger: string; items: string[] }>
  checklist: Array<{ title: string; priority: 'high' | 'med' | 'low' }>
}
```

---

### 5. Progress (`src/pages/Progress.tsx`)

#### 5a. This Week card (dark #0A0908)
- "X%" large red number (weekly task completion)
- 7-day bar chart: today=red, done=dark, partial=grey, future=light grey
- Stats row: Workouts / Tasks Done / Day Streak (Anton 32px each)

#### 5b. Today's Achievements board
- Auto-unlocks based on daily activity:
  - 💧 Hydration Hero (8 glasses) → +50 pts
  - 🌙 Sleep Champion (8h sleep) → +50 pts
  - 🎯 Task Master (3+ tasks) → +75 pts
  - 🔥 Calorie Target (80%+ of goal) → +40 pts
- Total points display
- Empty state: "Complete tasks to earn achievements today!"

#### 5c. Health Reminders
- Next Medical Check-Up: last date + recommended next date + Book → button
- Fitness Assessment: status + Schedule → button

#### 5d. Key Metrics (2-col grid)
- Cards: BMI, Current Weight, Weekly Workouts, Rest Days

#### 5e. Calendar & Workouts (merged into Progress)
Full calendar view:
- Month navigation (← →)
- 7-column day grid
- Each cell shows:
  - Day number
  - Session label (red text, e.g. "Group EMS") if 20fit class booked
  - User workout label (grey text) if self-logged
  - Colored dots: black=self workout, red=booked class
  - Menstrual phase color coding (female): red=menstrual, orange=follicular, yellow=ovulation, purple=luteal

**Tap any cell:** Opens "Plan Your Workout" bottom sheet modal:
- Shows booked 20fit session if exists (with time)
- Workout type selector (pill buttons): 🏃 Run / 🏋️ Gym / 🧘 Yoga / 🚴 Bike / 🏊 Swim / ⚡ EMS / 🤸 Other
- Free text note input
- Save → adds to calendar cell + congrats popup

**Menstrual cycle color legend** (female):
- Menstrual (Day 1-5): rgba(196,17,1,0.12) background
- Follicular (Day 6-13): rgba(255,160,0,0.08)
- Ovulation (Day 14): rgba(255,200,0,0.15)
- Luteal (Day 15-28): rgba(120,80,180,0.08)

**Phase workout recommendations** (female, appears below calendar):
- Card per phase with recommended 20fit services + Book button

---

### 6. Calorie Tracker (`src/pages/CalorieTracker.tsx`)

#### Tabs: Today / Monthly / Food Recs

**Today tab:**
- Calorie ring chart: consumed vs goal
- Macro bars: Protein / Carbs / Fat (progress bars with gram amounts + daily targets)
- Meal log: Breakfast / Lunch / Dinner / Snack with date header
- Food Recommendations section (always visible):
  - Dark header: "Today's Food Plan — Hit [goal] kcal"
  - Remaining kcal badge
  - Meal sections (Breakfast/Lunch/Dinner/Snack) with food cards
  - Each card: emoji + name + description + macro pills + tag
  - "Book with nutritionist" CTA

**Monthly tab:**
- Monthly average stats
- Week-by-week summary list

**Food Recs tab:**
- Same as food recommendation section in Today tab

#### Calorie Goal Calculation:
```
Base goal from profile (default 2000 kcal)
Adjusted by main_goal:
  lose: -300 kcal
  muscle: +300 kcal
  health: ±0
  fit: +100 kcal
```

---

### 7. Profile (`src/pages/Profile.tsx`)

#### Profile Header
- Avatar (circle, 80px): tap to change → file picker → save to localStorage + Supabase Storage
- Full name (editable inline, tap to edit)
- Email (read-only)
- BMI badge + category

#### Editable Sections
Each section has Edit button → inline edit mode → Save:

**Personal Info:**
- Full Name, Date of Birth, Phone, Gender (radio)

**Body Metrics:**
- Height (cm), Weight (kg) — save → recalculate BMI

**Health Goals (editable):**
- Main Goal (4 radio cards)
- Custom goals (add/edit/delete list)
- Health Conditions (multi-select checkboxes + free text)

**Menstrual Settings (female only):**
- Cycle length (number input, default 28 days)
- Last period date

#### Actions
- Log Out button (bottom, red outline) → `supabase.auth.signOut()` → redirect to login
- Delete Account (danger zone, at very bottom)

---

## Interactions & Behavior

### Congrats Popup
Appears whenever a daily achievement is unlocked:
- Fixed bottom-right (or bottom sheet on mobile)
- Icon (large emoji) + title + description
- Animates in from bottom (spring animation)
- Auto-dismisses after 4 seconds or on tap
- Only shows once per achievement per day (localStorage flag)

### Navigation
- Sidebar/bottom nav highlights active page
- Page transitions: fade-up animation (opacity 0→1, translateY 12px→0, 0.28s ease)

### Scan / Upload Flow
1. FAB button "Scan Your Calories" (fixed bottom-right, above bottom nav on mobile)
2. Opens full-screen modal overlay
3. Two options: "Take a Photo" (camera capture) / "Upload from Album" (file picker)
4. Processing screen: scan line animation + "Analysing..." text
5. Result → adds to calorie log or MCU records

### Calendar Workout Modal
- Bottom sheet (mobile) / centered modal (desktop)
- Animates up from bottom
- Backdrop tap closes

---

## State Management

### Supabase Tables (already exist — use existing schema)
- `my20fit_profile` — user profile, updated with new fields
- New fields needed: `main_goal`, `health_conditions`, `menstrual_cycle_length`, `last_period_date`

### localStorage Keys (existing convention `my20fit_*`)
```
my20fit_mcu_result       — latest MCU JSON (existing)
my20fit_checklist_*      — daily tasks (existing)
my20fit_sleep            — sleep log (existing)
my20fit_water            — water log (existing)
my20fit_workout          — workout log (existing)
my20fit_breathing_*      — breathing session per date (new)
my20fit_user_workouts    — calendar workout entries (new)
my20fit_cycle_data       — menstrual cycle settings (new)
```

### New API Endpoints Needed
- `POST /api/analyze-mcu` — already exists (see CLAUDE.md)
- `POST /api/nutrition-recommendation` — already exists
- `GET /api/weather?city=Jakarta` — new (or use existing WeatherAPI key)
- `GET /api/aqi?city=Jakarta` — new (use IQAir or AQICN API)

---

## Assets

### Logo
- `/logo-20fit.jpg` (already in `artifacts/my20fit/public/`)
- Use as `<img>` tag, never as text "my20FIT"

### Icons
- All icons in prototype are inline SVG — recreate using Lucide React (already in codebase) or inline SVG
- Weather icons: custom SVG (cloud, sun, rain, storm)

### Fonts
Already imported in `src/index.css`:
- Anton, Barlow Condensed, Inter, JetBrains Mono

---

## Files in This Package
| File | Description |
|---|---|
| `20fit-login.html` | Login + Register screen (self-contained HTML reference) |
| `20fit-dashboard.html` | Full dashboard prototype (self-contained HTML reference) |
| `Dashboard.dc.html` | Source design file (editable, for design reference only) |
| `Login.dc.html` | Source login design file |
| `README.md` | This document |

---

## Implementation Priority (suggested order)
1. **Register form** — add new fields (birthdate, height, weight, BMI preview, goals)
2. **Home dashboard** — weather+AQI widget, breathing widget, exercise recs widget
3. **Medical Record page** — upload flow + result view with parameter explanations
4. **Calorie Tracker** — food recommendations section
5. **Progress page** — weekly stats, achievements, calendar improvements
6. **Menstrual tracker** — female-only, cycle phase calculation
7. **Profile** — editable sections, health conditions

---

## Notes for Claude Code

1. **Do NOT ship the HTML files** — they are visual references only
2. **Use existing Radix UI + Tailwind** patterns from the codebase — do not introduce new UI libraries
3. **All new Supabase columns** must be added via migration (use `supabase migration new`)
4. **MCU privacy** — medical records are RLS-protected: only `auth.uid() = auth_user_id` can read
5. **Doctor upload** — doctors upload via a separate admin panel (not in scope here); the member can only READ doctor-uploaded records, not edit/delete
6. **No self-diagnosis** — MCU analysis only explains what values mean in plain language; never says "you have X disease"
7. **Breathing timer** — use `setInterval` in a `useEffect` with proper cleanup on unmount
8. **AQI animations** — use Framer Motion (already in codebase) instead of CSS keyframes
9. **Calendar workout entries** — store in `my20fit_workout` localStorage key (already exists), keyed by date
