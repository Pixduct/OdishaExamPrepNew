-- Migration: Create Flashcards & Anki SRS System
-- Created: 2026-09-12

-- 1. Create Flashcard Decks table
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  exam_id text NOT NULL,
  subject text NOT NULL,
  sub_subject text,
  chapter text,
  stage text NOT NULL DEFAULT 'All Stages',
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Layers',
  card_count integer NOT NULL DEFAULT 0,
  is_premium boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup by exam and subject
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_exam ON public.flashcard_decks(exam_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_subject ON public.flashcard_decks(subject);

-- 2. Create Flashcards table
CREATE TABLE IF NOT EXISTS public.flashcards (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  deck_id text NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_text text NOT NULL,
  key_points jsonb DEFAULT '[]'::jsonb,
  diagram jsonb DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);

-- 3. Create User Flashcard Progress table (Anki SM-2 tracking)
CREATE TABLE IF NOT EXISTS public.user_flashcard_progress (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id text NOT NULL,
  card_id text NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  deck_id text NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'new', -- 'new' | 'learning' | 'review' | 'mastered'
  ease_factor numeric NOT NULL DEFAULT 2.50,
  interval_days integer NOT NULL DEFAULT 0,
  repetitions integer NOT NULL DEFAULT 0,
  lapses integer NOT NULL DEFAULT 0,
  due_date timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_card UNIQUE (user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_ufp_user_deck ON public.user_flashcard_progress(user_id, deck_id);
CREATE INDEX IF NOT EXISTS idx_ufp_due ON public.user_flashcard_progress(user_id, due_date);

-- 4. Enable Row Level Security
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_progress ENABLE ROW LEVEL SECURITY;

-- 5. Policies for flashcard_decks
DROP POLICY IF EXISTS "Public select flashcard_decks" ON public.flashcard_decks;
CREATE POLICY "Public select flashcard_decks"
  ON public.flashcard_decks
  FOR SELECT
  USING (true); -- Catalog metadata is readable so students can browse decks

DROP POLICY IF EXISTS "Admins full write flashcard_decks" ON public.flashcard_decks;
CREATE POLICY "Admins full write flashcard_decks"
  ON public.flashcard_decks
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  );

-- 6. Policies for flashcards
DROP POLICY IF EXISTS "Public select flashcards" ON public.flashcards;
CREATE POLICY "Public select flashcards"
  ON public.flashcards
  FOR SELECT
  USING (true); -- Cards readable for study sessions

DROP POLICY IF EXISTS "Admins full write flashcards" ON public.flashcards;
CREATE POLICY "Admins full write flashcards"
  ON public.flashcards
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  );

-- 7. Policies for user_flashcard_progress
DROP POLICY IF EXISTS "Users can read own flashcard progress" ON public.user_flashcard_progress;
CREATE POLICY "Users can read own flashcard progress"
  ON public.user_flashcard_progress
  FOR SELECT
  USING (
    auth.uid()::text = user_id
    OR auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  );

DROP POLICY IF EXISTS "Users can insert own flashcard progress" ON public.user_flashcard_progress;
CREATE POLICY "Users can insert own flashcard progress"
  ON public.user_flashcard_progress
  FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id
    OR auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  );

DROP POLICY IF EXISTS "Users can update own flashcard progress" ON public.user_flashcard_progress;
CREATE POLICY "Users can update own flashcard progress"
  ON public.user_flashcard_progress
  FOR UPDATE
  USING (
    auth.uid()::text = user_id
    OR auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  )
  WITH CHECK (
    auth.uid()::text = user_id
    OR auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete own flashcard progress" ON public.user_flashcard_progress;
CREATE POLICY "Users can delete own flashcard progress"
  ON public.user_flashcard_progress
  FOR DELETE
  USING (
    auth.uid()::text = user_id
    OR auth.jwt() ->> 'email' IN ('nareshsamal99384@gmail.com', 'odishaexamprep365@gmail.com', 'nareshsamal99383@gmail.com')
    OR (SELECT role FROM public.users WHERE uid = auth.uid()::text) = 'admin'
  );
