-- ============================================================
-- Project Ivy — Super Agent Email Update
-- Updates the seeded Super Agent (originally mark@projectivy.com,
-- inserted directly into auth.users by the init migration) to the
-- real production email. Safe to run whether or not you've already
-- executed the original seed — it's a targeted update, not a
-- fresh insert, so no existing data is touched.
-- ============================================================

update auth.users
set email = 'mwangimuga161@gmail.com',
    raw_user_meta_data = raw_user_meta_data || '{"username":"Mark"}'::jsonb
where id = '00000000-0000-0000-0000-000000000000';

update public.profiles
set username = 'Mark'
where id = '00000000-0000-0000-0000-000000000000';

-- Sanity check — should return exactly one row with the new email.
-- select id, email from auth.users where id = '00000000-0000-0000-0000-000000000000';
