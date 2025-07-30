-- Add description field to admin_communications table
ALTER TABLE public.admin_communications 
ADD COLUMN description TEXT;

-- Add a brief description comment
COMMENT ON COLUMN public.admin_communications.description IS 'Brief summary or subtitle for the communication';

-- Update existing records to have a description (optional, can be null)
UPDATE public.admin_communications 
SET description = SUBSTRING(content, 1, 150) || 
  CASE 
    WHEN LENGTH(content) > 150 THEN '...' 
    ELSE '' 
  END
WHERE description IS NULL;