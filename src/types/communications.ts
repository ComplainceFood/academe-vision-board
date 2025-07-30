export interface AdminCommunication {
  id: string;
  admin_id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const COMMUNICATION_CATEGORIES = [
  'general',
  'features',
  'maintenance',
  'security',
  'updates',
  'announcements'
] as const;

export const COMMUNICATION_PRIORITIES = [
  'low',
  'normal', 
  'high',
  'urgent'
] as const;