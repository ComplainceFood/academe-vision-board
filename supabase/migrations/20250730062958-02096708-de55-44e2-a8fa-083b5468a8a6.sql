-- Create table for tracking user legal agreements
CREATE TABLE public.user_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agreement_type TEXT NOT NULL CHECK (agreement_type IN ('privacy_policy', 'terms_of_service')),
  version TEXT NOT NULL DEFAULT '1.0',
  agreed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- Create policies for user agreements
CREATE POLICY "Users can view their own agreements" 
ON public.user_agreements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agreements" 
ON public.user_agreements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_user_agreements_updated_at
BEFORE UPDATE ON public.user_agreements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update notification preferences to use proper database storage
-- Insert trigger to validate user input for notification preferences
CREATE TRIGGER validate_notification_preferences
BEFORE INSERT OR UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.validate_user_input();