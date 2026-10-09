-- Migration: Add Stream / Academic Discipline Support to Exam Syllabi
-- Created: 2026-10-08
-- Purpose: Supports multi-stream exams (e.g. Civil Engineering vs Mechanical vs Electrical in OSSC CTSRE / JE / AEE)

-- 1. Add stream column with default 'All Streams'
ALTER TABLE public.exam_syllabi 
ADD COLUMN IF NOT EXISTS stream text NOT NULL DEFAULT 'All Streams';

-- 2. Drop legacy unique constraint on (exam_id, stage)
ALTER TABLE public.exam_syllabi 
DROP CONSTRAINT IF EXISTS unique_exam_stage_syllabus;

-- 3. Add new 3-column unique constraint on (exam_id, stage, stream)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_exam_stage_stream_syllabus'
  ) THEN
    ALTER TABLE public.exam_syllabi 
    ADD CONSTRAINT unique_exam_stage_stream_syllabus UNIQUE (exam_id, stage, stream);
  END IF;
END $$;

-- 4. Create composite lookup index for performance
CREATE INDEX IF NOT EXISTS idx_exam_syllabi_stage_stream 
ON public.exam_syllabi(exam_id, stage, stream);
