
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
