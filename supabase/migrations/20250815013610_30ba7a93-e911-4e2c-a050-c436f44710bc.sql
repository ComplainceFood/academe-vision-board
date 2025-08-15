-- Add unique constraint on user_id to support upsert operations in outlook_integration table
ALTER TABLE public.outlook_integration 
ADD CONSTRAINT outlook_integration_user_id_unique UNIQUE (user_id);