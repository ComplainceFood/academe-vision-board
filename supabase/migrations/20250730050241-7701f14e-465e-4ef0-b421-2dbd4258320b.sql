-- Create admin communications table
CREATE TABLE public.admin_communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_communications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "System admins can manage all communications" 
ON public.admin_communications 
FOR ALL 
USING (current_user_has_role('system_admin'::app_role));

CREATE POLICY "All authenticated users can view published communications" 
ON public.admin_communications 
FOR SELECT 
USING (is_published = true AND (expires_at IS NULL OR expires_at > now()));

-- Create updated_at trigger
CREATE TRIGGER update_admin_communications_updated_at
BEFORE UPDATE ON public.admin_communications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add validation trigger
CREATE TRIGGER validate_admin_communications_input
BEFORE INSERT OR UPDATE ON public.admin_communications
FOR EACH ROW
EXECUTE FUNCTION public.validate_user_input();