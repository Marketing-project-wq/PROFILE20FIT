# CODEBASE-MAP — my.20fit.id

> TASK 0 orientation doc. Read-only survey of the repo as it stands on `staging`.
> No code was changed to produce this. Goal: give a fast, accurate mental model
> before any feature/fix work (TASK 1+).

## 1. Stack & versions

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥18, **Express 4** (`server.js`, ~4600 lines, 121 routes) |
| Frontend | **Vanilla HTML/CSS/JS** — no framework/bundler. Pages = static `.html` at repo root; shared logic in `js/*.js` (plain `window.*` globals). Charts = inline SVG. |
| Styling | Per-page `<style>` + two shared sheets: `css/20fit-design-system.css` (tokens/components, `--fit-*`) and `css/glass-app.css` (flat "v4" skin, loaded last, remaps tokens + dark mode). |
| DB / Auth | **Supabase** (Postgres + Auth + Edge Functions). Shared project `cpvzwqptzcxnwzfzgrmt` — **only touch `my20fit_*` tables** (hundreds of other-app tables share it). RLS deny-public; server uses service key. |
| Deploy | **Railway** — `main` = production (my.20fit.id), `staging` = staging env. Auto-deploy per branch. |
| Email | **Resend** (single path via `lib/email.js`). Consent/suppression/frequency in `lib/comms.js`. Webhook `/api/webhooks/resend` (Svix-verified). (nodemailer/SMTP/Mailtrap fully removed.) |
| Payments | **Xendit via the 20FIT API** (not Xendit direct). No webhook to this app; credits via polling + `/api/scan/reconcile` sweep. |
| External | FITCO API (login/register/SSO/reset), Meta Pixel + CAPI, WAQI (air quality), OpenWeather, TheMealDB/Pexels (food photos), OpenRouter (AI, via edge fns). |
| Deps | `@supabase/supabase-js`, `express`, `express-rate-limit`, `helmet`, `dotenv`. That's it. |

**Server-side service layer (`lib/`):** `email.js` (Resend send — the one email path), `comms.js` (consent, suppression, unsubscribe tokens, frequency gate), `campaigns.js` (meal-reminder + onboarding-drip engines + templates + monitoring), `blast.js` (segment blast queue + automations), `segments.js` (7 preset segments + eligibility filter).

**Static serving guard** (`server.js:4555`): blocks `server.js`, `package*.json`, `railway.toml`, `README.md`, `CLAUDE.md`, and dirs `db/ supabase/ docs/ archive/ node_modules/ lib/ .git/` from being fetched; `dotfiles:ignore` hides `.env`. HTML/JS/CSS served `Cache-Control:no-cache` (revalidate every load → no stale UI after deploy). `/x.html` 302-redirects to clean `/x`.

---

## 2. Admin pages

| Page | Route | Purpose |
|---|---|---|
| `admin.html` | `/admin` | Pure redirect → `/admin-dashboard`. |
| `admin-dashboard.html` | `/admin-dashboard` | Main admin console. Auth gate via `/api/admin/me`; `adminFetch()` sends `Authorization: Bearer <JWT>` (or `x-admin-key`). Tabs: **Overview** (KPIs/sales), **Voucher**, **Transaksi** (Xendit history), **Pengguna** (users, funnel, CSV export), **Analitik** (MoM/funnel/retention), **Sumber Trafik** (UTM), **Minat Menu**, **Corporate** (superadmin), **Menu** review (superadmin), **Settings** roles/config/audit (superadmin). Superadmin-only tabs hidden in UI + re-enforced server-side. |
| `admin-email.html` | `/admin-email` | Email & Campaign console (separate page). 6-step **blast wizard** (segment → preview → template+subject → mandatory self-test → type-name confirm → progress w/ pause/resume/cancel), per-campaign **kill switch**, onboarding & meal-reminder metrics (30d), suppression list. Supports `?key=<ADMIN_KEY>` master override. |
| `corp-dashboard.html` | `/corp-dashboard` | Corporate client console. Login = Supabase pw (FITCO fallback) → `/api/corp/me`. Employee health/usage roster (non-diagnostic), per-member modal, CSV, and "Kirim Pesan" (email filtered members). Cross-company isolation enforced server-side (`requireCorpAdmin`). |

### Admin API (`/api/admin/*`, ~53 routes; all call `requireAdmin` first)
- **Auth/roles/audit:** `/me`, `/roles` (GET/POST/DELETE), `/audit`.
- **Email/campaigns:** `/email/overview`, `/email/suppression` (GET/POST), `/email/killswitch`, `/email/segments`, `/email/segment/preview`, `/email/templates`, `/email/send/create|test|confirm|pause|resume|cancel`, `/email/send/:id`, `/email/sends`, `/email/automations` (+`/:id/toggle`, `/:id/dryrun`).
- **Users/analytics:** `/metrics`, `/users`, `/user-detail`, `/top-products`, `/analytics`, `/onboarding-scan`, `/onboarding-recap`, `/attribution`, `/menu-analytics`, `/export-csv` (staff+).
- **Vouchers:** `/vouchers` (GET/POST/PATCH), `/:id`, `/:id/activate|deactivate`.
- **Transactions:** `/transactions`, `/transactions/:reff`.
- **Corporate (superadmin):** `/corporate` (GET/POST), `/corporate/:id` (GET/PATCH), `/corporate/:id/admins` (POST/DELETE).
- **Menu review (superadmin):** `/menu`, `/menu/:id/approve|reject`.
- **Config/diag (superadmin):** `/config`, `/payment-probe`.

### Admin RBAC (`server.js:1799-1841`)
- Roles + rank: `marketing:1, viewer:1, staff:2, superadmin:3`. `marketing` = viewer-rank but **barred from health data** (`adminCanSeeHealth` false → health fields trimmed server-side on `/users`, `/user-detail`).
- `getAdminContext`: master key (`ADMIN_KEY` env via `x-admin-key` header **or** `?key=`) → superadmin; else Supabase JWT → `my20fit_admin_roles` lookup.
- `requireAdmin(req,res,minRole)` → 401 (no ctx) / 403 (under-rank), first line of every admin route. `adminAudit()` → `my20fit_admin_audit_log` on every mutation.

### Corporate API (`/api/corp/*`)
`/me`, `/summary` (roster+KPIs), `/member/:uid` (audited), `/message`, `/messages` (corp-admin); `/validate-code`, `/join`, `/membership`, `/leave` (member self-service, keyed on caller's own id). Access → `my20fit_corporate_access_log`.

---

## 3. User pages

Canonical URLs are extensionless. Special routes: `/payment/pending`+`/payment/success` → `payment-pending.html`; `/payment/failed` → `payment-failed.html`; 404 → `index.html`.

| Page | Route | Purpose | Key endpoints |
|---|---|---|---|
| `index.html` | `/` | Meta-refresh → `/login`. | — |
| `login.html` | `/login` | Auth entry: 20FIT(FITCO) login/register, Supabase pw fallback, Google, SSO-token. | `/api/fitco-login\|register\|google-login\|token-login`, `/api/config` |
| `code-login.html` | `/code-login` | Passwordless OTP login (existing accounts). | edge `my20fit-otp`, Supabase `verifyOtp` |
| `verify.html` | `/verify` | Verify 20FIT email via OTP before onboarding. | `/api/fitco-verify-email`, `/api/fitco-resend-verify-email` |
| `reset-password.html` | `/reset-password` | Forgot/reset password via 20FIT API. | `/api/fitco-forgot`, `/api/fitco-reset` |
| `setpassword.html` | `/setpassword` | Set a Supabase web password (post-onboarding). | `Auth.setWebPassword` |
| `onboarding.html` | `/onboarding` | Collect profile (gender/dob/height/weight/goal/conditions) + **email consent**. | `Auth.saveOnboarding` → `my20fit_profile`, `/api/comms/consent` |
| `dashboard.html` | `/dashboard` | Home hub: weather/AQI, recommended workouts, breathing, fasting, cycle, achievements, Photo progress, home-prefs sync. | `/api/weather`, `/api/aqi`, `/api/photo/*` |
| `calories.html` | `/calories` | Food scan (AI photo + text), log, per-item verdict + swaps + "what to eat next", IF, scan-credit top-up. | `/api/scan/ai\|food-text\|food-correction\|consume`, deals |
| `diet.html` | `/diet` | Browse official recipes by diet type. | `/api/menu/open`, `/api/foodphoto` |
| `medical.html` | `/medical` | Upload/analyze MCU docs via AI, bilingual translation, BMI. | edge `my20fit-ai` (`mcu`/`translate`) |
| `progress.html` | `/progress` | Weight/measurement charts, achievements, cycle, fasting/arena history. | `/api/arena/history`, Supabase reads |
| `profile.html` | `/profile` | Account/profile, order history, top-up, account deletion, email prefs. | `/api/scan/order-cancel`, `/api/account/delete` |
| `classes.html` | `/classes` | 20FIT class schedule per venue. | `/api/classes/schedule` |
| `unsubscribe.html` | `/unsubscribe` | Manage email prefs via tokened link, **no login**. | `/api/unsub/prefs`, `/api/unsub/apply` |
| `payment-pending.html` | `/payment/pending`,`/success` | Post-checkout; polls until credits confirmed. | `/api/payment/status` |
| `payment-failed.html` | `/payment/failed` | Failure landing → retry `/calories`. | — |
| `privacy.html` | `/privacy` | Static privacy policy. | — |

### Shared JS modules (`js/`)
`auth.js` (Auth: Supabase client, FITCO login, OTP, profile CRUD, scan quota, routing; `Auth.ready` is a Promise, `Auth.token()`), `i18n.js` (EN/ID, `window.L`, lang toggle, `localStorage.lang`), `nav.js` (sidebar + bottom-nav + Scan FAB), `recipes.js` (recipe dataset + food-photo resolver), `nutrition.js` (healthy-food composer), `fasting.js` (IF styles/timer), `deals.js` (scan-credit top-up flow), `tour.js` (per-page walkthroughs), `cycle.js` (menstrual phase tips), `achievements.js` (badges), `orders.js` (per-device order history — **not authoritative**), `pw-toggle.js` (password show/hide), `meta-pixel.js` (Pixel + CAPI dedup).

### Main flow & auth
`/` → `/login` → `Auth.fitcoLogin` (server verifies vs FITCO, provisions Supabase acct, returns OTP → client seats Supabase session) → `Auth.routeAfterAuth()` gates: unverified→`/verify`, incomplete profile→`/onboarding`, no web pw→`/setpassword`, else→`/dashboard`. `Auth.token()` = Bearer for all `/api/*` + edge fns. Payment: `Deals.open()`→`/api/scan/buy`→20FIT Xendit invoice; credits via polling + `/api/scan/reconcile` (idempotent RPC `my20fit_credit_scan`).

---

## 4. Email system (where everything lives)

| Concern | Location |
|---|---|
| **Provider / send** | `lib/email.js` (Resend). `EMAIL_ENVIRONMENT`+`EMAIL_TEST_WHITELIST` gate non-prod sends (logged `skipped_env`, not sent). |
| **Consent / suppression / frequency / unsubscribe tokens** | `lib/comms.js` (`canSend`, `addSuppression`, token gen). Buckets: transactional (OTP — always), meal-reminder, marketing. |
| **Campaign engines + templates** | `lib/campaigns.js` (meal-reminder engine, onboarding 4-step drip, decay/dormant, monitoring). `lib/segments.js` (7 presets + `applyEligibility`). `lib/blast.js` (blast queue batching, per-recipient re-check, idempotency, kill switch, auto-abort, automations). |
| **Triggers** | Cron endpoints (header `x-cron-secret`): `/api/cron/fasting-notify`, `/api/cron/meal-reminders`, `/api/cron/daily` (onboarding+decay+monitor+automations), `/api/cron/email-queue` (blast batch). Transactional: OTP on login/register. |
| **Delivery events** | Webhook `/api/webhooks/resend` (Svix-verified): delivered/opened/clicked/bounced/complained → suppression on hard-bounce/complaint. |
| **Admin UI** | `admin-email.html` + `/api/admin/email/*`. |
| **User prefs UI** | `unsubscribe.html` (tokened, no login) + `/api/unsub/*`; consent capture in `onboarding.html`/`profile.html` → `/api/comms/consent`. |
| **Docs** | `docs/EMAIL_MIGRATION_HANDOVER.md` (Resend migration, env, manual setup checklist), `docs/EMAIL_BLAST_HANDOVER.md` (blast/segments/automation). |

> **Status:** the email stack is **code-complete** but gated on manual setup — Resend domain verify (SPF/DKIM/DMARC), env vars (`EMAIL_RESEND_API`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`…), cron scheduler wiring, and **consent collection** (opt-in; currently ~0). Analytics (open/click) depend on the Resend webhook being connected. See TASK 4 verification before any real send.

---

## 5. Database tables (user & email; `my20fit_*` only)

**User / profile / activity:** `my20fit_profile` (877 rows), `my20fit_daily_log`, `my20fit_health_entry`, `my20fit_workout`, `my20fit_mcu_result`, `my20fit_fasting`, `my20fit_user_activity`, `my20fit_signup_attribution`.
**Scan / commerce:** `my20fit_scan_orders`, `my20fit_scan_ledger`, `my20fit_vouchers`, `my20fit_voucher_usages`, `my20fit_foodimg` (AI diet-photo cache), `my20fit_food_ref` (internal food dictionary, grows from corrections).
**Menu contributions:** `my20fit_menu_contribution`, `my20fit_menu_reward_log`, `my20fit_menu_event`.
**Admin / corporate:** `my20fit_admin_roles`, `my20fit_admin_audit_log`, `my20fit_corporate(_admin/_member/_access_log/_message_log)`.
**Email / comms:** `my20fit_message_log`, `my20fit_user_comm_prefs`, `my20fit_suppression_list`, `my20fit_campaign_enrollments`, `my20fit_campaign_flags`, `my20fit_email_sends`, `my20fit_email_send_recipients`, `my20fit_email_automations`, `my20fit_email_automation_log`, `my20fit_inbox_messages`, `my20fit_email_otp`.
**Auth:** `my20fit_email_otp`. **RPCs:** `my20fit_credit_scan`, `my20fit_consume_scan`, `my20fit_food_ref_learn`, `my20fit_grant/revoke_menu_reward`.
Migrations in `db/` (001 fitco-binding → 009 email-automations); applied manually via Supabase SQL editor.

**Edge functions** (`supabase/functions/`): `my20fit-ai` (MCU/food/translate via OpenRouter), `my20fit-foodimg` (diet-photo generation, key from env/Vault). (Other edge fns exist in the shared project but belong to other apps.)

---

## 6. Fragile / risky spots (for the audit, TASK 1)

1. **Master key accepted in URL `?key=`** (`getAdminContext`, and `admin-email.html`/dashboard). Query strings leak into history/proxy logs/`Referer` — a superadmin credential in a URL is riskier than the header form. *Recommend: header-only.*
2. **Health-data trimming is per-route, opt-in.** Marketing exclusion relies on each health endpoint calling `adminCanSeeHealth` + pruning. Any **new** profile-returning endpoint must repeat it — easy to forget. *Recommend a shared serializer.*
3. **Admin routes are hand-guarded, not middleware-mounted.** All 53 currently call `requireAdmin` line 1 (good), but there's no structural guarantee for future routes. Email routes are defined ~1300 lines before the RBAC helper declarations — works only via function hoisting; refactor to `const` arrows would break them (TDZ).
4. **Duplicated hard-coded Supabase URL + anon key** in `js/auth.js` **and** `medical.html` (bypasses `/api/config`). Anon key is public (not a leak) but rotation can silently drift on the medical page.
5. **`my20fit-ai` edge function has a hardcoded OpenRouter fallback key** in its deployed source (`||"sk-or-…"`). Live secret in code — rotate + remove once env `OPENROUTER_API_KEY` confirmed set.
6. **Payment credit delivery has no webhook**; cross-device credit depends entirely on the `/api/scan/reconcile` sweep. If it fails, credits lag with no fallback.
7. **`orders.js` order history is per-device localStorage** — not authoritative; can show stale/missing orders across devices.
8. **Login couples to FITCO availability** for first-time/Google/OTP-only users (Supabase pw is only a fallback for accounts that set one).
9. **Email system not yet live** — needs domain/DNS (SPF/DKIM/DMARC), env, cron, and consent before any send; open/click analytics need the Resend webhook connected. Backlog risk if cron is switched on with stale schedules (see TASK 4).
10. **RLS advisory (Supabase):** 73 tables in the shared project have RLS disabled (mostly *other* apps: `cf_/rb_/arena_/clinic_/shop_/uob_…`); most `my20fit_*` have RLS on. Cross-app concern for the backend owner, not this repo alone.

---

*Generated for TASK 0. Nothing was changed. Awaiting your review before TASK 1.*
