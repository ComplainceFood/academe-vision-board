-- Phase 2: Clean up duplicate integration records and add unique constraint

-- First, clean up any duplicate records by keeping only the most recent one per user
DELETE FROM google_calendar_integration 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM google_calendar_integration 
  ORDER BY user_id, updated_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE google_calendar_integration 
ADD CONSTRAINT google_calendar_integration_user_id_unique 
UNIQUE (user_id);