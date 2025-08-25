-- Create scholastic achievements table for tracking academic accomplishments
CREATE TABLE public.scholastic_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('publication', 'research_presentation', 'invited_talk', 'leadership_role')),
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  date DATE,
  co_authors TEXT[],
  url TEXT,
  impact_factor NUMERIC,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'submitted', 'accepted', 'published')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scholastic_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for scholastic achievements
CREATE POLICY "Users can view their own achievements" 
ON public.scholastic_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" 
ON public.scholastic_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.scholastic_achievements 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements" 
ON public.scholastic_achievements 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scholastic_achievements_updated_at
BEFORE UPDATE ON public.scholastic_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add validation trigger
CREATE TRIGGER validate_scholastic_achievements_input
BEFORE INSERT OR UPDATE ON public.scholastic_achievements
FOR EACH ROW
EXECUTE FUNCTION public.validate_user_input();