-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create table to track sync history
CREATE TABLE public.calendar_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_users INTEGER NOT NULL DEFAULT 0,
  successful_syncs INTEGER NOT NULL DEFAULT 0,
  total_outlook_events INTEGER NOT NULL DEFAULT 0,
  total_internal_events INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  triggered_by TEXT DEFAULT 'automated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_sync_history ENABLE ROW LEVEL SECURITY;

-- Create policy for sync history (admins only, but for demo we'll allow all authenticated users to view)
CREATE POLICY "Users can view sync history" 
ON public.calendar_sync_history 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX idx_calendar_sync_history_sync_time ON public.calendar_sync_history(sync_time DESC);
CREATE INDEX idx_calendar_sync_history_triggered_by ON public.calendar_sync_history(triggered_by);

-- Schedule automated calendar sync every 15 minutes
SELECT cron.schedule(
  'automated-calendar-sync',
  '*/15 * * * *', -- Every 15 minutes
  $$
  select
    net.http_post(
        url:='https://ljxwljvodiwtmkiseukb.supabase.co/functions/v1/automated-calendar-sync',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeHdsanZvZGl3dG1raXNldWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDk3NjAsImV4cCI6MjA2MTI4NTc2MH0.XpOdfBHw2ai78Rg1fbyxs1F4Y1HjDitnu0jNFQQVQb8"}'::jsonb,
        body:='{"triggered_by": "cron_job"}'::jsonb
    ) as request_id;
  $$
);

-- Add automation settings to user preferences
ALTER TABLE public.outlook_integration 
ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN sync_frequency TEXT DEFAULT 'every_15_minutes',
ADD COLUMN last_auto_sync TIMESTAMP WITH TIME ZONE;

-- Create trigger to log sync history
CREATE OR REPLACE FUNCTION public.log_calendar_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- This would be called from the edge function to log sync results
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;