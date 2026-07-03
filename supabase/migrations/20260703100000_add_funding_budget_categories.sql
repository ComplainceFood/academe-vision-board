-- Per-category budget lines for funding sources (e.g. Travel $5,000, Equipment $12,000).
CREATE TABLE public.funding_budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  funding_source_id UUID NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  allocated_amount NUMERIC NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (funding_source_id, category)
);

CREATE INDEX idx_funding_budget_categories_source ON public.funding_budget_categories(funding_source_id);
CREATE INDEX idx_funding_budget_categories_user ON public.funding_budget_categories(user_id);

ALTER TABLE public.funding_budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget categories"
ON public.funding_budget_categories FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget categories"
ON public.funding_budget_categories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget categories"
ON public.funding_budget_categories FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget categories"
ON public.funding_budget_categories FOR DELETE
USING (auth.uid() = user_id);
