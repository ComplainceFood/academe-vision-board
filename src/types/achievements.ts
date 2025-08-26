export interface Achievement {
  id: string;
  user_id: string;
  category: 'publication' | 'research_presentation' | 'invited_talk' | 'leadership_role' | 'course_taught' | 'award_honor' | 'service_review' | 'student_supervision' | 'teaching_performance' | 'professional_development' | 'external_impact';
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
  term?: string;
  student_count?: number;
  award_type?: string;
  organization?: string;
  journal_name?: string;
  review_count?: number;
  student_name?: string;
  student_level?: 'undergraduate' | 'masters' | 'phd' | 'postdoc';
  evaluation_score?: number;
  course_code?: string;
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
  term?: string;
  student_count?: number;
  award_type?: string;
  organization?: string;
  journal_name?: string;
  review_count?: number;
  student_name?: string;
  student_level?: 'undergraduate' | 'masters' | 'phd' | 'postdoc';
  evaluation_score?: number;
  course_code?: string;
}

export interface UpdateAchievementRequest extends Partial<CreateAchievementRequest> {
  id: string;
}