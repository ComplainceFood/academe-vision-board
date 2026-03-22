-- Allow users to delete their own feedback
CREATE POLICY "Users can delete their own feedback"
ON public.feedback
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Allow system admins to delete any feedback
CREATE POLICY "System admins can delete all feedback"
ON public.feedback
FOR DELETE
TO public
USING (current_user_has_role('system_admin'::app_role));