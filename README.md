# Floria Korean Beauty — Full-Stack E-Commerce Platform

Complete Korean skincare e-commerce storefront, Cash on Delivery checkout, WhatsApp inquiry/order workflow, bilingual English & বাংলা interface, and full-featured Admin Dashboard tailored for Bangladesh (BDT / ৳).

## Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Lucide Icons
- **Backend**: Express.js (`server.ts` + `backend/`) with REST API, rate limiting, `scrypt` password hashing, and HMAC-SHA256 Bearer token auth
- **Database**:
  - **Built-in Persistent Mode**: SQLite via `better-sqlite3` (`database/floria.db`) initialized automatically with all 21 relational tables, ACID transactions, and demonstration seed data (22 Korean skincare products, 9 categories, 14 brands, shipping zones, coupons, and labeled demonstration reviews).
  - **PostgreSQL / Supabase Production Ready**: Complete SQL schema, Row Level Security migration, and seed files provided under `database/schema.sql`, `database/migrations/001_initial_schema.sql`, and `database/seed.sql`.

## Official Business Details Preloaded

- **Brand**: Floria Korean Beauty
- **Phone**: `01805-133476`
- **WhatsApp**: `+880 1805-133476` (`https://wa.me/8801805133476`)
- **Address**: `Demra, Dhaka-1361, Bangladesh`
- **Currency**: Bangladeshi Taka (`BDT / ৳`)

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the full-stack Express + Vite server on port `3000`:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   npm start
   ```

## Administrator Setup

- Visit `/admin/login`.
- On first run (when `ADMIN_PASSCODE` is not set in environment secrets and no administrator exists yet), `/admin/login` displays a secure **Initial Administrator Setup** form.
- Creating the first admin account hashes your password with `crypto.scryptSync` and locks the setup route automatically.
- Alternatively, set `ADMIN_EMAIL`, `ADMIN_PASSCODE`, and `SESSION_SECRET` in your environment variables before deploying.

## Environment Variables (`.env.example`)

| Variable | Purpose | Required in Dev? |
| --- | --- | --- |
| `SESSION_SECRET` | HMAC-SHA256 token signing key | Optional (uses runtime random secret if unset) |
| `ADMIN_EMAIL` | Optional admin login email override | Optional |
| `ADMIN_PASSCODE` | Optional admin password override | Optional |
| `DATABASE_URL` | PostgreSQL connection string for external DB migration | Optional |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Supabase project credentials if migrating to Supabase | Optional |

## Production Migration Notes (Supabase / PostgreSQL)

1. Provision a Supabase or PostgreSQL database.
2. Execute `database/schema.sql` followed by `database/migrations/001_initial_schema.sql` and `database/seed.sql`.
3. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (server-side only) when deploying to Vercel/Render/Railway.
4. Keep `ADMIN_PASSCODE` or claimed administrator credentials active and never expose service-role keys to client code.
