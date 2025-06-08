
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { ShoppingItem, SupplyItem } from "@/types/shoppingList";

interface ShoppingListItemProps {
  item: ShoppingItem;
  supplies?: SupplyItem[];
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onDelete: (id: string) => void;
  onItemClick: (item: ShoppingItem) => void;
  onItemUpdated?: (item: ShoppingItem) => void;
  onItemDeleted?: (id: string) => Promise<void>;
}

export const ShoppingListItem = ({ 
  item, 
  supplies,
  onTogglePurchased, 
  onDelete,
  onItemClick,
  onItemUpdated,
  onItemDeleted
}: ShoppingListItemProps) => {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive bg-destructive/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-green-500 bg-green-500/10';
      default: return 'text-muted-foreground bg-muted/10';
    }
  };

  const handleTogglePurchased = () => {
    onTogglePurchased(item.id, !item.purchased);
    if (onItemUpdated) {
      onItemUpdated({ ...item, purchased: !item.purchased });
    }
  };

  const handleDelete = async () => {
    if (onItemDeleted) {
      await onItemDeleted(item.id);
    } else {
      onDelete(item.id);
    }
  };

  return (
    <div 
      key={item.id} 
      className={`p-3 border rounded-lg flex items-center justify-between gap-4 ${
        item.purchased ? 'bg-muted/30' : 'bg-card'
      } hover:bg-accent/10 transition-colors cursor-pointer`}
      onClick={() => onItemClick(item)}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox 
          checked={item.purchased} 
          onCheckedChange={handleTogglePurchased}
          onClick={(e) => e.stopPropagation()}
          className="transition-transform hover:scale-110"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-medium ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
              {item.name}
            </p>
            <div className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(item.priority)}`}>
              {item.priority}
            </div>
          </div>
          {item.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          x{item.quantity}
        </span>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
