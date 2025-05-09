import React, { useState, useEffect } from "react";
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
import { useRefreshContext } from "@/App";
import { SupplyItem, ShoppingItem } from "@/types/shoppingList";

interface EditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SupplyItem | null;
  onSave?: (editedItem: any) => Promise<void>;
}

export const EditItemDialog = ({ 
  open, 
  onOpenChange,
  item,
  onSave
}: EditItemDialogProps) => {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [course, setCourse] = useState("");
  const [totalCount, setTotalCount] = useState<number>(1);
  const [currentCount, setCurrentCount] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(0);
  const [cost, setCost] = useState<string>("");
  
  // Additional fields for shopping list items
  const [priority, setPriority] = useState<string>("medium");
  const [notes, setNotes] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();

  // Determine if this is a shopping list item
  const isShoppingItem = item && 'priority' in item;

  // Load item data when the dialog opens or item changes
  useEffect(() => {
    if (item && open) {
      setItemName(item.name);
      
      if (isShoppingItem) {
        // Handle shopping list item fields
        const shoppingItem = item as any;
        setPriority(shoppingItem.priority || "medium");
        setNotes(shoppingItem.notes || "");
        setQuantity(shoppingItem.quantity || 1);
      } else {
        // Handle supply item fields
        setCategory(item.category);
        setCourse(item.course);
        setTotalCount(item.total_count);
        setCurrentCount(item.current_count);
        setThreshold(item.threshold);
        setCost(item.cost?.toString() || "");
      }
    }
  }, [item, open]);

  const handleEditItem = async () => {
    if (!user || !item?.id || !itemName.trim()) return;
    
    try {
      // If onSave prop is provided, use it (for shopping list items)
      if (onSave && isShoppingItem) {
        const editedItem = {
          name: itemName.trim(),
          quantity: quantity,
          priority: priority,
          notes: notes
        };
        
        await onSave(editedItem);
        return; // Exit early as onSave will handle the rest
      }
      
      // Otherwise, handle as a regular supply item
      const updatedItem = {
        name: itemName.trim(),
        category: category.trim() || "General",
        course: course.trim() || "General",
        total_count: totalCount,
        current_count: currentCount,
        threshold: threshold,
        cost: cost ? parseFloat(cost) : null,
      };
      
      const { error } = await supabase
        .from('supplies')
        .update(updatedItem as any)
        .eq('id', item.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      
      onOpenChange(false);
      triggerRefresh('supplies');
      
    } catch (error) {
      console.error("Error updating inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isShoppingItem ? "Edit Shopping List Item" : "Edit Inventory Item"}
          </DialogTitle>
          <DialogDescription>
            Update the details for this {isShoppingItem ? "shopping list item" : "inventory item"}
          </DialogDescription>
        </DialogHeader>
        
        {isShoppingItem ? (
          // Shopping list item form
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input 
                id="itemName" 
                placeholder="Enter item name..." 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input 
                id="quantity" 
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input 
                id="notes" 
                placeholder="Add notes..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        ) : (
          // Regular inventory item form
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input 
                id="itemName" 
                placeholder="Enter item name..." 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category" 
                  placeholder="General" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Input 
                  id="course" 
                  placeholder="General" 
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalCount">Total Count *</Label>
                <Input 
                  id="totalCount" 
                  type="number"
                  min="0"
                  value={totalCount}
                  onChange={(e) => setTotalCount(Number(e.target.value))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currentCount">Current Count *</Label>
                <Input 
                  id="currentCount" 
                  type="number"
                  min="0"
                  max={totalCount}
                  value={currentCount}
                  onChange={(e) => setCurrentCount(Number(e.target.value))}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="threshold">Low Stock Threshold *</Label>
                <Input 
                  id="threshold" 
                  type="number"
                  min="0"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cost">Unit Cost</Label>
                <Input 
                  id="cost" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="(Optional)"
                />
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleEditItem} 
            disabled={!itemName.trim() || (isShoppingItem ? quantity < 1 : totalCount < 0 || currentCount < 0)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
