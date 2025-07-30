
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
import { useRefreshContext } from "@/App";

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddItemDialog = ({ 
  open, 
  onOpenChange
}: AddItemDialogProps) => {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [course, setCourse] = useState("");
  const [totalCount, setTotalCount] = useState<number>(1);
  const [currentCount, setCurrentCount] = useState<number>(1);
  const [threshold, setThreshold] = useState<number>(0);
  const [cost, setCost] = useState<string>("");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();

  const handleAddItem = async () => {
    if (!user || !itemName.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newItem = {
        name: itemName.trim(),
        category: category.trim() || "General",
        course: course.trim() || "General",
        total_count: totalCount,
        current_count: currentCount,
        threshold: threshold,
        cost: cost ? parseFloat(cost) : null,
        user_id: user.id
      };
      
      console.log("Inserting new supply item:", newItem);
      
      const { data, error } = await supabase
        .from('supplies')
        .insert(newItem)
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Successfully inserted item:", data);
      
      toast({
        title: "Success",
        description: "Item added to inventory",
      });
      
      // Clear form and refresh data
      resetForm();
      onOpenChange(false);
      triggerRefresh('supplies');
      
      // Force a page refresh event for real-time update
      window.dispatchEvent(new CustomEvent('refreshData', { detail: { table: 'supplies' } }));
      
    } catch (error) {
      console.error("Error adding inventory item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setItemName("");
    setCategory("");
    setCourse("");
    setTotalCount(1);
    setCurrentCount(1);
    setThreshold(0);
    setCost("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
          <DialogDescription>
            Add a new item to your inventory
          </DialogDescription>
        </DialogHeader>
        
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
        
        <DialogFooter>
          <Button variant="outline" onClick={() => {
            resetForm();
            onOpenChange(false);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddItem} 
            disabled={!itemName.trim() || totalCount < 0 || currentCount < 0}
          >
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
