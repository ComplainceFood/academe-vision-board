
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingItem, SupplyItem } from "@/types/shoppingList";

interface ItemDetailDialogProps {
  item: SupplyItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export const ItemDetailDialog = ({ 
  item, 
  open, 
  onOpenChange, 
  onEdit 
}: ItemDetailDialogProps) => {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  if (!item) return null;

  // Helper function to determine if item is a shopping item (has purchased property)
  const isShoppingItem = (item: any): item is ShoppingItem => {
    return 'purchased' in item;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <span className="font-medium">{isShoppingItem(item) ? item.quantity : item.current_count}</span>
          </div>
          {(item as any)?.priority && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor((item as any).priority)}`}>
                {(item as any).priority}
              </span>
            </div>
          )}
          {isShoppingItem(item) && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className={`text-xs px-2 py-0.5 rounded ${item.purchased ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {item.purchased ? 'Purchased' : 'Needs to buy'}
              </span>
            </div>
          )}
          {!isShoppingItem(item) && item.category && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Category:</span>
              <span className="font-medium">{item.category}</span>
            </div>
          )}
          {(item as any)?.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes:</p>
              <p className="text-sm border rounded-md p-3 bg-muted/10">
                {(item as any).notes}
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onEdit}>
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
