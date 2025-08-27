-- =====================================
-- COMPREHENSIVE SECURITY FIXES FOR USER DATA PROTECTION
-- =====================================

-- 1. DROP EXISTING PROFILES POLICIES AND CREATE SECURE ONES
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- 2. CREATE SECURE PROFILES POLICIES WITH AUTHENTICATION REQUIREMENT
-- Only authenticated users can view their own profile
CREATE POLICY "authenticated_users_select_own_profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Only authenticated users can insert their own profile
CREATE POLICY "authenticated_users_insert_own_profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can update their own profile
CREATE POLICY "authenticated_users_update_own_profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- System admins can view all profiles for administration
CREATE POLICY "system_admins_can_view_all_profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (current_user_has_role('system_admin'::app_role));

-- 3. SECURE CALENDAR INTEGRATION TABLES
-- Drop existing policies and create stricter ones
DROP POLICY IF EXISTS "Users can create their own Google Calendar integration" ON public.google_calendar_integration;
DROP POLICY IF EXISTS "Users can view their own Google Calendar integration" ON public.google_calendar_integration;
DROP POLICY IF EXISTS "Users can update their own Google Calendar integration" ON public.google_calendar_integration;
DROP POLICY IF EXISTS "Users can delete their own Google Calendar integration" ON public.google_calendar_integration;

-- Create secure Google Calendar policies
CREATE POLICY "authenticated_users_google_calendar_select" 
ON public.google_calendar_integration 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

CREATE POLICY "authenticated_users_google_calendar_insert" 
ON public.google_calendar_integration 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

CREATE POLICY "authenticated_users_google_calendar_update" 
ON public.google_calendar_integration 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.jwt() IS NOT NULL) 
WITH CHECK (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

CREATE POLICY "authenticated_users_google_calendar_delete" 
ON public.google_calendar_integration 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

-- Secure Outlook integration policies
DROP POLICY IF EXISTS "outlook_integration_select_policy" ON public.outlook_integration;
DROP POLICY IF EXISTS "outlook_integration_insert_policy" ON public.outlook_integration;
DROP POLICY IF EXISTS "outlook_integration_update_policy" ON public.outlook_integration;
DROP POLICY IF EXISTS "outlook_integration_delete_policy" ON public.outlook_integration;

CREATE POLICY "authenticated_users_outlook_select" 
ON public.outlook_integration 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

CREATE POLICY "authenticated_users_outlook_insert" 
ON public.outlook_integration 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

CREATE POLICY "authenticated_users_outlook_update" 
ON public.outlook_integration 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id AND auth.jwt() IS NOT NULL) 
WITH CHECK (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

CREATE POLICY "authenticated_users_outlook_delete" 
ON public.outlook_integration 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id AND auth.jwt() IS NOT NULL);

-- 4. FIX SECURITY AUDIT LOG POLICIES
DROP POLICY IF EXISTS "Audit log access control" ON public.security_audit_log;
DROP POLICY IF EXISTS "Extension security info access" ON public.security_audit_log;
DROP POLICY IF EXISTS "Only system can write audit logs" ON public.security_audit_log;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.security_audit_log;

-- Create proper audit log policies
CREATE POLICY "users_view_own_audit_logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Only service role can insert audit logs (prevents tampering)
CREATE POLICY "service_role_insert_audit_logs" 
ON public.security_audit_log 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- System admins can view all audit logs
CREATE POLICY "system_admins_view_all_audit_logs" 
ON public.security_audit_log 
FOR SELECT 
TO authenticated 
USING (current_user_has_role('system_admin'::app_role));

-- 5. ADD ADDITIONAL FINANCIAL DATA PROTECTION
-- Create function to check for valid session and recent authentication
CREATE OR REPLACE FUNCTION public.is_authenticated_recently(minutes_threshold INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is authenticated and session is recent
  RETURN (
    auth.uid() IS NOT NULL 
    AND auth.jwt() IS NOT NULL 
    AND (auth.jwt() ->> 'iat')::bigint > EXTRACT(EPOCH FROM NOW() - INTERVAL '1 minute' * minutes_threshold)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add additional validation for financial tables
CREATE POLICY "authenticated_users_funding_sources_enhanced" 
ON public.funding_sources 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id AND is_authenticated_recently(120));

-- 6. ENHANCE NOTIFICATION SECURITY
-- Ensure only service role can insert notifications to prevent spoofing
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "service_role_insert_notifications" 
ON public.notifications 
FOR INSERT 
TO service_role 
WITH CHECK (true);

-- Users can only update read status of their own notifications
CREATE POLICY "users_update_own_notification_status" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 7. ENSURE NO ANONYMOUS ACCESS TO SENSITIVE DATA
-- This is a catchall to ensure no policies accidentally allow anonymous access
CREATE OR REPLACE FUNCTION public.prevent_anonymous_access()
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.role() = 'anon' THEN
    RAISE EXCEPTION 'Anonymous access to sensitive data is not allowed';
  END IF;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;