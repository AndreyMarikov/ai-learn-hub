-- ============================================================
-- LearnFlow — Row Level Security (RLS) Setup
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. Add user_id to conversations (if not already present)
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT '';

-- Remove the temporary default now that the column exists
ALTER TABLE public.conversations
  ALTER COLUMN user_id DROP DEFAULT;


-- ────────────────────────────────────────────────────────────
-- 2. Enable RLS on all three tables
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_image_usage  ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- 3. conversations — users own their own rows
-- ────────────────────────────────────────────────────────────
CREATE POLICY "conversations: select own"
  ON public.conversations FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "conversations: insert own"
  ON public.conversations FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "conversations: update own"
  ON public.conversations FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "conversations: delete own"
  ON public.conversations FOR DELETE
  USING (user_id = auth.uid()::text);


-- ────────────────────────────────────────────────────────────
-- 4. messages — accessible only through owned conversations
-- ────────────────────────────────────────────────────────────
CREATE POLICY "messages: select own"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "messages: insert own"
  ON public.messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "messages: update own"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "messages: delete own"
  ON public.messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()::text
    )
  );


-- ────────────────────────────────────────────────────────────
-- 5. daily_image_usage — users own their own rows
-- ────────────────────────────────────────────────────────────
CREATE POLICY "daily_image_usage: select own"
  ON public.daily_image_usage FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "daily_image_usage: insert own"
  ON public.daily_image_usage FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "daily_image_usage: update own"
  ON public.daily_image_usage FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "daily_image_usage: delete own"
  ON public.daily_image_usage FOR DELETE
  USING (user_id = auth.uid()::text);
