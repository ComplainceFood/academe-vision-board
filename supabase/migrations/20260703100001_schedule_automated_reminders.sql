-- Log of automated reminder emails, used by the send-automated-reminders edge
-- function to dedupe (meeting reminders once per meeting, digests once per day)
-- and to rate-limit runs since the function is callable with the public anon key.
CREATE TABLE public.reminder_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  reminder_type TEXT NOT NULL,
  dedupe_key TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (reminder_type, dedupe_key)
);

CREATE INDEX idx_reminder_log_sent_at ON public.reminder_log(sent_at DESC);

-- Service-role only: no client policies. RLS enabled with no policies denies
-- all access via the anon/authenticated roles.
ALTER TABLE public.reminder_log ENABLE ROW LEVEL SECURITY;

-- Run reminders hourly (meeting reminders look 30-60 min ahead, so hourly
-- coverage is sufficient; daily digests are deduped inside the function).
SELECT cron.schedule(
  'send-automated-reminders',
  '0 * * * *',
  $$
  select
    net.http_post(
        url:='https://ljxwljvodiwtmkiseukb.supabase.co/functions/v1/send-automated-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqeHdsanZvZGl3dG1raXNldWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MDk3NjAsImV4cCI6MjA2MTI4NTc2MH0.XpOdfBHw2ai78Rg1fbyxs1F4Y1HjDitnu0jNFQQVQb8"}'::jsonb,
        body:='{"triggered_by": "cron_job"}'::jsonb
    ) as request_id;
  $$
);
