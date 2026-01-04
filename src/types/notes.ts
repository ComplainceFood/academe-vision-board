export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'note' | 'commitment' | 'reminder';
  course: string;
  student_name?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'archived';
  due_date?: string;
  starred: boolean;
  created_at: string;
  updated_at: string;
  // New fields for advanced features
  subtasks?: Subtask[];
  recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  parent_folder_id?: string | null;
  is_folder?: boolean;
  folder_color?: string | null;
}

export interface Folder {
  id: string;
  user_id: string;
  title: string;
  folder_color: string;
  parent_folder_id?: string | null;
  is_folder: true;
  created_at: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  type: 'note' | 'commitment' | 'reminder';
  course: string;
  student_name?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  starred?: boolean;
  subtasks?: Subtask[];
  recurrence_pattern?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | null;
  recurrence_end_date?: string | null;
  parent_folder_id?: string | null;
}

export interface CreateFolderData {
  title: string;
  folder_color?: string;
  parent_folder_id?: string | null;
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  status?: 'active' | 'completed' | 'archived';
  is_folder?: boolean;
}

export type RecurrencePattern = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export const RECURRENCE_LABELS: Record<RecurrencePattern, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  monthly: 'Monthly',
};

export const FOLDER_COLORS = [
  { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { id: 'green', label: 'Green', class: 'bg-green-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
];
