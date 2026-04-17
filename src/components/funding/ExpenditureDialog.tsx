import { useState, useEffect, useRef } from "react";
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
import { Upload, X, FileText, ExternalLink } from "lucide-react";

interface ExpenditureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpenditure?: FundingExpenditure | null;
  onSuccess?: () => void;
}

const ACCEPTED_TYPES = ".pdf,.png,.jpg,.jpeg,.gif,.webp";
const MAX_SIZE_MB = 10;

export const ExpenditureDialog = ({
  open,
  onOpenChange,
  editingExpenditure,
  onSuccess,
}: ExpenditureDialogProps) => {
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [formData, setFormData] = useState({
    funding_source_id: "",
    amount: "",
    description: "",
    category: "",
    expenditure_date: new Date().toISOString().split("T")[0],
    receipt_number: "",
    approved_by: "",
    approval_date: "",
    notes: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [existingReceiptPath, setExistingReceiptPath] = useState<string | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (editingExpenditure) {
      setFormData({
        funding_source_id: editingExpenditure.funding_source_id || "",
        amount: editingExpenditure.amount?.toString() || "",
        description: editingExpenditure.description || "",
        category: editingExpenditure.category || "",
        expenditure_date:
          editingExpenditure.expenditure_date || new Date().toISOString().split("T")[0],
        receipt_number: editingExpenditure.receipt_number || "",
        approved_by: editingExpenditure.approved_by || "",
        approval_date: editingExpenditure.approval_date || "",
        notes: editingExpenditure.notes || "",
      });
      setExistingReceiptPath(editingExpenditure.receipt_url || null);
    } else {
      setFormData({
        funding_source_id: "",
        amount: "",
        description: "",
        category: "",
        expenditure_date: new Date().toISOString().split("T")[0],
        receipt_number: "",
        approved_by: "",
        approval_date: "",
        notes: "",
      });
      setExistingReceiptPath(null);
    }
    setReceiptFile(null);
    setRemoveReceipt(false);
  }, [editingExpenditure, open]);

  useEffect(() => {
    const fetchFundingSources = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("funding_sources")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name");
      if (error) { console.error("Error fetching funding sources:", error); return; }
      setFundingSources((data || []) as FundingSource[]);
    };
    if (open) fetchFundingSources();
  }, [open, user]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${MAX_SIZE_MB} MB`,
        variant: "destructive",
      });
      return;
    }
    setReceiptFile(file);
    setRemoveReceipt(false);
  };

  const handleViewExistingReceipt = async () => {
    if (!existingReceiptPath) return;
    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(existingReceiptPath, 3600);
    if (error) {
      toast({ title: "Error", description: "Could not load receipt", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const expenseAmount = parseFloat(formData.amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid positive amount.", variant: "destructive" });
      return;
    }

    // Validate expenditure doesn't exceed available budget
    if (formData.funding_source_id) {
      const selectedSource = fundingSources.find(s => s.id === formData.funding_source_id);
      if (selectedSource) {
        const previousAmount = editingExpenditure ? (editingExpenditure.amount ?? 0) : 0;
        const netNew = expenseAmount - previousAmount;
        if (netNew > selectedSource.remaining_amount) {
          toast({
            title: "Insufficient budget",
            description: `Only $${selectedSource.remaining_amount.toFixed(2)} remaining in this funding source.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      let receipt_url: string | null = editingExpenditure?.receipt_url ?? null;

      // Remove old receipt if user clicked remove
      if (removeReceipt && existingReceiptPath) {
        await supabase.storage.from("receipts").remove([existingReceiptPath]);
        receipt_url = null;
      }

      // Upload new receipt — upload first, only delete old file after success
      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop()?.toLowerCase() || "bin";
        const filePath = `${user.id}/exp_${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(filePath, receiptFile, { upsert: false });

        if (uploadError) throw new Error(`Receipt upload failed: ${uploadError.message}`);

        // Only remove old file after new upload succeeds
        if (existingReceiptPath && !removeReceipt) {
          await supabase.storage.from("receipts").remove([existingReceiptPath]);
        }
        receipt_url = filePath;
      }

      const submitData = {
        ...formData,
        amount: expenseAmount,
        user_id: user.id,
        approval_date: formData.approval_date || null,
        receipt_url,
      };

      if (editingExpenditure) {
        const { error } = await supabase
          .from("funding_expenditures")
          .update(submitData)
          .eq("id", editingExpenditure.id);
        if (error) throw error;

        // Adjust remaining_amount by the difference
        if (formData.funding_source_id) {
          const previousAmount = editingExpenditure.amount ?? 0;
          const delta = expenseAmount - previousAmount;
          if (delta !== 0) {
            const source = fundingSources.find(s => s.id === formData.funding_source_id);
            if (source) {
              await supabase
                .from("funding_sources")
                .update({ remaining_amount: Math.max(0, source.remaining_amount - delta) })
                .eq("id", formData.funding_source_id);
            }
          }
        }

        toast({ title: "Success", description: "Expenditure updated successfully" });
      } else {
        const { error } = await supabase
          .from("funding_expenditures")
          .insert([submitData]);
        if (error) throw error;

        // Decrement remaining_amount on the funding source
        if (formData.funding_source_id) {
          const source = fundingSources.find(s => s.id === formData.funding_source_id);
          if (source) {
            await supabase
              .from("funding_sources")
              .update({ remaining_amount: Math.max(0, source.remaining_amount - expenseAmount) })
              .eq("id", formData.funding_source_id);
          }
        }

        toast({ title: "Success", description: "Expenditure recorded successfully" });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving expenditure:", error);
      toast({
        title: "Error",
        description: String(error) || "Failed to save expenditure",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
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

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label>Receipt / Invoice File</Label>
              {existingReceiptPath && !removeReceipt && !receiptFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm flex-1 text-muted-foreground">Receipt attached</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={handleViewExistingReceipt}
                    title="View receipt"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => setRemoveReceipt(true)}
                    title="Remove receipt"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : receiptFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(receiptFile.size / 1024).toFixed(0)} KB
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => {
                      setReceiptFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    title="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload receipt</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      PDF, PNG, JPG, WEBP · up to {MAX_SIZE_MB} MB
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_TYPES}
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </label>
              )}
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
