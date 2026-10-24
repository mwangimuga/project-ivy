-- ============================================================
-- Project Ivy — Lease Applications
-- The original schema gave clients no INSERT permission on
-- `leases` at all, and no client_id/status could be self-elevated
-- to 'active'. This adds a narrow, safe path: a client can create
-- a *pending* application for themselves; only Project Managers
-- and the Super Agent (already covered by the existing
-- "Leases manageable by project managers and super agents" ALL
-- policy) can move it to 'active' or 'terminated'.
-- ============================================================

create policy "Clients can apply for a lease"
  on public.leases for insert
  with check (
    auth.role() = 'authenticated'
    and client_id = auth.uid()
    and status = 'pending'
  );

-- Prevent a client from ever flipping their own application straight
-- to 'active'/'terminated' by calling update() directly — the existing
-- "all" policy already lets PM/Super Agent do this; clients simply have
-- no update policy on leases at all, so this is enforced implicitly.
-- (No additional policy needed — omission is the control here.)
