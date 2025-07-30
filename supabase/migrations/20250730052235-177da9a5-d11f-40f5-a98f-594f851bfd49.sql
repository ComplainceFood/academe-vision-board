-- Update existing notes data to change "promise" type to "commitment"
UPDATE public.notes 
SET type = 'commitment' 
WHERE type = 'promise';

-- Validate the update was successful by checking if any promise types remain
-- (This query should return 0 if the migration was successful)
-- SELECT COUNT(*) FROM public.notes WHERE type = 'promise';