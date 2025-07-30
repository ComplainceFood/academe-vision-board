-- Create Google Calendar integration table
CREATE TABLE public.google_calendar_integration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_calendar_integration ENABLE ROW LEVEL SECURITY;

-- Create policies for Google Calendar integration
CREATE POLICY "Users can view their own Google Calendar integration" 
ON public.google_calendar_integration 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google Calendar integration" 
ON public.google_calendar_integration 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Calendar integration" 
ON public.google_calendar_integration 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Calendar integration" 
ON public.google_calendar_integration 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('communication', 'system', 'reminder', 'alert')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  author TEXT,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Only admins can create notifications (handled by edge functions)
CREATE POLICY "Service role can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- Add external sync fields to planning_events table
ALTER TABLE public.planning_events 
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS external_source TEXT CHECK (external_source IN ('outlook', 'google_calendar')),
ADD COLUMN IF NOT EXISTS is_synced BOOLEAN DEFAULT false;

-- Add notification preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_notifications": true,
  "push_notifications": true,
  "communication_alerts": true,
  "meeting_reminders": true,
  "task_reminders": true,
  "email_frequency": "immediate"
}'::jsonb;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_google_calendar_integration_updated_at
  BEFORE UPDATE ON public.google_calendar_integration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_google_calendar_integration_user_id ON public.google_calendar_integration(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_planning_events_external_id ON public.planning_events(external_id);
CREATE INDEX idx_planning_events_is_synced ON public.planning_events(is_synced);