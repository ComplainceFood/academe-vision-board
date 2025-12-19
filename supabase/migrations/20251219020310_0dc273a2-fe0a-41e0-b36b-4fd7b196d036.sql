-- Add ORCID ID field to profiles table
ALTER TABLE public.profiles
ADD COLUMN orcid_id text;

-- Create index for ORCID lookup
CREATE INDEX idx_profiles_orcid_id ON public.profiles(orcid_id) WHERE orcid_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.orcid_id IS 'ORCID identifier for automatic publication import (e.g., 0000-0002-1825-0097)';