
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Plus, Save } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingItem, SupplyItem, ShoppingEditItem } from "@/types/shoppingList";
import { ShoppingListItem } from "./ShoppingListItem";
import { ItemDetailDialog } from "./ItemDetailDialog";
import { EditItemDialog } from "./EditItemDialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ShoppingListProps {
  items: ShoppingItem[];
  supplies: SupplyItem[];
  onItemAdded: (item: ShoppingItem) => void;
  onItemUpdated: (item: ShoppingItem) => void;
  onItemDeleted: (id: string) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, supplies, onItemAdded, onItemUpdated, onItemDeleted }) => {
  const [open, setOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemPriority, setNewItemPriority] = useState<"low" | "medium" | "high">("medium");
  const [newItemSupplyId, setNewItemSupplyId] = useState<string | undefined>(undefined);
  const [selectedSupply, setSelectedSupply] = useState<SupplyItem | undefined>(undefined);
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();

  // States for handling item details and edit functionality
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    if (newItemSupplyId) {
      const supply = supplies.find((s) => s.id === newItemSupplyId);
      setSelectedSupply(supply);
    } else {
      setSelectedSupply(undefined);
    }
  }, [newItemSupplyId, supplies]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || !user) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .insert([{
          name: newItemName.trim(),
          quantity: newItemQuantity,
          priority: newItemPriority,
          user_id: user.id,
          supply_id: newItemSupplyId,
          purchased: false,
        }])
        .select()
        .single();

      if (error) {
        console.error("Error adding item:", error);
        toast("Error adding item: " + error.message);
      } else if (data) {
        // Type assertion to ensure data conforms to ShoppingItem
        const newItem: ShoppingItem = {
          id: data.id,
          name: data.name,
          quantity: data.quantity,
          purchased: data.purchased,
          priority: data.priority as "low" | "medium" | "high",
          notes: data.notes || undefined,
          user_id: data.user_id,
          supply_id: data.supply_id || undefined,
          created_at: data.created_at
        };
        
        onItemAdded(newItem);
        setNewItemName("");
        setNewItemQuantity(1);
        setNewItemPriority("medium");
        setNewItemSupplyId(undefined);
        setOpen(false);
        toast("Item added to shopping list!");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleItemClick = (item: ShoppingItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setIsEditOpen(true);
  };

  const handleUpdateItem = async (updatedItem: ShoppingEditItem) => {
    if (!editingItem) return;
    
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({
          name: updatedItem.name,
          quantity: updatedItem.quantity,
          priority: updatedItem.priority,
          notes: updatedItem.notes,
          purchased: updatedItem.purchased
        })
        .eq('id', editingItem.id);
      
      if (error) throw error;
      
      // Create updated item for UI update
      const updated: ShoppingItem = {
        ...editingItem,
        name: updatedItem.name || editingItem.name,
        quantity: updatedItem.quantity !== undefined ? updatedItem.quantity : editingItem.quantity,
        priority: updatedItem.priority || editingItem.priority,
        notes: updatedItem.notes,
        purchased: updatedItem.purchased !== undefined ? updatedItem.purchased : editingItem.purchased
      };
      
      onItemUpdated(updated);
      setIsEditOpen(false);
      setEditingItem(null);
      toast("Item updated successfully");
    } catch (error) {
      console.error("Error updating item:", error);
      toast("Failed to update item");
    }
  };

  const handleTogglePurchased = async (id: string, purchased: boolean) => {
    try {
      const { error } = await supabase
        .from('shopping_list')
        .update({ purchased })
        .eq('id', id);
      
      if (error) throw error;
      
      // Find and update the item in the list
      const updatedItem = items.find(item => item.id === id);
      if (updatedItem) {
        updatedItem.purchased = purchased;
        onItemUpdated({...updatedItem});
      }
      
      toast(purchased ? "Item marked as purchased" : "Item marked as not purchased");
    } catch (error) {
      console.error("Error updating item:", error);
      toast("Failed to update item status");
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
      toast("Item deleted successfully");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast("Failed to delete item");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          Shopping List
        </CardTitle>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No items in your shopping list yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <ShoppingListItem
                key={item.id}
                item={item}
                supplies={supplies}
                onTogglePurchased={handleTogglePurchased}
                onDelete={handleDeleteItem}
                onItemClick={handleItemClick}
              />
            ))}
          </ul>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add a new item</DialogTitle>
            <DialogDescription>
              Add a new item to your shopping list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input id="name" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={newItemQuantity.toString()}
                onChange={(e) => setNewItemQuantity(parseInt(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <Select onValueChange={(value) => setNewItemPriority(value as "low" | "medium" | "high")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <Badge variant="secondary">Low</Badge>
                  </SelectItem>
                  <SelectItem value="medium">
                    <Badge variant="outline">Medium</Badge>
                  </SelectItem>
                  <SelectItem value="high">
                    <Badge variant="destructive">High</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supply" className="text-right">
                Link to Supply
              </Label>
              <Select onValueChange={(value) => setNewItemSupplyId(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select supply (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {supplies.map((supply) => (
                    <SelectItem key={supply.id} value={supply.id}>
                      {supply.name}
                    </SelectItem>
                  ))}
                  <SelectItem value={undefined}>None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedSupply && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Supply Info
                </Label>
                <div className="col-span-3">
                  <p className="text-sm font-medium">{selectedSupply.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Current Count: {selectedSupply.current_count} / {selectedSupply.total_count}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleAddItem} disabled={isAdding}>
              {isAdding ? (
                <>
                  Adding...
                  <Save className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  Add to List
                  <Plus className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Item Detail Dialog */}
      {selectedItem && (
        <ItemDetailDialog
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          item={selectedItem}
          onEdit={() => {
            setIsDetailOpen(false);
            setEditingItem(selectedItem);
            setIsEditOpen(true);
          }}
          onDelete={() => {
            setIsDetailOpen(false);
            handleDeleteItem(selectedItem.id);
          }}
        />
      )}
      
      {/* Edit Item Dialog */}
      {editingItem && (
        <EditItemDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          item={editingItem}
          onSave={handleUpdateItem}
        />
      )}
    </Card>
  );
};
