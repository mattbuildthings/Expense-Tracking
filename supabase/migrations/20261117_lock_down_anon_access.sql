-- Lock down anonymous access to expense data.
--
-- WHAT WAS WRONG
-- --------------
-- This app shipped a working Supabase URL + anon key as hardcoded constants in
-- src/services/supabaseClient.ts (committed to a PUBLIC GitHub repo), and it
-- never signed anybody in -- the client was created with
-- `auth: { persistSession: false }` and no sign-in call anywhere in src/.
--
-- So every read and write ran as the `anon` Postgres role, and the app
-- demonstrably worked. That is the finding: for the app to function at all with
-- no authenticated user, `anon` must already hold broad access to `expenses`
-- -- either RLS is disabled on the table, or a permissive `USING (true)` policy
-- grants it. Anyone who read the public repo had exactly that same access:
-- full read and write of every expense row (amounts, vendor names, notes).
--
-- The `receipts` storage bucket is a second exposure. uploadPhotoToSupabase()
-- calls getPublicUrl(), which only returns a usable URL for a PUBLIC bucket, so
-- invoice and Zalo-screenshot images are world-readable to anyone with (or able
-- to guess) the path.
--
-- NOTE ON KEY ROTATION: rotating the anon key is NOT the fix, and on its own it
-- fixes nothing. Supabase anon keys are *designed* to ship in client-side
-- JavaScript; they are public by intent. The vulnerability is that `anon` has
-- table access at all. A fresh key would be published in the very next deploy's
-- JS bundle. Fix the authorization (this file), then rotate as cleanup.
--
-- MEASURED STATE OF THE LIVE PROJECT (idckmqtcneozcrqebchd, 17 Nov 2026)
-- ----------------------------------------------------------------------
-- Checked directly rather than assumed, which changed what this file does:
--
--   relrowsecurity on expenses ... true      <- RLS was ALREADY on
--   policies on expenses ......... 1         <- and this was the hole:
--       "Allow anon access to expenses"  PERMISSIVE  {anon}  ALL
--          USING (true)  WITH CHECK (true)
--   storage.buckets.public ....... true      for the 'receipts' bucket
--   rows in expenses ............. 6         placeholder/test data
--
-- So enabling RLS was never the missing piece; a blanket `USING (true)` grant
-- to `anon` was. Confirmed exposure, now closed by enumeration below.
--
-- NO EXPORT NEEDED. The table holds 6 placeholder rows (5 merchants, dates
-- 2017-07-27 to 2026-08-01, ~17.8M VND total -- the sample invoices from the
-- OCR prompt and Test Receipts/). Nothing here is real bookkeeping data, so
-- there is nothing to preserve. Were this real data, the thing to know is that
-- rows are NOT deleted by this migration -- they stay in the table and remain
-- readable via the dashboard, SQL editor, or service-role key. What changes is
-- only that the unauthenticated browser can no longer reach them.
--
-- This migration deliberately takes cloud sync OFFLINE, which is intended: it
-- pairs with the companion change to src/services/supabaseClient.ts that
-- removes the hardcoded credentials, so the client degrades cleanly to
-- localStorage (every Supabase helper returns null without a client, and
-- App.tsx guards on `if (cloudItems)`).
--
-- Existing rows' image_url values point at public bucket URLs. Step 3 makes the
-- bucket private, which breaks those links in the UI. Receipt images are also
-- held in IndexedDB (savePhotoToIndexedDB) and inline base64 in localStorage,
-- so most remain viewable, but expect some older rows to lose their thumbnail.

-- ---------------------------------------------------------------------------
-- 1. Enable RLS on expenses.
--
-- ENABLE ROW LEVEL SECURITY is idempotent -- safe where it is already on.
-- Enabling it is the half that actually matters: with RLS off, every row is
-- visible to every role no matter what policies exist. Siteop hit this exact
-- trap (see its 20260910b_fix_rls_not_enforced.sql, where policies had been
-- replaced on tables whose RLS had silently never been enabled, so the new
-- `TO authenticated` policies were never enforced).
-- ---------------------------------------------------------------------------

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 2. Remove any permissive policy that grants anon access.
--
-- These names cover the Supabase dashboard's own defaults and the common
-- hand-written variants. DROP ... IF EXISTS is a no-op where the policy is not
-- present, so listing extras is harmless.
--
-- No replacement policy is created. `expenses` has no user_id or project_id
-- column yet, so there is no correct per-user rule to write -- the authenticated
-- policies land in the merge, alongside the real auth and the project_id FK.
-- Until then: RLS on, zero policies, nobody gets in. That is the safe state.
-- ---------------------------------------------------------------------------

-- Drop BY ENUMERATION, not by guessed name.
--
-- An earlier draft of this file listed ~14 likely policy names and relied on
-- DROP POLICY IF EXISTS. That approach was actively dangerous here. The policy
-- that actually existed on this table was:
--
--   "Allow anon access to expenses"  PERMISSIVE  {anon}  ALL
--      USING (true)  WITH CHECK (true)
--
-- The draft guessed "Allow anon access ON expenses". One preposition out, so
-- every DROP would have been a silent no-op, the migration would have reported
-- success, and the wide-open policy would have survived. That is the same shape
-- of failure as Siteop's 20260910b incident: the SQL looks right, the hole
-- stays open.
--
-- So enumerate what is really there and drop it. This is correct whatever the
-- policies happen to be named, in this project or any other.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses'
  LOOP
    RAISE NOTICE 'dropping policy on expenses: %', pol.policyname;
    EXECUTE format('DROP POLICY %I ON public.expenses', pol.policyname);
  END LOOP;
END $$;

-- Belt and braces: revoke the table grants the `anon` role holds, so access
-- does not come back if someone toggles RLS off in the dashboard later.
REVOKE ALL ON TABLE expenses FROM anon;

-- ---------------------------------------------------------------------------
-- 3. Make the receipts bucket private and deny anon on storage objects.
-- ---------------------------------------------------------------------------

UPDATE storage.buckets SET public = false WHERE id = 'receipts';

-- Same enumeration approach for storage. Only drop policies that actually
-- mention the receipts bucket, so other buckets' policies are left alone.
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (COALESCE(qual, '') LIKE '%receipts%' OR COALESCE(with_check, '') LIKE '%receipts%')
  LOOP
    RAISE NOTICE 'dropping storage policy: %', pol.policyname;
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 4. VERIFICATION -- run these after applying. Do not skip this step; the
--    whole point of Siteop's 20260910b incident was that the policies looked
--    right while RLS was quietly off underneath them.
-- ---------------------------------------------------------------------------

-- (a) Must return rowsecurity = true.
--     SELECT relname, relrowsecurity AS rowsecurity
--     FROM pg_class WHERE relname = 'expenses';

-- (b) Must return zero rows (no policy granting anon anything).
--     SELECT policyname, roles, cmd, qual
--     FROM pg_policies WHERE tablename = 'expenses';

-- (c) Must return public = false.
--     SELECT id, public FROM storage.buckets WHERE id = 'receipts';

-- (d) The real test, from a terminal -- substitute the CURRENT anon key.
--     Expect an empty array `[]` or a permission error, NEVER expense rows:
--
--     curl -s "https://idckmqtcneozcrqebchd.supabase.co/rest/v1/expenses?select=*&limit=5" \
--       -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
--
--     Run the same curl BEFORE applying this migration too. If it returns rows
--     then and `[]` afterwards, the exposure was real and is now closed.
