
export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  current_count: number;
  total_count: number;
  threshold: number;
  cost?: number;
  course: string;
  last_restocked?: string;
  user_id: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  purchased: boolean;
  notes?: string;
  supply_id?: string;
  user_id: string;
  created_at?: string;
}
