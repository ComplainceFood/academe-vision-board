import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FundingSource, FundingExpenditure } from "@/types/funding";

interface ExpenditureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpenditure?: FundingExpenditure | null;
  onSuccess?: () => void;
}

export const ExpenditureDialog = ({ 
  open, 
  onOpenChange, 
  editingExpenditure, 
  onSuccess 
}: ExpenditureDialogProps) => {
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [formData, setFormData] = useState({
    funding_source_id: editingExpenditure?.funding_source_id || "",
    amount: editingExpenditure?.amount?.toString() || "",
    description: editingExpenditure?.description || "",
    category: editingExpenditure?.category || "",
    expenditure_date: editingExpenditure?.expenditure_date || new Date().toISOString().split('T')[0],
    receipt_number: editingExpenditure?.receipt_number || "",
    approved_by: editingExpenditure?.approved_by || "",
    approval_date: editingExpenditure?.approval_date || "",
    notes: editingExpenditure?.notes || "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchFundingSources = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('funding_sources')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        console.error("Error fetching funding sources:", error);
        return;
      }
      
      setFundingSources((data || []) as FundingSource[]);
    };

    if (open) {
      fetchFundingSources();
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        user_id: user.id,
        approval_date: formData.approval_date || null,
      };

      if (editingExpenditure) {
        const { error } = await supabase
          .from('funding_expenditures')
          .update(submitData)
          .eq('id', editingExpenditure.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Expenditure updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('funding_expenditures')
          .insert([submitData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Expenditure recorded successfully",
        });
      }
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving expenditure:", error);
      toast({
        title: "Error",
        description: "Failed to save expenditure",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingExpenditure ? "Edit Expenditure" : "Record New Expenditure"}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-1">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="funding_source_id">Funding Source *</Label>
              <Select 
                value={formData.funding_source_id} 
                onValueChange={(value) => setFormData({ ...formData, funding_source_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funding source" />
                </SelectTrigger>
                <SelectContent>
                  {fundingSources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name} (${source.remaining_amount.toFixed(2)} remaining)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Supplies, Equipment, Travel"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenditure_date">Expenditure Date *</Label>
                <Input
                  id="expenditure_date"
                  type="date"
                  value={formData.expenditure_date}
                  onChange={(e) => setFormData({ ...formData, expenditure_date: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="approved_by">Approved By</Label>
                <Input
                  id="approved_by"
                  value={formData.approved_by}
                  onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="approval_date">Approval Date</Label>
                <Input
                  id="approval_date"
                  type="date"
                  value={formData.approval_date}
                  onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingExpenditure ? "Update" : "Record"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};