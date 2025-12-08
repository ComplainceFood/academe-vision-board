-- Drop the overly permissive policy
DROP POLICY IF EXISTS "calendar_sync_history_select_policy" ON public.calendar_sync_history;

-- Create proper RLS policies for calendar_sync_history
-- Only system admins can view all sync history
CREATE POLICY "system_admins_view_calendar_sync_history" 
ON public.calendar_sync_history 
FOR SELECT 
USING (current_user_has_role('system_admin'::app_role));

-- Allow service role to insert sync history (for automated sync function)
CREATE POLICY "service_role_insert_calendar_sync_history" 
ON public.calendar_sync_history 
FOR INSERT 
WITH CHECK (true);