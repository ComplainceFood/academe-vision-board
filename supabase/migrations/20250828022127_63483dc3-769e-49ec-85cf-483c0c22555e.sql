-- Fix remaining database function search path issues

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_funding_source_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;