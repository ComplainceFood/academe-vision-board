export interface FundingSource {
  id: string;
  user_id: string;
  name: string;
  type: 'grant' | 'donation' | 'budget_allocation' | 'fundraising' | 'other';
  total_amount: number;
  remaining_amount: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'expired' | 'depleted' | 'pending';
  description?: string;
  restrictions?: string;
  contact_person?: string;
  contact_email?: string;
  reporting_requirements?: string;
  created_at: string;
  updated_at: string;
}

export interface FundingExpenditure {
  id: string;
  user_id: string;
  funding_source_id: string;
  expense_id?: string;
  supply_id?: string;
  amount: number;
  description: string;
  category: string;
  expenditure_date: string;
  receipt_number?: string;
  approved_by?: string;
  approval_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  funding_source?: FundingSource;
}

export interface FundingCommitment {
  id: string;
  user_id: string;
  funding_source_id: string;
  title: string;
  description?: string;
  committed_amount: number;
  commitment_date: string;
  due_date?: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  funding_source?: FundingSource;
}

export interface FundingReport {
  id: string;
  user_id: string;
  funding_source_id: string;
  report_type: 'quarterly' | 'annual' | 'final' | 'interim' | 'custom';
  report_period_start: string;
  report_period_end: string;
  total_expenditures: number;
  remaining_balance: number;
  report_content?: string;
  submitted_date?: string;
  due_date?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submission_notes?: string;
  created_at: string;
  updated_at: string;
  funding_source?: FundingSource;
}