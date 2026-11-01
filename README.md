# Project Ivy — by Infoma

Real-estate operations platform: public unit browsing with 3D tours, role-based dashboards,
a tiered Paystack payment engine (autopay, invoices, receipts), landlord verification,
tenancy ending with automatic expiry, real-time chat/tickets/ledger, and a legal-terms
acceptance system. Next.js 15 (App Router) on Vercel + Supabase + Paystack.

## Roles

| Role | What they can do |
|---|---|
| **Super Agent** | Everything: users, "log in as", listings, withdrawals, verifications, Activity Logs, System Info |
| **System Agent** | Day-to-day approvals: leases, role requests, **landlord verifications**, tickets, tenancies, read-only logs. No user deletion, impersonation, withdrawals, listing deletion, or ledger access |
| **Project Manager** | Platform-wide **only if created by an administrator**. A PM created by a *landlord* is scoped to that landlord's properties |
| **Landlord** | Lists properties (live once **verified**), sees only their own, ends tenancies, invoices tenants, withdraws, creates Project Managers/Clients ("My Team") |
| **Maintenance** | Works tickets |
| **Client** | Browses/applies, pays rent, autopay, receipts, sees tenancy notices |

## IF ANYTHING SAYS "table not found", "schema cache", or "row-level security" — run the catch-up script

`supabase/catch_up.sql` brings **any** database state fully up to date. It is idempotent (safe to run
twice) and was tested against a real Postgres, including attack scenarios.

1. SQL Editor → run **only** this line, let it finish:
   `alter type user_role add value if not exists 'system_agent';`
2. SQL Editor → open `supabase/catch_up.sql` in a text editor, **copy its contents** (not the filename), paste, run.

It also refreshes Supabase's API schema cache. Paste the **contents**, never the filename.

Fresh installs can instead run `supabase/migrations/*.sql` in filename order (the `system_agent_role`
migration must run alone first).

## What the latest hardening fixed (important)

The original schema had holes that the catch-up closes — run it even if everything "seems fine":

- **Anyone could promote themselves to Super Agent** by editing their own profile row. Now blocked.
- **Anyone could sign up as any role** by sending a role in signup metadata. Self-signup now only ever yields `client` or `landlord`; staff are created server-side.
- **Landlord-created Project Managers had platform-wide access** to every landlord's leases and ledgers. Now scoped.
- **Payment/ledger functions were callable by any logged-in user** through Supabase's RPC (e.g. marking your own rent paid). Now service-role only.
- The audit log allowed forged entries. Now only triggers/the server can write.

## Landlord verification

Landlord → **My Profile → Landlord verification**: legal name, ID number, phone, KRA PIN (optional), proof
of right to let (title deed / lease with authority / management mandate), ID photo (+ optional selfie).
Files go to a **private** bucket (`verification-docs`) visible only to that landlord and administrators.
Super/System Agents review under **Approvals** (documents open via 2-minute signed links), then
approve, or decline with a note. Until approved, a landlord's listings can only be drafts — enforced
**in the database**, not just the UI. Approved landlords get a "Verified landlord" badge on listings.

Reviewer checklist: ID matches legal name; ownership document names the applicant or the owner who
authorised them; confirm title deeds with an official land-registry search.

## Ending tenancies

**Tenancies** screen (landlords, PMs, System/Super Agent): *End tenancy* with a reason and either a
future date (a **notice** the tenant sees; can be withdrawn) or today (immediate). The date can never
extend a tenancy. Timed tenancies **end automatically** after their end date (daily job); the unit becomes
available again, rent charges and autopay stop, unpaid balances stay payable. The dialog requires the
user to confirm lawful notice was given — the tool records a decision, it is not a substitute for legal process.

## Legal terms

Public at `/terms`. Text lives in `src/lib/legal.ts`; fees in `src/lib/feeSchedule.ts` (the money is
computed in Postgres — keep both in step). Everyone must accept the current `TERMS_VERSION` (landlords
also the Landlord Agreement) before using the dashboard; acceptances are stored with version + time.
Change the substance → bump `TERMS_VERSION` → everyone re-accepts. **The text is a draft template, not
legal advice — have a Kenyan advocate review it.** Points to raise with them:

- Data Protection Act 2019: you store national IDs → likely registration with the Office of the Data Protection Commissioner.
- Whether listing/leasing counts as estate agency (Estate Agents Act) and needs registration.
- **Holding landlords' balances in your own ledger** may fall under payment-services regulation. Paystack *subaccounts / split payments* settle directly to the landlord and take your cut automatically, which avoids you holding funds — worth asking about.
- Tenancy statutes (e.g. Rent Restriction Act; Landlord and Tenant (Shops, Hotels and Catering Establishments) Act) govern notice and eviction.
- Fill in your registered business name in `OPERATOR.registration`.

## Environment variables (Vercel, all three environments)

`NEXT_PUBLIC_SUPABASE_URL` (bare `https://<ref>.supabase.co`) · `NEXT_PUBLIC_SUPABASE_ANON_KEY` ·
`SUPABASE_SERVICE_ROLE_KEY` · `PAYSTACK_SECRET_KEY` · `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` · `CRON_SECRET`.
Env changes need a **redeploy** to apply.

## Supabase settings

Authentication → **Confirm email ON**; URL Configuration → Site URL + Redirect URLs = your domain.
First Super Agent login: `mwangimuga161@gmail.com` — change the seeded password immediately.

## Paystack

Webhook: `https://<domain>/api/webhooks/paystack` (HMAC-SHA512 verified). Autopay is **card-only**
(M-Pesa authorisations aren't reusable). Invoices use Paystack Payment Requests. Receipts are generated
in-app after the webhook confirms payment.

## Scheduled job (vercel.json)

**One** daily job, `/api/cron/daily` at 01:00 UTC (04:00 Nairobi) — consolidated because Vercel's free
plan limits cron jobs. Every day: end expired tenancies. 1st of month: post rent charges. 3rd: autopay.
Manual run: `/api/cron/daily?force=expire,rent,autopay` with `Authorization: Bearer $CRON_SECRET`.

## Behaviour worth knowing

- Signed out after 20 min idle; Back-button after logout can't resurrect the dashboard (hard redirect, session re-check, `no-store`).
- Transient network/5xx failures retry quietly with "taking longer than expected" before any error. Withdrawals are deliberately not auto-retried (duplicate risk).
- Sign in with email **or username**. Dark/light toggle in the dashboard (sidebar stays dark). Mobile: slide-in drawer, stacked layouts.
- "Log in as" replaces the Super Agent's session in that tab and is audit-logged (and disclosed in the Terms).

## Known limitations

- A user approved for an **additional role** gets that role's database permissions but no dashboard switcher yet — their menu follows their primary role.
- Deposit refunds and prorated final-month rent aren't automated; ending a tenancy shows the outstanding balance so it can be settled.
- Built and tested with full production builds and a real-Postgres test of the SQL, but never run against live Supabase/Paystack from the build environment — the first real signup, payment and webhook are the real test.

## Local development

```
cp .env.local.example .env.local   # fill in values
npm install
npm run dev
```
