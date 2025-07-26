-- Fix function search path security issues by setting explicit search_path

-- Update the update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Update the handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$function$;

-- Update the update_funding_source_balance function with secure search_path
CREATE OR REPLACE FUNCTION public.update_funding_source_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- Update the remaining amount for the affected funding source
  UPDATE public.funding_sources 
  SET remaining_amount = total_amount - (
    SELECT COALESCE(SUM(amount), 0) 
    FROM public.funding_expenditures 
    WHERE funding_source_id = COALESCE(NEW.funding_source_id, OLD.funding_source_id)
  ),
  status = CASE 
    WHEN (total_amount - (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.funding_expenditures 
      WHERE funding_source_id = COALESCE(NEW.funding_source_id, OLD.funding_source_id)
    )) <= 0 THEN 'depleted'
    WHEN end_date IS NOT NULL AND end_date < CURRENT_DATE THEN 'expired'
    ELSE 'active'
  END
  WHERE id = COALESCE(NEW.funding_source_id, OLD.funding_source_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update the log_calendar_sync function with secure search_path
CREATE OR REPLACE FUNCTION public.log_calendar_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  -- This would be called from the edge function to log sync results
  RETURN NEW;
END;
$function$;

-- Create triggers with IF NOT EXISTS equivalent (drop and recreate)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funding_sources_updated_at ON public.funding_sources;
CREATE TRIGGER update_funding_sources_updated_at
  BEFORE UPDATE ON public.funding_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funding_expenditures_updated_at ON public.funding_expenditures;
CREATE TRIGGER update_funding_expenditures_updated_at
  BEFORE UPDATE ON public.funding_expenditures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funding_commitments_updated_at ON public.funding_commitments;
CREATE TRIGGER update_funding_commitments_updated_at
  BEFORE UPDATE ON public.funding_commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_funding_reports_updated_at ON public.funding_reports;
CREATE TRIGGER update_funding_reports_updated_at
  BEFORE UPDATE ON public.funding_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_outlook_integration_updated_at ON public.outlook_integration;
CREATE TRIGGER update_outlook_integration_updated_at
  BEFORE UPDATE ON public.outlook_integration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for funding source balance updates
DROP TRIGGER IF EXISTS funding_expenditure_balance_update ON public.funding_expenditures;
CREATE TRIGGER funding_expenditure_balance_update
  AFTER INSERT OR UPDATE OR DELETE ON public.funding_expenditures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_funding_source_balance();

-- Add trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();