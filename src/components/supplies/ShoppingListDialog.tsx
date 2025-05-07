
import React from "react";
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

interface ShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShoppingListDialog = ({ open, onOpenChange }: ShoppingListDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <span>Shopping List</span>
          </DialogTitle>
          <DialogDescription>
            Manage your supply shopping list
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ShoppingList />
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
