import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag } from "lucide-react";
import { ShoppingList } from "./ShoppingList";
import { ShoppingListCsvManager } from "./ShoppingListCsvManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingItem, SupplyItem } from "@/types/shoppingList";
import { useRefreshContext } from "@/App";

interface ShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShoppingListDialog = ({ open, onOpenChange }: ShoppingListDialogProps) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();

  // Fetch shopping list items and supplies when dialog opens
  useEffect(() => {
    if (open && user) {
      fetchShoppingItems();
      fetchSupplies();
    }
  }, [open, user]);

  const fetchShoppingItems = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedItems: ShoppingItem[] = data?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        purchased: item.purchased,
        priority: item.priority as "low" | "medium" | "high",
        notes: item.notes || undefined,
        user_id: item.user_id,
        supply_id: item.supply_id || undefined,
        created_at: item.created_at
      })) || [];
      
      setItems(typedItems);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupplies = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('supplies')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSupplies(data || []);
    } catch (error) {
      console.error("Error fetching supplies:", error);
    }
  };

  const handleItemAdded = (item: ShoppingItem) => {
    setItems(prev => [item, ...prev]);
    triggerRefresh('shopping_list');
  };

  const handleItemUpdated = (item: ShoppingItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? item : i));
    triggerRefresh('shopping_list');
  };

  const handleItemDeleted = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    triggerRefresh('shopping_list');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Shopping List</span>
            </DialogTitle>
            <ShoppingListCsvManager items={items} onRefetch={fetchShoppingItems} />
          </div>
          <DialogDescription>
            Manage your supply shopping list
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="text-center py-12">Loading shopping list...</div>
          ) : (
            <ShoppingList 
              items={items}
              supplies={supplies}
              onItemAdded={handleItemAdded}
              onItemUpdated={handleItemUpdated}
              onItemDeleted={handleItemDeleted}
            />
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
