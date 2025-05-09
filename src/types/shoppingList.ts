
export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  purchased: boolean;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  user_id: string;
  supply_id?: string;
  created_at?: string;
}

export interface SupplyItem {
  id: string;
  name: string;
  category: string;
  current_count: number;
  total_count: number;
  threshold: number;
  course: string;
  last_restocked?: string;
  cost?: number;
  user_id: string;
}

// Interface for editing a shopping item
export interface ShoppingEditItem {
  name?: string;
  quantity?: number;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  purchased?: boolean;
}
