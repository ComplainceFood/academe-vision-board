
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingListItem } from "./ShoppingListItem";
import { useToast } from "@/hooks/use-toast";
import { ShoppingItem, SupplyItem } from "@/types/shoppingList";
import { useRefreshContext } from "@/App";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { EditItemDialog } from "./EditItemDialog";

interface ShoppingListProps {
  items: ShoppingItem[];
  supplies: SupplyItem[];
  onItemAdded: (item: ShoppingItem) => void;
  onItemUpdated: (item: ShoppingItem) => void;
  onItemDeleted: (id: string) => void;
}

export function ShoppingList({ 
  items, 
  supplies, 
  onItemAdded, 
  onItemUpdated, 
  onItemDeleted 
}: ShoppingListProps) {
  const [newItem, setNewItem] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [filteredItems, setFilteredItems] = useState<ShoppingItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ShoppingItem | null>(null);
  const { user } = useAuth();
  const { toast: uiToast } = useToast();
  const { triggerRefresh } = useRefreshContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (filter === "all") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => 
        filter === "purchased" ? item.purchased : !item.purchased
      ));
    }
  }, [items, filter]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !user) return;
    
    try {
      setIsSubmitting(true);
      const newShoppingItem: Omit<ShoppingItem, "id" | "created_at"> = {
        name: newItem.trim(),
        quantity,
        priority,
        purchased: false,
        notes: "",
        user_id: user.id,
        supply_id: undefined
      };
      
      const { data, error } = await supabase
        .from('shopping_list')
        .insert(newShoppingItem)
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success("Item added to shopping list");
      onItemAdded(data as ShoppingItem);
      setNewItem("");
      setQuantity(1);
      setPriority("medium");
      
      triggerRefresh('shopping_list');
      
    } catch (error) {
      console.error("Error adding item:", error);
      uiToast({
        variant: "destructive",
        description: "Failed to add item to shopping list",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTogglePurchased = async (id: string, purchased: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({ purchased })
        .eq('id', id);
        
      if (error) throw error;
      
      const updatedItem = items.find(item => item.id === id);
      if (updatedItem) {
        const newItem = { ...updatedItem, purchased };
        onItemUpdated(newItem);
        toast.success(purchased ? "Item marked as purchased" : "Item marked as not purchased");
      }
      
      triggerRefresh('shopping_list');
      
    } catch (error) {
      console.error("Error updating item:", error);
      uiToast({
        variant: "destructive",
        description: "Failed to update item",
      });
    }
  };
  
  const handlePurchaseAll = async () => {
    try {
      const unpurchasedItems = items.filter(item => !item.purchased);
      if (unpurchasedItems.length === 0) {
        toast.info("No items to purchase");
        return;
      }
      
      const { error } = await supabase
        .from('shopping_list')
        .update({ purchased: true })
        .in('id', unpurchasedItems.map(item => item.id));
        
      if (error) throw error;
      
      toast.success("All items marked as purchased");
      triggerRefresh('shopping_list');
      
    } catch (error) {
      console.error("Error updating items:", error);
      uiToast({
        variant: "destructive",
        description: "Failed to update items",
      });
    }
  };
  
  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      onItemDeleted(id);
      toast.success("Item removed from shopping list");
      triggerRefresh('shopping_list');
      
    } catch (error) {
      console.error("Error deleting item:", error);
      uiToast({
        variant: "destructive",
        description: "Failed to delete item",
      });
    }
  };

  const handleItemClick = (item: ShoppingItem) => {
    setSelectedItem(item);
    setIsDetailDialogOpen(true);
  };

  const handleEditClick = () => {
    if (selectedItem) {
      setItemToEdit(selectedItem);
      setIsDetailDialogOpen(false);
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = async (editedData: any) => {
    if (!itemToEdit || !user) return;
    
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update(editedData)
        .eq('id', itemToEdit.id);
      
      if (error) throw error;
      
      const updatedItem = { ...itemToEdit, ...editedData };
      onItemUpdated(updatedItem);
      
      uiToast({
        title: "Success",
        description: "Item updated successfully",
      });
      
      setIsEditDialogOpen(false);
      setItemToEdit(null);
      triggerRefresh('shopping_list');
      
    } catch (error) {
      console.error("Error updating shopping list item:", error);
      uiToast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };
  
  const pendingCount = items.filter(item => !item.purchased).length;
  const purchasedCount = items.filter(item => item.purchased).length;
  
  return (
    <div className="space-y-4 animate-in fade-in">
      <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Add new item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          className="flex-1"
          disabled={isSubmitting}
        />
        <div className="flex gap-2">
          <div>
            <Label htmlFor="quantity" className="sr-only">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-20"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="priority" className="sr-only">Priority</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Button 
            type="submit" 
            disabled={!newItem.trim() || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </div>
      </form>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({items.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === "purchased" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("purchased")}
          >
            Purchased ({purchasedCount})
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handlePurchaseAll}
          disabled={pendingCount === 0}
        >
          Mark All as Purchased
        </Button>
      </div>
      
      <div className="space-y-2 mt-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ShoppingListItem
              key={item.id}
              item={item}
              supplies={supplies}
              onTogglePurchased={handleTogglePurchased}
              onDelete={handleDeleteItem}
              onItemClick={handleItemClick}
              onItemUpdated={onItemUpdated}
              onItemDeleted={handleDeleteItem}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No items in this list</p>
            {filter !== "all" && (
              <Button 
                variant="link" 
                onClick={() => setFilter("all")}
              >
                Show all items
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Item Detail Dialog */}
      <ItemDetailDialog
        item={selectedItem}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onEdit={handleEditClick}
      />

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setItemToEdit(null);
        }}
        item={itemToEdit as any}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
