-- Phase 2: Clean up duplicate integration records and add constraints
-- First check if we have duplicate records (for debugging)
DO $$
DECLARE
    duplicates integer;
BEGIN
    SELECT COUNT(*) - COUNT(DISTINCT user_id) INTO duplicates
    FROM google_calendar_integration;
    
    IF duplicates > 0 THEN
        RAISE NOTICE 'Found % duplicate Google Calendar integration records', duplicates;
        
        -- Delete duplicate records, keeping the most recent one for each user
        DELETE FROM google_calendar_integration 
        WHERE id NOT IN (
            SELECT DISTINCT ON (user_id) id 
            FROM google_calendar_integration 
            ORDER BY user_id, updated_at DESC
        );
        
        RAISE NOTICE 'Cleaned up duplicate records';
    END IF;
END $$;

-- Add unique constraint to prevent future duplicates
ALTER TABLE google_calendar_integration 
ADD CONSTRAINT google_calendar_integration_user_id_unique 
UNIQUE (user_id);

-- Ensure planning_events has proper indexes for external sync fields
CREATE INDEX IF NOT EXISTS idx_planning_events_external_id 
ON planning_events(external_id) 
WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_planning_events_sync_status 
ON planning_events(is_synced, external_id) 
WHERE external_id IS NULL;