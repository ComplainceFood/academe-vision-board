
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingItem } from "@/types/shoppingList";

interface ItemDetailDialogProps {
  item: ShoppingItem | null;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Quantity:</span>
            <span className="font-medium">{item?.quantity}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Priority:</span>
            <span className={`text-xs px-2 py-0.5 rounded ${item ? getPriorityColor(item.priority) : ''}`}>
              {item?.priority}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`text-xs px-2 py-0.5 rounded ${item?.purchased ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {item?.purchased ? 'Purchased' : 'Needs to buy'}
            </span>
          </div>
          {item?.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Notes:</p>
              <p className="text-sm border rounded-md p-3 bg-muted/10">
                {item.notes}
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
