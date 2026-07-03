import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, X } from "lucide-react";
import { FundingSource } from "@/types/funding";

interface BudgetLine {
  category: string;
  allocated_amount: string;
}

interface FundingSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSource?: FundingSource | null;
  onSuccess?: () => void;
}

export const FundingSourceDialog = ({ 
  open, 
  onOpenChange, 
  editingSource, 
  onSuccess 
}: FundingSourceDialogProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    type: "grant" as 'grant' | 'donation' | 'budget_allocation' | 'fundraising' | 'other',
    total_amount: "",
    start_date: "",
    end_date: "",
    description: "",
    restrictions: "",
    contact_person: "",
    contact_email: "",
    reporting_requirements: "",
  });
  
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);

  // Load existing budget lines when editing
  useEffect(() => {
    if (!open) return;
    if (!editingSource) {
      setBudgetLines([]);
      return;
    }
    supabase
      .from('funding_budget_categories')
      .select('category, allocated_amount')
      .eq('funding_source_id', editingSource.id)
      .order('category')
      .then(({ data }) => {
        setBudgetLines((data || []).map(l => ({
          category: l.category,
          allocated_amount: l.allocated_amount.toString(),
        })));
      });
  }, [editingSource, open]);

  // Update form data when editingSource changes
  useEffect(() => {
    if (editingSource) {
      setFormData({
        name: editingSource.name || "",
        type: editingSource.type || "grant",
        total_amount: editingSource.total_amount?.toString() || "",
        start_date: editingSource.start_date || "",
        end_date: editingSource.end_date || "",
        description: editingSource.description || "",
        restrictions: editingSource.restrictions || "",
        contact_person: editingSource.contact_person || "",
        contact_email: editingSource.contact_email || "",
        reporting_requirements: editingSource.reporting_requirements || "",
      });
    } else {
      // Reset form for new funding source
      setFormData({
        name: "",
        type: "grant",
        total_amount: "",
        start_date: "",
        end_date: "",
        description: "",
        restrictions: "",
        contact_person: "",
        contact_email: "",
        reporting_requirements: "",
      });
    }
  }, [editingSource]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate budget lines before saving
    const cleanedLines = budgetLines
      .map(l => ({ category: l.category.trim(), allocated_amount: parseFloat(l.allocated_amount) }))
      .filter(l => l.category && !isNaN(l.allocated_amount) && l.allocated_amount > 0);
    const categoryNames = cleanedLines.map(l => l.category.toLowerCase());
    if (new Set(categoryNames).size !== categoryNames.length) {
      toast({ title: "Duplicate categories", description: "Each budget category must be unique.", variant: "destructive" });
      return;
    }
    const totalAllocated = cleanedLines.reduce((sum, l) => sum + l.allocated_amount, 0);
    const totalAmount = parseFloat(formData.total_amount);
    if (totalAllocated > totalAmount) {
      toast({
        title: "Over-allocated",
        description: `Category budgets ($${totalAllocated.toFixed(2)}) exceed the total amount ($${totalAmount.toFixed(2)}).`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        remaining_amount: editingSource ? editingSource.remaining_amount : parseFloat(formData.total_amount),
        user_id: user.id,
        end_date: formData.end_date || null,
      };

      let sourceId: string;
      if (editingSource) {
        const { error } = await supabase
          .from('funding_sources')
          .update(submitData)
          .eq('id', editingSource.id);

        if (error) throw error;
        sourceId = editingSource.id;

        toast({
          title: "Success",
          description: "Funding source updated successfully",
        });
      } else {
        const { data: created, error } = await supabase
          .from('funding_sources')
          .insert([submitData])
          .select('id')
          .single();

        if (error) throw error;
        sourceId = created.id;

        toast({
          title: "Success",
          description: "Funding source created successfully",
        });
      }

      // Replace budget lines for this source with the current set
      const { error: deleteError } = await supabase
        .from('funding_budget_categories')
        .delete()
        .eq('funding_source_id', sourceId);
      if (deleteError) throw deleteError;
      if (cleanedLines.length > 0) {
        const { error: insertError } = await supabase
          .from('funding_budget_categories')
          .insert(cleanedLines.map(l => ({ ...l, funding_source_id: sourceId, user_id: user.id })));
        if (insertError) throw insertError;
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving funding source:", error);
      toast({
        title: "Error",
        description: "Failed to save funding source",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {editingSource ? "Edit Funding Source" : "Add New Funding Source"}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 px-1">
          <form onSubmit={handleSubmit} className="space-y-4 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grant">Grant</SelectItem>
                    <SelectItem value="donation">Donation</SelectItem>
                    <SelectItem value="budget_allocation">Budget Allocation</SelectItem>
                    <SelectItem value="fundraising">Fundraising</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Per-category budget lines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category Budgets</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-primary"
                  onClick={() => setBudgetLines([...budgetLines, { category: "", allocated_amount: "" }])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add category
                </Button>
              </div>
              {budgetLines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Optionally split the total into budget categories (e.g. Travel, Equipment, Personnel) to track spending per category.
                </p>
              ) : (
                <div className="space-y-2">
                  {budgetLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        placeholder="Category (e.g. Travel)"
                        value={line.category}
                        onChange={(e) => {
                          const next = [...budgetLines];
                          next[idx] = { ...line, category: e.target.value };
                          setBudgetLines(next);
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Amount"
                        value={line.allocated_amount}
                        onChange={(e) => {
                          const next = [...budgetLines];
                          next[idx] = { ...line, allocated_amount: e.target.value };
                          setBudgetLines(next);
                        }}
                        className="w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                        onClick={() => setBudgetLines(budgetLines.filter((_, i) => i !== idx))}
                        title="Remove category"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground text-right">
                    Allocated: $
                    {budgetLines
                      .reduce((sum, l) => sum + (parseFloat(l.allocated_amount) || 0), 0)
                      .toFixed(2)}
                    {formData.total_amount && ` of $${parseFloat(formData.total_amount).toFixed(2)}`}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restrictions">Restrictions</Label>
              <Textarea
                id="restrictions"
                value={formData.restrictions}
                onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporting_requirements">Reporting Requirements</Label>
              <Textarea
                id="reporting_requirements"
                value={formData.reporting_requirements}
                onChange={(e) => setFormData({ ...formData, reporting_requirements: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : editingSource ? t('common.update') : t('common.create')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AddFundingSourceButton = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <FundingSourceDialog 
      open={open} 
      onOpenChange={setOpen}
      onSuccess={() => {
        onSuccess?.();
        setOpen(false);
      }}
    />
  );
};