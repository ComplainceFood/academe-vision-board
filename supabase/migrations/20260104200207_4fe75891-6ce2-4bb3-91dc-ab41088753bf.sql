-- Add recurring task support and subtasks to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_occurrence DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parent_folder_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS folder_color TEXT DEFAULT NULL;

-- Add index for folder lookups
CREATE INDEX IF NOT EXISTS idx_notes_parent_folder ON public.notes(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_folder ON public.notes(is_folder);
CREATE INDEX IF NOT EXISTS idx_notes_due_date ON public.notes(due_date);

-- Create function to auto-create next occurrence for recurring tasks
CREATE OR REPLACE FUNCTION public.handle_recurring_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if task is being marked as completed and has recurrence
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.recurrence_pattern IS NOT NULL THEN
    -- Calculate next occurrence based on pattern
    INSERT INTO public.notes (
      title, content, type, course, priority, tags, user_id, due_date,
      recurrence_pattern, recurrence_end_date, subtasks, parent_folder_id
    )
    SELECT 
      NEW.title,
      NEW.content,
      NEW.type,
      NEW.course,
      NEW.priority,
      NEW.tags,
      NEW.user_id,
      CASE NEW.recurrence_pattern
        WHEN 'daily' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '1 day'
        WHEN 'weekly' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '1 week'
        WHEN 'biweekly' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '2 weeks'
        WHEN 'monthly' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '1 month'
        ELSE NULL
      END,
      NEW.recurrence_pattern,
      NEW.recurrence_end_date,
      -- Reset subtasks to uncompleted
      (SELECT jsonb_agg(jsonb_set(elem, '{completed}', 'false'::jsonb))
       FROM jsonb_array_elements(NEW.subtasks) AS elem),
      NEW.parent_folder_id
    WHERE 
      NEW.recurrence_end_date IS NULL 
      OR (CASE NEW.recurrence_pattern
        WHEN 'daily' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '1 day'
        WHEN 'weekly' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '1 week'
        WHEN 'biweekly' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '2 weeks'
        WHEN 'monthly' THEN COALESCE(NEW.due_date, CURRENT_DATE) + INTERVAL '1 month'
      END)::date <= NEW.recurrence_end_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for recurring tasks
DROP TRIGGER IF EXISTS on_recurring_task_completion ON public.notes;
CREATE TRIGGER on_recurring_task_completion
  AFTER UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_recurring_task_completion();