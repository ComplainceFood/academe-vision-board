export interface Achievement {
  id: string;
  user_id: string;
  category: 'publication' | 'research_presentation' | 'invited_talk' | 'leadership_role';
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  co_authors?: string[];
  url?: string;
  impact_factor?: number;
  status: 'completed' | 'in_progress' | 'submitted' | 'accepted' | 'published';
  visibility: 'public' | 'private';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateAchievementRequest {
  category: Achievement['category'];
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  co_authors?: string[];
  url?: string;
  impact_factor?: number;
  status?: Achievement['status'];
  visibility?: Achievement['visibility'];
  tags?: string[];
}

export interface UpdateAchievementRequest extends Partial<CreateAchievementRequest> {
  id: string;
}