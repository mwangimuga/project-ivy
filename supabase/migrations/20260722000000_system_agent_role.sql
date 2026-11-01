-- ============================================================
-- Project Ivy — System Agent Role
-- Adds a new role that assists the Super Agent with day-to-day
-- approvals (lease applications, tickets, role requests) without
-- full admin power (no user delete, no impersonation, no property
-- edit/delete, no withdrawal approval — those stay Super-Agent-only).
--
-- IMPORTANT: Postgres does not allow a new enum value to be used in
-- the same transaction/script that adds it. Run this file ALONE, let
-- it finish, THEN run the next migration that references 'system_agent'.
-- ============================================================

alter type user_role add value if not exists 'system_agent';
