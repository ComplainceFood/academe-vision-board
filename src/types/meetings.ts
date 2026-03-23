export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: 'one_on_one' | 'group' | 'lecture' | 'office_hours' | 'committee';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  start_date: string;
  start_time: string;
  end_time: string;
  location: string;
  attendees: AttendeeInfo[];
  agenda?: string;
  notes?: string;
  action_items: ActionItem[];
  attachments: Attachment[];
  is_recurring: boolean;
  recurring_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurring_end_date?: string;
  reminder_minutes?: number;
  created_at: string;
  updated_at: string;
  funding_source_id?: string | null;
}

export interface AttendeeInfo {
  name: string;
  email?: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  required: boolean;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  type: 'one_on_one' | 'group' | 'lecture' | 'office_hours' | 'committee';
  start_date: string;
  start_time: string;
  end_time: string;
  location: string;
  attendees: AttendeeInfo[];
  agenda?: string;
  is_recurring?: boolean;
  recurring_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurring_end_date?: string;
  reminder_minutes?: number;
  funding_source_id?: string | null;
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  notes?: string;
  action_items?: ActionItem[];
}