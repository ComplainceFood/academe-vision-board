export interface Feedback {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface FeedbackFormData {
  category: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const FEEDBACK_CATEGORIES = [
  { value: 'overview', label: 'Dashboard Tab' },
  { value: 'notes', label: 'Notes & Commitments Tab' },
  { value: 'supplies', label: 'Supplies & Expenses Tab' },
  { value: 'meetings', label: 'Meetings Tab' },
  { value: 'planning', label: 'Semester & Planning Tab' },
  { value: 'funding', label: 'Grant Management Tab' },
  { value: 'analytics', label: 'Analytics Tab' },
  { value: 'communications', label: 'Admin Communications Tab' },
  { value: 'general', label: 'General Platform' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' }
];

export const FEEDBACK_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
];

export const FEEDBACK_STATUSES = [
  { value: 'open', label: 'Open', color: 'text-blue-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-yellow-600' },
  { value: 'resolved', label: 'Resolved', color: 'text-green-600' },
  { value: 'closed', label: 'Closed', color: 'text-gray-600' }
];