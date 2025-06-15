-- Enable real-time for all tables (set replica identity)
ALTER TABLE public.supplies REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;
ALTER TABLE public.notes REPLICA IDENTITY FULL;
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.planning_events REPLICA IDENTITY FULL;
ALTER TABLE public.future_planning REPLICA IDENTITY FULL;
ALTER TABLE public.shopping_list REPLICA IDENTITY FULL;
ALTER TABLE public.funding_sources REPLICA IDENTITY FULL;
ALTER TABLE public.funding_expenditures REPLICA IDENTITY FULL;
ALTER TABLE public.funding_commitments REPLICA IDENTITY FULL;
ALTER TABLE public.funding_reports REPLICA IDENTITY FULL;
ALTER TABLE public.outlook_integration REPLICA IDENTITY FULL;
ALTER TABLE public.calendar_sync_history REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only those not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.future_planning;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_expenditures;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_commitments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.outlook_integration;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_sync_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;