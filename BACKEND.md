# InsForge Backend — po-onlineadmission

This project uses [InsForge](https://insforge.dev) as the backend. Database, storage, and edge functions are managed via the InsForge CLI and the `@insforge/sdk` client in the frontend.

## Project link

- **Project:** po-onlineadmission  
- **App key:** `qbbt9d2s`  
- **Region:** us-east  
- **Backend URL (OSS host):** `https://qbbt9d2s.us-east.insforge.app`

Local link is stored in `.insforge/project.json`. Do not commit this file to version control.

## CLI

```bash
# Auth and project
npx insforge whoami
npx insforge current
npx insforge metadata --json

# Database
npx insforge db tables
npx insforge db query "SELECT * FROM schools LIMIT 5"

# Storage
npx insforge storage buckets

# Functions
npx insforge functions list
npx insforge functions invoke verify --data '{"schoolSlug":"peki-senior-high","admissionSlug":"2025-admissions","indexNumber":"12345678901225"}'

# Secrets (list only; values are hidden)
npx insforge secrets list
```

## Database tables

| Table | Purpose |
|-------|---------|
| `schools` | Schools (name, slug, logo, status, home_region) |
| `admissions` | Admission types per school (title, slug, portal_status, etc.) |
| `programmes` | Programmes per school |
| `classes` | Classes per school |
| `houses` | Houses per school |
| `dormitories` | Dormitories per house |
| `students` | Placed/admitted students (index_number, name, programme, etc.) |
| `application_data` | Applicant form submissions (JSONB `data`) |
| `credentials` | Serial/PIN for applicant login |
| `submission_status` | Application submission state per applicant |
| `payment_status` | Payment state (initial / doc_access) per applicant |
| `financials_settings` | Voucher price, doc access fee per school/admission |
| `form_settings` | Dynamic form config (name_system, fields JSONB) |
| `admission_settings` | Admission behaviour (JSONB settings) |
| `document_access_settings` | Doc unlock and visibility |
| `correction_requests` | Official record correction requests |
| `admin_roles` | Admin role definitions |
| `admin_permissions` | Role–permission (page/action) mapping |
| `admin_user_roles` | Links auth.users to admin_roles |
| `activity_logs` | Audit log |
| `sms_notification_log` | SMS send log |

## RLS

- **anon:** Can `SELECT` on `schools` and `admissions`. For demo/app without InsForge Auth, anon has full access on `students`, `credentials`, `payment_status`, `submission_status`, `application_data`, `financials_settings`, `form_settings`, `admission_settings` so the frontend (using anon key) can read/write all app data.
- **authenticated:** Full access on all tables (for future admin auth).

## RPCs

- `verify_placement(p_school_slug, p_admission_slug, p_index_number)` — Returns `{ found, student? }` for placement check. Callable by anon.
- `applicant_validate_credentials(p_school_id, p_admission_id, p_serial_number, p_pin)` — Returns `{ valid, indexNumber?, schoolId?, admissionId? }`. Callable by anon.

## Storage buckets

| Bucket | Visibility | Use |
|--------|------------|-----|
| `school-logos` | Public | School logos |
| `applicant-photos` | Private | Passport photos |
| `generated-documents` | Private | Generated PDFs |

## Edge functions

| Slug | Name | Purpose |
|------|------|--------|
| `verify` | Verify placement | POST `schoolSlug`, `admissionSlug`, `indexNumber` → placement result |
| `applicant-auth` | Applicant auth | POST `schoolId`, `admissionId`, `serialNumber`, `pin` → credentials check |
| `payment-callback` | Payment callback | POST `schoolId`, `admissionId`, `indexNumber`, `paymentType`, `reference` → record paid (uses API_KEY) |
| `sms-send` | SMS send | POST `schoolId`, `admissionId?`, `indexNumber?`, `phoneNumber`, `messageType?` → log and optionally send (uses API_KEY) |
| `ai-chat` | AI chat | POST `messages`, `model?`, `systemInstruction?` → chat completion |

Base URL for invoke: `https://qbbt9d2s.us-east.insforge.app/functions/{slug}`

## Secrets (InsForge)

Set via `npx insforge secrets add KEY value`. Required for edge functions:

| Key | Used by | Purpose |
|-----|---------|---------|
| `INSFORGE_BASE_URL` | All functions | Backend base URL (e.g. `https://qbbt9d2s.us-east.insforge.app`) |
| `ANON_KEY` | verify, applicant-auth, ai-chat | Public anon key for DB/AI |
| `API_KEY` | payment-callback, sms-send | Service/admin key for writes and SMS log |

Optional for payment/SMS providers:

- `PAYSTACK_SECRET_KEY` or `FLUTTERWAVE_SECRET_KEY` — payment webhook verification / capture.
- `SMS_API_KEY` / `SMS_SENDER_ID` — external SMS provider.

## Frontend env (Vite)

For the app to use InsForge instead of localStorage:

- `VITE_INSFORGE_BASE_URL` — same as OSS host (e.g. `https://qbbt9d2s.us-east.insforge.app`).
- `VITE_INSFORGE_ANON_KEY` — anon key from InsForge dashboard (or project settings).

If these are unset, the app falls back to localStorage for schools/admissions and other data.

## Migrations

SQL migrations live under `insforge/migrations/`. Run in order: 000, 001, 002, then 003 (app tables + anon policies), then 004 (seed). Run manually, e.g.:

```powershell
$sql = (Get-Content -Raw "insforge\migrations\001_verify_placement.sql") -replace "`n", " "
npx insforge db query $sql
```

Or use the script: `npm run db:migrate` (if configured).

## Seed data

To seed schools and admissions from the app’s initial data, use the admin UI (Settings) or run `insforge db query` with `INSERT` statements targeting `schools` and `admissions`. Use UUIDs for `id` and `school_id`/`admission_id` and match slugs (e.g. `peki-senior-high`, `2025-admissions`) for compatibility with the verify function. Run 004_seed_data.sql (after 003) for Peki SHS, 2025-admissions, and four sample students; store plain PIN in credentials.pin_hash for RPC if not hashing.

## Admin auth (optional)

When `VITE_INSFORGE_BASE_URL` and `VITE_INSFORGE_ANON_KEY` are set, the admin login form first tries InsForge Auth (signInWithPassword). Create an admin user in the InsForge dashboard (Auth → Users) or by signing up once; then use that email/password to log in. On success the app uses the session so RLS sees the user as authenticated. If InsForge sign-in fails, the app falls back to the in-memory mock user list.
