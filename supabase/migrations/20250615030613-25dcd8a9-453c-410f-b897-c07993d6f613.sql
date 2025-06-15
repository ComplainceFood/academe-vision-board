-- Add Outlook integration columns to planning_events table
ALTER TABLE public.planning_events 
ADD COLUMN outlook_id TEXT,
ADD COLUMN synced_from_outlook BOOLEAN DEFAULT FALSE,
ADD COLUMN synced_to_outlook BOOLEAN DEFAULT FALSE,
ADD COLUMN last_outlook_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN end_time TEXT,
ADD COLUMN location TEXT;

-- Create index for Outlook ID lookups
CREATE INDEX idx_planning_events_outlook_id ON public.planning_events(outlook_id) WHERE outlook_id IS NOT NULL;

-- Create user preferences table for storing Outlook access tokens
CREATE TABLE public.outlook_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outlook_integration ENABLE ROW LEVEL SECURITY;

-- Create policies for outlook_integration
CREATE POLICY "Users can view their own Outlook integration" 
ON public.outlook_integration 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Outlook integration" 
ON public.outlook_integration 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Outlook integration" 
ON public.outlook_integration 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Outlook integration" 
ON public.outlook_integration 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_outlook_integration_updated_at
BEFORE UPDATE ON public.outlook_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();