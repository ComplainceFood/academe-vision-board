-- Add receipt_url column to expenses table
-- (the boolean `receipt` flag becomes the indicator; receipt_url stores the storage path)
ALTER TABLE public.expenses
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- profiles table was created without a DELETE policy - add it now
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);
