-- Add all the new fields needed for the comprehensive tenure tracking
ALTER TABLE public.scholastic_achievements 
ADD COLUMN IF NOT EXISTS award_type TEXT,
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS journal_name TEXT,
ADD COLUMN IF NOT EXISTS review_count INTEGER,
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS student_level TEXT CHECK (student_level IN ('undergraduate', 'masters', 'phd', 'postdoc')),
ADD COLUMN IF NOT EXISTS evaluation_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS course_code TEXT;

-- Update the category constraint to include all new categories
ALTER TABLE public.scholastic_achievements 
DROP CONSTRAINT IF EXISTS scholastic_achievements_category_check;

ALTER TABLE public.scholastic_achievements 
ADD CONSTRAINT scholastic_achievements_category_check 
CHECK (category IN ('publication', 'research_presentation', 'invited_talk', 'leadership_role', 'course_taught', 'award_honor', 'service_review', 'student_supervision', 'teaching_performance', 'professional_development', 'external_impact'));