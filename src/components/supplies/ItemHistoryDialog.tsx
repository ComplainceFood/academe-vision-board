
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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

  // In a real application, we would fetch actual history data
  // For now, this is a placeholder component
  const mockHistory = [
    { date: new Date(), action: "Stock updated", details: "Count changed from 10 to 5" },
    { date: new Date(Date.now() - 86400000), action: "Added to shopping list", details: "Quantity: 5" },
    { date: new Date(Date.now() - 86400000 * 2), action: "Stock updated", details: "Count changed from 15 to 10" }
  ];

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
          {mockHistory.map((entry, index) => (
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
          ))}
          
          {mockHistory.length === 0 && (
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
