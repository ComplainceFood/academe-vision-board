
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  current_count: number;
  total_count: number;
  threshold: number;
  course: string;
}

interface AddToShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SupplyItem | null;
}

export const AddToShoppingListDialog = ({ 
  open, 
  onOpenChange,
  item 
}: AddToShoppingListDialogProps) => {
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(
    item?.current_count <= item?.threshold ? 'high' : 'medium'
  );
  const [notes, setNotes] = useState<string>(`Restock ${item?.name || ''}`);
  
  const { toast } = useToast();
  const { user } = useAuth();

  const handleAddToShoppingList = async () => {
    if (!user || !item) return;
    
    try {
      const newItem = {
        name: item.name,
        quantity,
        purchased: false,
        priority,
        notes,
        user_id: user.id,
        supply_id: item.id
      };
      
      const { error } = await supabase.from('shopping_list').insert(newItem);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `${item.name} added to shopping list`,
      });
      
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error adding to shopping list:", error);
      toast({
        title: "Error",
        description: "Failed to add item to shopping list",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Shopping List</DialogTitle>
          <DialogDescription>
            Add {item?.name} to your shopping list
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity to Purchase</Label>
            <Input 
              id="quantity" 
              type="number" 
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <select 
              id="priority" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input 
              id="notes" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddToShoppingList}>
            Add to Shopping List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
