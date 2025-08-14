-- Create Outlook Calendar integration table
CREATE TABLE IF NOT EXISTS public.outlook_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.outlook_integration ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own Outlook integration" 
ON public.outlook_integration 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Outlook integration" 
ON public.outlook_integration 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Outlook integration" 
ON public.outlook_integration 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Outlook integration" 
ON public.outlook_integration 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_outlook_integration_updated_at
BEFORE UPDATE ON public.outlook_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();