-- Create funding_sources table
CREATE TABLE public.funding_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('grant', 'donation', 'budget_allocation', 'fundraising', 'other')),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  remaining_amount DECIMAL(12,2) NOT NULL CHECK (remaining_amount >= 0),
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted', 'pending')),
  description TEXT,
  restrictions TEXT,
  contact_person TEXT,
  contact_email TEXT,
  reporting_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_amount_relationship CHECK (remaining_amount <= total_amount),
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create funding_expenditures table
CREATE TABLE public.funding_expenditures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funding_source_id UUID NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  supply_id UUID REFERENCES public.supplies(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  expenditure_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_number TEXT,
  approved_by TEXT,
  approval_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT expenditure_reference_check CHECK (
    (expense_id IS NOT NULL AND supply_id IS NULL) OR 
    (expense_id IS NULL AND supply_id IS NOT NULL) OR 
    (expense_id IS NULL AND supply_id IS NULL)
  )
);

-- Create funding_commitments table
CREATE TABLE public.funding_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funding_source_id UUID NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  committed_amount DECIMAL(12,2) NOT NULL CHECK (committed_amount > 0),
  commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_commitment_dates CHECK (due_date IS NULL OR due_date >= commitment_date)
);

-- Create funding_reports table
CREATE TABLE public.funding_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  funding_source_id UUID NOT NULL REFERENCES public.funding_sources(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('quarterly', 'annual', 'final', 'interim', 'custom')),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_expenditures DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_expenditures >= 0),
  remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
  report_content TEXT,
  submitted_date DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submission_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_report_period CHECK (report_period_end >= report_period_start)
);

-- Enable RLS on all tables
ALTER TABLE public.funding_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for funding_sources
CREATE POLICY "Users can view their own funding sources" 
ON public.funding_sources 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funding sources" 
ON public.funding_sources 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funding sources" 
ON public.funding_sources 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funding sources" 
ON public.funding_sources 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for funding_expenditures
CREATE POLICY "Users can view their own funding expenditures" 
ON public.funding_expenditures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funding expenditures" 
ON public.funding_expenditures 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funding expenditures" 
ON public.funding_expenditures 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funding expenditures" 
ON public.funding_expenditures 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for funding_commitments
CREATE POLICY "Users can view their own funding commitments" 
ON public.funding_commitments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funding commitments" 
ON public.funding_commitments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funding commitments" 
ON public.funding_commitments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funding commitments" 
ON public.funding_commitments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for funding_reports
CREATE POLICY "Users can view their own funding reports" 
ON public.funding_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own funding reports" 
ON public.funding_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funding reports" 
ON public.funding_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funding reports" 
ON public.funding_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_funding_sources_updated_at
BEFORE UPDATE ON public.funding_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funding_expenditures_updated_at
BEFORE UPDATE ON public.funding_expenditures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funding_commitments_updated_at
BEFORE UPDATE ON public.funding_commitments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_funding_reports_updated_at
BEFORE UPDATE ON public.funding_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update funding source remaining amount
CREATE OR REPLACE FUNCTION public.update_funding_source_balance()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update funding source balance
CREATE TRIGGER update_balance_on_expenditure_insert
AFTER INSERT ON public.funding_expenditures
FOR EACH ROW
EXECUTE FUNCTION public.update_funding_source_balance();

CREATE TRIGGER update_balance_on_expenditure_update
AFTER UPDATE ON public.funding_expenditures
FOR EACH ROW
EXECUTE FUNCTION public.update_funding_source_balance();

CREATE TRIGGER update_balance_on_expenditure_delete
AFTER DELETE ON public.funding_expenditures
FOR EACH ROW
EXECUTE FUNCTION public.update_funding_source_balance();

-- Create indexes for better performance
CREATE INDEX idx_funding_sources_user_id ON public.funding_sources(user_id);
CREATE INDEX idx_funding_sources_status ON public.funding_sources(status);
CREATE INDEX idx_funding_sources_type ON public.funding_sources(type);
CREATE INDEX idx_funding_sources_dates ON public.funding_sources(start_date, end_date);

CREATE INDEX idx_funding_expenditures_user_id ON public.funding_expenditures(user_id);
CREATE INDEX idx_funding_expenditures_funding_source ON public.funding_expenditures(funding_source_id);
CREATE INDEX idx_funding_expenditures_date ON public.funding_expenditures(expenditure_date);
CREATE INDEX idx_funding_expenditures_category ON public.funding_expenditures(category);

CREATE INDEX idx_funding_commitments_user_id ON public.funding_commitments(user_id);
CREATE INDEX idx_funding_commitments_funding_source ON public.funding_commitments(funding_source_id);
CREATE INDEX idx_funding_commitments_status ON public.funding_commitments(status);
CREATE INDEX idx_funding_commitments_priority ON public.funding_commitments(priority);

CREATE INDEX idx_funding_reports_user_id ON public.funding_reports(user_id);
CREATE INDEX idx_funding_reports_funding_source ON public.funding_reports(funding_source_id);
CREATE INDEX idx_funding_reports_type_status ON public.funding_reports(report_type, status);