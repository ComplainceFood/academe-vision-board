-- Drop all existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can create their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;

DROP POLICY IF EXISTS "Users can view their own supplies" ON public.supplies;
DROP POLICY IF EXISTS "Users can create their own supplies" ON public.supplies;
DROP POLICY IF EXISTS "Users can update their own supplies" ON public.supplies;
DROP POLICY IF EXISTS "Users can delete their own supplies" ON public.supplies;

DROP POLICY IF EXISTS "Users can view their own planning events" ON public.planning_events;
DROP POLICY IF EXISTS "Users can create their own planning events" ON public.planning_events;
DROP POLICY IF EXISTS "Users can update their own planning events" ON public.planning_events;
DROP POLICY IF EXISTS "Users can delete their own planning events" ON public.planning_events;

DROP POLICY IF EXISTS "Users can view their own shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can create their own shopping list items" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can update their own shopping list items" ON public.shopping_list;
DROP POLICY IF EXISTS "Users can delete their own shopping list items" ON public.shopping_list;

DROP POLICY IF EXISTS "Users can view their own funding sources" ON public.funding_sources;
DROP POLICY IF EXISTS "Users can create their own funding sources" ON public.funding_sources;
DROP POLICY IF EXISTS "Users can update their own funding sources" ON public.funding_sources;
DROP POLICY IF EXISTS "Users can delete their own funding sources" ON public.funding_sources;

DROP POLICY IF EXISTS "Users can view their own funding expenditures" ON public.funding_expenditures;
DROP POLICY IF EXISTS "Users can create their own funding expenditures" ON public.funding_expenditures;
DROP POLICY IF EXISTS "Users can update their own funding expenditures" ON public.funding_expenditures;
DROP POLICY IF EXISTS "Users can delete their own funding expenditures" ON public.funding_expenditures;

DROP POLICY IF EXISTS "Users can view their own funding commitments" ON public.funding_commitments;
DROP POLICY IF EXISTS "Users can create their own funding commitments" ON public.funding_commitments;
DROP POLICY IF EXISTS "Users can update their own funding commitments" ON public.funding_commitments;
DROP POLICY IF EXISTS "Users can delete their own funding commitments" ON public.funding_commitments;

DROP POLICY IF EXISTS "Users can view their own funding reports" ON public.funding_reports;
DROP POLICY IF EXISTS "Users can create their own funding reports" ON public.funding_reports;
DROP POLICY IF EXISTS "Users can update their own funding reports" ON public.funding_reports;
DROP POLICY IF EXISTS "Users can delete their own funding reports" ON public.funding_reports;

DROP POLICY IF EXISTS "Users can view their own Outlook integration" ON public.outlook_integration;
DROP POLICY IF EXISTS "Users can create their own Outlook integration" ON public.outlook_integration;
DROP POLICY IF EXISTS "Users can update their own Outlook integration" ON public.outlook_integration;
DROP POLICY IF EXISTS "Users can delete their own Outlook integration" ON public.outlook_integration;

DROP POLICY IF EXISTS "Users can view sync history" ON public.calendar_sync_history;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Now recreate all policies cleanly
-- Notes policies
CREATE POLICY "notes_select_policy" ON public.notes
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notes_insert_policy" ON public.notes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notes_update_policy" ON public.notes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notes_delete_policy" ON public.notes
FOR DELETE USING (auth.uid() = user_id);

-- Meetings policies
CREATE POLICY "meetings_select_policy" ON public.meetings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "meetings_insert_policy" ON public.meetings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meetings_update_policy" ON public.meetings
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "meetings_delete_policy" ON public.meetings
FOR DELETE USING (auth.uid() = user_id);

-- Supplies policies
CREATE POLICY "supplies_select_policy" ON public.supplies
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "supplies_insert_policy" ON public.supplies
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "supplies_update_policy" ON public.supplies
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "supplies_delete_policy" ON public.supplies
FOR DELETE USING (auth.uid() = user_id);

-- Planning events policies
CREATE POLICY "planning_events_select_policy" ON public.planning_events
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "planning_events_insert_policy" ON public.planning_events
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "planning_events_update_policy" ON public.planning_events
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "planning_events_delete_policy" ON public.planning_events
FOR DELETE USING (auth.uid() = user_id);

-- Shopping list policies
CREATE POLICY "shopping_list_select_policy" ON public.shopping_list
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "shopping_list_insert_policy" ON public.shopping_list
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_list_update_policy" ON public.shopping_list
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "shopping_list_delete_policy" ON public.shopping_list
FOR DELETE USING (auth.uid() = user_id);

-- Funding sources policies
CREATE POLICY "funding_sources_select_policy" ON public.funding_sources
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "funding_sources_insert_policy" ON public.funding_sources
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "funding_sources_update_policy" ON public.funding_sources
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "funding_sources_delete_policy" ON public.funding_sources
FOR DELETE USING (auth.uid() = user_id);

-- Funding expenditures policies
CREATE POLICY "funding_expenditures_select_policy" ON public.funding_expenditures
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "funding_expenditures_insert_policy" ON public.funding_expenditures
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "funding_expenditures_update_policy" ON public.funding_expenditures
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "funding_expenditures_delete_policy" ON public.funding_expenditures
FOR DELETE USING (auth.uid() = user_id);

-- Funding commitments policies
CREATE POLICY "funding_commitments_select_policy" ON public.funding_commitments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "funding_commitments_insert_policy" ON public.funding_commitments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "funding_commitments_update_policy" ON public.funding_commitments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "funding_commitments_delete_policy" ON public.funding_commitments
FOR DELETE USING (auth.uid() = user_id);

-- Funding reports policies
CREATE POLICY "funding_reports_select_policy" ON public.funding_reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "funding_reports_insert_policy" ON public.funding_reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "funding_reports_update_policy" ON public.funding_reports
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "funding_reports_delete_policy" ON public.funding_reports
FOR DELETE USING (auth.uid() = user_id);

-- Outlook integration policies
CREATE POLICY "outlook_integration_select_policy" ON public.outlook_integration
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "outlook_integration_insert_policy" ON public.outlook_integration
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "outlook_integration_update_policy" ON public.outlook_integration
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "outlook_integration_delete_policy" ON public.outlook_integration
FOR DELETE USING (auth.uid() = user_id);

-- Calendar sync history policies
CREATE POLICY "calendar_sync_history_select_policy" ON public.calendar_sync_history
FOR SELECT USING (auth.role() = 'authenticated');

-- Profiles policies
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);