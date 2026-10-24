# Project Ivy — by Infoma

Real-estate operations platform: public unit browsing with 3D tours, role-based
dashboards, a tiered Paystack payment engine (autopay, invoices, receipts),
real-time chat/tickets/ledger, and a full admin toolkit. Next.js 15 (App Router)
on Vercel + Supabase (Postgres, Auth, Storage, Realtime) + Paystack.

## Roles

| Role | What they can do |
|---|---|
| **Super Agent** | Everything: create/edit/delete users, "log in as", edit/delete listings, approve withdrawals, Activity Logs, System Info (revenue tiers + architecture) |
| **System Agent** | Assists with day-to-day approvals: lease applications, role requests, ticket status, read-only Activity Logs. No user deletion, impersonation, withdrawals, or listing deletion |
| **Project Manager** | Approves applications, manages tickets |
| **Landlord** | Lists properties, sees only their own, creates Project Manager / Client accounts ("My Team"), invoices tenants, requests withdrawals |
| **Maintenance** | Works tickets |
| **Client** | Browses/applies for units, pays rent (M-Pesa/card), autopay, receipts |

Any user can request an **additional role** (e.g. a client who also owns property → landlord) from **My Profile**; a Super/System Agent approves it under **Approvals**.

## Fastest fix for any "table not found" / "violates row-level security" error

If you see **"Could not find the table 'public.role_requests' in the schema cache"** (or similar for
`invoices`, `audit_logs`, or lease applications), a migration was skipped. Don't hunt for which one —
run the one self-healing script instead. It is idempotent (safe on any database state, safe to run twice)
and was tested against a real Postgres:

1. SQL Editor → run **only** this line, let it finish:
   `alter type user_role add value if not exists 'system_agent';`
2. SQL Editor → open `supabase/catch_up.sql` in a text editor, **copy its contents** (not the filename), paste, run.

It also refreshes Supabase's API schema cache, which is what clears the "schema cache" error.

## Run these migrations, in this exact order

Paste each file's **contents** (not the filename) into Supabase → SQL Editor, one file per run.

1. `20260603000000_init.sql` — core schema, RLS, seeded Super Agent (`mwangimuga161@gmail.com`, forced password change)
2. `20260706000000_financial_engine.sql` — tiered split functions, withdrawals, tickets, storage buckets
3. `20260710000000_lease_applications.sql` — lets clients apply for a lease
4. `20260710000001_super_agent_email.sql` — only if you ran an older seed with a different email
5. `20260711000000_public_listings_and_admin.sql` — anonymous browsing of active listings, `audit_logs`, admin delete rights
6. `20260722000000_system_agent_role.sql` — **run ALONE and let it finish first** (Postgres won't let a new enum value be used in the same transaction that creates it)
7. `20260722000001_multi_role_and_system_agent.sql` — additional roles, role requests, System Agent permissions
8. `20260722000002_payments_expansion.sql` — autopay, invoices, receipt reference, autopay eligibility function

If a feature errors with "violates row-level security" or "type does not exist", a migration above never ran — check with:
`select policyname, tablename from pg_policies where schemaname = 'public' order by 2, 1;`

Optional one-time resets: clear financial history with
`truncate table public.ledgers restart identity cascade; truncate table public.withdrawal_requests restart identity cascade;`

## Environment variables (Vercel → Settings → Environment Variables, all three environments)

`NEXT_PUBLIC_SUPABASE_URL` (bare `https://<ref>.supabase.co`, no path) · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `PAYSTACK_SECRET_KEY` · `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` · `CRON_SECRET` (any long random string)

Env var edits don't apply to a build that already ran — **redeploy after saving them**.

## Supabase settings

- Authentication → **Confirm email: ON**
- Authentication → URL Configuration: **Site URL** and **Redirect URLs** = your production domain
- Super Agent first login: `mwangimuga161@gmail.com` — **change the seeded password immediately**

## Paystack

- Webhook URL: `https://<your-domain>/api/webhooks/paystack` (HMAC-SHA512 verified). Handles `charge.success`, `transfer.success/failed`, `paymentrequest.success/pending`.
- **Autopay is card-only**: a reusable authorization is saved after a successful *card* payment; M-Pesa charges can't be reused. The UI says so.
- **Invoices** use Paystack Payment Requests (Paystack emails the client the link).
- **Receipts** are generated in-app from the ledger entry after the webhook confirms payment; printable/PDF via the browser.

## Cron (vercel.json)

- `/api/cron/charge-rent` — 1st of each month, posts rent charges
- `/api/cron/autopay-charge` — 3rd of each month, charges saved cards for leases with autopay on

## Behaviour worth knowing

- **Inactivity timeout**: signed out after 20 min idle; only signing in again restores access.
- **Retry logic**: transient network/5xx failures are retried quietly with backoff and show "taking longer than expected" before ever showing an error. Withdrawal requests are deliberately *not* auto-retried (a retry after a lost response could create a duplicate).
- **Sign in with email or username.**
- **Dark/light mode**: toggle in the dashboard top bar (saved per browser, defaults to your OS setting). The sidebar stays dark by design. Public pages use a fixed light design with a dark hero.
- **"Log in as"** replaces the Super Agent's session in that browser tab; sign out and back in to return. Every use is written to the audit log.
- **Mobile**: sidebar becomes a slide-in drawer; multi-column layouts stack on phones.

## Local development

```
cp .env.local.example .env.local   # fill in values
npm install
npm run dev
```

## Honest limitations

Built and verified with full production builds, but never run against a live Supabase/Paystack from the build environment — the first real payment, webhook, and signup flows are the real test. Brand colours are exact (extracted from Infoma's logo SVG); the Poppins typeface is a close visual match, not confirmed from their CSS.
