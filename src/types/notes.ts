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
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  status?: 'active' | 'completed' | 'archived';
}