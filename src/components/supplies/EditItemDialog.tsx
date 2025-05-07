
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingItem } from "@/types/shoppingList";

interface EditItemDialogProps {
  item: ShoppingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedItem: Partial<ShoppingItem>) => void;
}

export const EditItemDialog = ({ 
  item, 
  open, 
  onOpenChange, 
  onSave 
}: EditItemDialogProps) => {
  const [editedItem, setEditedItem] = useState<Partial<ShoppingItem>>({});
  
  // Update editedItem whenever the input item changes
  React.useEffect(() => {
    if (item) {
      setEditedItem({...item});
    }
  }, [item]);

  const handleSave = () => {
    onSave(editedItem);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Update details for this shopping list item
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="editName">Item Name</Label>
            <Input 
              id="editName" 
              value={editedItem.name || ''}
              onChange={(e) => setEditedItem({...editedItem, name: e.target.value})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="editQuantity">Quantity</Label>
            <Input 
              id="editQuantity" 
              type="number" 
              min="1"
              value={editedItem.quantity || 1}
              onChange={(e) => setEditedItem({...editedItem, quantity: Number(e.target.value)})}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="editPriority">Priority</Label>
            <select 
              id="editPriority" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={editedItem.priority || 'medium'}
              onChange={(e) => setEditedItem({
                ...editedItem, 
                priority: e.target.value as 'low' | 'medium' | 'high'
              })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="editNotes">Notes (optional)</Label>
            <Input 
              id="editNotes" 
              value={editedItem.notes || ''}
              onChange={(e) => setEditedItem({...editedItem, notes: e.target.value})}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
