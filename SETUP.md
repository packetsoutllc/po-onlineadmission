# Backend setup (InsForge)

Follow these steps so the app runs fully on the backend.

## 1. Run migrations

Migrations 003 and 004 have been run. To run the **credentials seed** (005) if needed:

```powershell
npx insforge db import "insforge\migrations\005_seed_credentials.sql"
```

If that fails, run the INSERT manually (short query):

```powershell
npx insforge db query "INSERT INTO credentials (school_id, admission_id, serial_number, index_number, pin_hash) VALUES ('a1000000-0000-4000-8000-000000000001'::uuid, 'b2000000-0000-4000-8000-000000000002'::uuid, 'PSHS001', '12345678901225', '12345')"
```

Repeat for PSHS002/98765432109825, PSHS003/11111111111125, PSHS004/22222222222225 (same school_id and admission_id).

**Test applicant login:** Index e.g. `12345678901225`, Serial `PSHS001`, PIN `12345`.

Run **007** so the admin panel can create/edit/delete schools and admissions on the backend (optional; required for full backend mode):

```powershell
npx insforge db import "insforge\migrations\007_anon_write_schools_admissions.sql"
```

To add **2026 Admissions** (so the portal and Settings can use 2026 in sync with the DB), run migration 006:

```powershell
npx insforge db import "insforge\migrations\006_seed_2026_admission.sql"
```

Then verification and applicant login work for 2026 (e.g. index `12345678901226`, Serial `PSHS001`, PIN `12345`).

### App and database sync

When InsForge is configured, the **public portal** (verification page, protocol page) uses **schools and admissions from the database**, not from the browser’s localStorage. So:

- Only schools and admissions that exist in the DB can be used for verification and applicant flows.
- If the admin selects “2026 Admissions” in Settings, that admission must exist in the DB (run migration 006 above) or verification will fail.
- The **landing page** also loads schools/admissions from the DB when InsForge is configured, so the list matches what the backend supports.

## 2. Set environment variables

1. Copy `.env.example` to `.env` if you don’t have `.env` yet.
2. Get your **anon key** from the InsForge dashboard: Project → API keys (or Settings).
3. In `.env` set:
   - `VITE_INSFORGE_BASE_URL=https://qbbt9d2s.us-east.insforge.app`
   - `VITE_INSFORGE_ANON_KEY=<paste your anon key here>`

4. Restart the dev server (`npm run dev`) after changing `.env`.

## 3. Optional: Admin login with InsForge Auth

- Create an admin user in InsForge: Dashboard → Auth → Users → Add user (email + password).
- On the app’s admin login screen, sign in with that email and password. The app will use InsForge Auth first; if it fails, it falls back to the mock user list (e.g. admin@peki.edu / password123).

See `BACKEND.md` for full backend details.
