-- Fix RLS policies for expenses table
CREATE POLICY "expenses_insert_policy"
ON public.expenses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_select_policy"
ON public.expenses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "expenses_update_policy"
ON public.expenses
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "expenses_delete_policy"
ON public.expenses
FOR DELETE
USING (auth.uid() = user_id);