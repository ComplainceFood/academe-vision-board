-- Add new fields to scholastic_achievements table for course taught tracking
ALTER TABLE public.scholastic_achievements 
ADD COLUMN IF NOT EXISTS term TEXT,
ADD COLUMN IF NOT EXISTS student_count INTEGER;

-- Update the category enum to include course_taught (if using check constraint)
-- Since we're using text with check constraint, we need to update it
ALTER TABLE public.scholastic_achievements 
DROP CONSTRAINT IF EXISTS scholastic_achievements_category_check;

ALTER TABLE public.scholastic_achievements 
ADD CONSTRAINT scholastic_achievements_category_check 
CHECK (category IN ('publication', 'research_presentation', 'invited_talk', 'leadership_role', 'course_taught'));