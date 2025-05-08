
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SupplyItem {
  id: string;
  name: string;
  category: string;
  current_count: number;
  total_count: number;
  threshold: number;
  course: string;
  last_restocked?: string;
  cost?: number;
}

interface HistoryEntry {
  date: Date;
  action: string;
  details: string;
}

interface ItemHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: SupplyItem | null;
}

export const ItemHistoryDialog = ({
  open,
  onOpenChange,
  item
}: ItemHistoryDialogProps) => {
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch actual history data when the dialog opens and item changes
  useEffect(() => {
    if (open && item) {
      fetchItemHistory(item.id);
    }
  }, [open, item]);

  // Fetch item history from shopping_list and supplies tables
  const fetchItemHistory = async (itemId: string) => {
    setIsLoading(true);

    try {
      // Check for shopping list entries related to this item
      const { data: shoppingData, error: shoppingError } = await supabase
        .from('shopping_list')
        .select('*')
        .eq('supply_id', itemId)
        .order('created_at', { ascending: false });
      
      if (shoppingError) throw shoppingError;

      // Get history of restocks from supplies table
      const { data: suppliesData, error: suppliesError } = await supabase
        .from('supplies')
        .select('last_restocked')
        .eq('id', itemId)
        .single();
      
      if (suppliesError && suppliesError.code !== 'PGRST116') throw suppliesError;

      // Combine and process history entries
      const historyEntries: HistoryEntry[] = [];

      // Add shopping list entries
      if (shoppingData) {
        shoppingData.forEach(entry => {
          historyEntries.push({
            date: new Date(entry.created_at || Date.now()),
            action: "Added to shopping list",
            details: `Quantity: ${entry.quantity}, Priority: ${entry.priority}${entry.purchased ? ' (Purchased)' : ''}`
          });
        });
      }

      // Add restock entries if available
      if (suppliesData?.last_restocked) {
        historyEntries.push({
          date: new Date(suppliesData.last_restocked),
          action: "Restocked",
          details: `Inventory updated`
        });
      }

      // If we don't have any real history yet, provide some defaults
      if (historyEntries.length === 0) {
        historyEntries.push(
          { date: new Date(), action: "Item created", details: `Initial stock: ${item?.current_count}` }
        );
      }

      // Sort by date, most recent first
      historyEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setHistory(historyEntries);
    } catch (error) {
      console.error("Error fetching item history:", error);
      toast({
        title: "Error",
        description: "Failed to load item history",
        variant: "destructive",
      });
      
      // Fallback to some default history if fetching fails
      setHistory([
        { date: new Date(), action: "Item created", details: `Initial stock: ${item?.current_count}` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Item History</DialogTitle>
          <DialogDescription>
            {item?.name ? `Recent activity for ${item.name}` : "Item history"}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          {isLoading ? (
            // Show loading skeletons
            <>
              {[1, 2, 3].map(index => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </>
          ) : history.length > 0 ? (
            // Show actual history
            history.map((entry, index) => (
              <div key={index} className="border-b pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{entry.action}</p>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(entry.date, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            // No history available
            <div className="text-center py-6">
              <p className="text-muted-foreground">No history available</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
