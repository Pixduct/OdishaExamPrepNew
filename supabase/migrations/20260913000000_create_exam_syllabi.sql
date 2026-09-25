-- Migration: Create Exam Syllabi Table with Multi-Stage Support
-- Created: 2026-09-13

CREATE TABLE IF NOT EXISTS public.exam_syllabi (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  exam_id text NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'All Stages',
  syllabus_markdown text NOT NULL DEFAULT '',
  directives_markdown text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_exam_stage_syllabus UNIQUE (exam_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_exam_syllabi_lookup ON public.exam_syllabi(exam_id, stage);

ALTER TABLE public.exam_syllabi ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exam_syllabi' AND policyname = 'Public read exam_syllabi'
  ) THEN
    CREATE POLICY "Public read exam_syllabi" ON public.exam_syllabi FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exam_syllabi' AND policyname = 'Allow all operations on exam_syllabi'
  ) THEN
    CREATE POLICY "Allow all operations on exam_syllabi" ON public.exam_syllabi FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
