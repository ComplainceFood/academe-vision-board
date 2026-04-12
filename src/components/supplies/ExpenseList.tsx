
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, CheckCircle, FileText, MoreVertical, Plus, Trash2, Upload, X, Paperclip, ExternalLink } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRefreshContext } from "@/App";
import { ExpenseCsvManager } from "./ExpenseCsvManager";

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  course: string;
  receipt?: boolean | null;
  receipt_url?: string | null;
}

interface ExpenseListProps {
  expenses: Expense[];
  isLoading: boolean;
  onDeleteExpense: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onRefetch?: () => void;
}

const ACCEPTED_TYPES = ".pdf,.png,.jpg,.jpeg,.gif,.webp";
const MAX_SIZE_MB = 10;

export const ExpenseList = ({
  expenses,
  isLoading,
  onDeleteExpense,
  onBulkDelete,
  onRefetch,
}: ExpenseListProps) => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<string>("date-desc");
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptFileInputRef = useRef<HTMLInputElement>(null);

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: 0,
    category: "Supplies",
    course: "General",
    receipt: false,
    date: new Date().toISOString().split("T")[0],
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerRefresh } = useRefreshContext();

  // ── Sorting ──────────────────────────────────────────────────────────────
  const sortedExpenses = React.useMemo(() => {
    const sorted = [...expenses];
    switch (sortOrder) {
      case "date-desc": return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case "date-asc":  return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case "amount-desc": return sorted.sort((a, b) => b.amount - a.amount);
      case "amount-asc":  return sorted.sort((a, b) => a.amount - b.amount);
      case "category": return sorted.sort((a, b) => a.category.localeCompare(b.category));
      case "course":   return sorted.sort((a, b) => a.course.localeCompare(b.course));
      default: return sorted;
    }
  }, [expenses, sortOrder]);

  const handleSortClick = () => {
    const opts = ["date-desc", "date-asc", "amount-desc", "amount-asc", "category", "course"];
    setSortOrder(opts[(opts.indexOf(sortOrder) + 1) % opts.length]);
  };

  const getSortDisplayName = () => {
    const labels: Record<string, string> = {
      "date-desc": "Date ↓", "date-asc": "Date ↑",
      "amount-desc": "Amount ↓", "amount-asc": "Amount ↑",
      "category": "Category", "course": "Course",
    };
    return labels[sortOrder] ?? "Sort";
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const handleSelectAll = (checked: boolean) => {
    setSelectedExpenses(checked ? expenses.map((e) => e.id) : []);
  };

  const handleSelectExpense = (id: string, checked: boolean) => {
    setSelectedExpenses((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id));
  };

  // ── Delete (single) ───────────────────────────────────────────────────────
  const handleDeleteWithReceipt = async (expense: Expense) => {
    if (expense.receipt_url) {
      await supabase.storage.from("receipts").remove([expense.receipt_url]);
    }
    onDeleteExpense(expense.id);
  };

  // ── Delete (bulk) ─────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    if (selectedExpenses.length === 0 || !onBulkDelete) return;
    const paths = expenses
      .filter((e) => selectedExpenses.includes(e.id) && e.receipt_url)
      .map((e) => e.receipt_url as string);
    if (paths.length > 0) {
      await supabase.storage.from("receipts").remove(paths);
    }
    onBulkDelete(selectedExpenses);
    setSelectedExpenses([]);
  };

  // ── Add expense ───────────────────────────────────────────────────────────
  const handleAddExpense = async () => {
    if (!user) return;
    if (!newExpense.description.trim() || newExpense.amount <= 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("expenses").insert({
        description: newExpense.description.trim(),
        amount: newExpense.amount,
        category: newExpense.category.trim() || "Supplies",
        course: newExpense.course.trim() || "General",
        receipt: false,
        date: newExpense.date,
        user_id: user.id,
      });
      if (error) throw error;
      toast({ title: "Success", description: "Expense added successfully" });
      setNewExpense({ description: "", amount: 0, category: "Supplies", course: "General", receipt: false, date: new Date().toISOString().split("T")[0] });
      setIsAddDialogOpen(false);
      triggerRefresh("expenses");
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to add expense", variant: "destructive" });
    }
  };

  // ── Edit expense ──────────────────────────────────────────────────────────
  const handleUpdateExpense = async () => {
    if (!user || !selectedExpense) return;
    try {
      const { error } = await supabase
        .from("expenses")
        .update(newExpense as any)
        .eq("id", selectedExpense.id);
      if (error) throw error;
      toast({ title: "Success", description: "Expense updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedExpense(null);
      triggerRefresh("expenses");
    } catch (error) {
      toast({ title: "Error", description: "Failed to update expense", variant: "destructive" });
    }
  };

  // ── Receipt file picker ───────────────────────────────────────────────────
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Maximum file size is ${MAX_SIZE_MB} MB`, variant: "destructive" });
      return;
    }
    setReceiptFile(file);
  };

  // ── Receipt upload ─────────────────────────────────────────────────────────
  const handleUploadReceipt = async () => {
    if (!selectedExpense || !receiptFile || !user) return;
    setUploadingReceipt(true);
    try {
      const ext = receiptFile.name.split(".").pop()?.toLowerCase() || "bin";
      const filePath = `${user.id}/exp_${selectedExpense.id}_${Date.now()}.${ext}`;

      // Remove old receipt file if one exists
      if (selectedExpense.receipt_url) {
        await supabase.storage.from("receipts").remove([selectedExpense.receipt_url]);
      }

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile, { upsert: false });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("expenses")
        .update({ receipt: true, receipt_url: filePath })
        .eq("id", selectedExpense.id);
      if (updateError) throw updateError;

      toast({ title: "Success", description: "Receipt uploaded successfully" });
      setIsUploadDialogOpen(false);
      setSelectedExpense(null);
      setReceiptFile(null);
      if (receiptFileInputRef.current) receiptFileInputRef.current.value = "";
      triggerRefresh("expenses");
      onRefetch?.();
    } catch (error) {
      console.error("Receipt upload error:", error);
      toast({ title: "Error", description: "Failed to upload receipt", variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  // ── View receipt (signed URL) ─────────────────────────────────────────────
  const handleViewReceipt = async (expense: Expense) => {
    if (!expense.receipt_url) return;
    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(expense.receipt_url, 3600);
    if (error) {
      toast({ title: "Error", description: "Could not load receipt", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  // ── Remove receipt ────────────────────────────────────────────────────────
  const handleRemoveReceipt = async (expense: Expense) => {
    if (!expense.receipt_url) return;
    try {
      await supabase.storage.from("receipts").remove([expense.receipt_url]);
      const { error } = await supabase
        .from("expenses")
        .update({ receipt: false, receipt_url: null })
        .eq("id", expense.id);
      if (error) throw error;
      toast({ title: "Receipt removed" });
      triggerRefresh("expenses");
      onRefetch?.();
    } catch {
      toast({ title: "Error", description: "Failed to remove receipt", variant: "destructive" });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Expense Tracker ({expenses.length} items)</CardTitle>
          <div className="flex flex-wrap gap-2">
            {onRefetch && <ExpenseCsvManager expenses={expenses} onRefetch={onRefetch} />}
            {selectedExpenses.length > 0 && onBulkDelete && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedExpenses.length})
              </Button>
            )}
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleSortClick}>
              <ArrowUpDown className="h-3 w-3" />
              <span>{getSortDisplayName()}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-12"><p>Loading expense data...</p></div>
        ) : sortedExpenses.length > 0 ? (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {onBulkDelete && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedExpenses.length === expenses.length && expenses.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Course</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((expense) => {
                const isSelected = selectedExpenses.includes(expense.id);
                return (
                  <TableRow key={expense.id} className={isSelected ? "bg-muted/50" : ""}>
                    {onBulkDelete && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell text-sm">{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-xs text-muted-foreground sm:hidden">{new Date(expense.date).toLocaleDateString()} · {expense.category}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{expense.category}</TableCell>
                    <TableCell className="hidden md:table-cell">{expense.course}</TableCell>
                    <TableCell>${expense.amount.toFixed(2)}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {expense.receipt_url ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-primary hover:text-primary gap-1"
                          onClick={() => handleViewReceipt(expense)}
                          title="View receipt"
                        >
                          <Paperclip className="h-3 w-3" />
                          View
                        </Button>
                      ) : expense.receipt ? (
                        <CheckCircle className="h-4 w-4 text-secondary" title="Receipt marked (no file)" />
                      ) : (
                        <span className="text-xs text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedExpense(expense); setIsDetailDialogOpen(true); }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedExpense(expense);
                            setNewExpense({
                              description: expense.description,
                              amount: expense.amount,
                              category: expense.category,
                              course: expense.course,
                              receipt: !!expense.receipt,
                              date: new Date(expense.date).toISOString().split("T")[0],
                            });
                            setIsEditDialogOpen(true);
                          }}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedExpense(expense);
                            setReceiptFile(null);
                            setIsUploadDialogOpen(true);
                          }}>
                            {expense.receipt_url ? "Replace Receipt" : "Upload Receipt"}
                          </DropdownMenuItem>
                          {expense.receipt_url && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleRemoveReceipt(expense)}
                            >
                              Remove Receipt
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteWithReceipt(expense)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">No expenses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or add a new expense</p>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Add New Expense</span>
        </Button>
      </CardFooter>

      {/* ── Add Expense Dialog ─────────────────────────────────────────────── */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>Add a new expense to your tracker</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Enter expense description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" min="0" step="0.01" value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} placeholder="Supplies" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course">Course</Label>
                <Input id="course" value={newExpense.course}
                  onChange={(e) => setNewExpense({ ...newExpense, course: e.target.value })} placeholder="General" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={!newExpense.description || newExpense.amount <= 0}>
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── View Details Dialog ────────────────────────────────────────────── */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Expense Details</DialogTitle></DialogHeader>
          {selectedExpense && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{selectedExpense.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p>${selectedExpense.amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Course</p>
                  <p>{selectedExpense.course}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receipt</p>
                  {selectedExpense.receipt_url ? (
                    <Button size="sm" variant="link" className="p-0 h-auto gap-1" onClick={() => handleViewReceipt(selectedExpense)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      View receipt
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">{selectedExpense.receipt ? "Marked (no file)" : "Not attached"}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Expense Dialog ────────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update expense details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input id="edit-description" value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-amount">Amount ($)</Label>
                <Input id="edit-amount" type="number" min="0" step="0.01" value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" type="date" value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input id="edit-category" value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-course">Course</Label>
                <Input id="edit-course" value={newExpense.course}
                  onChange={(e) => setNewExpense({ ...newExpense, course: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateExpense} disabled={!newExpense.description || newExpense.amount <= 0}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Upload Receipt Dialog ──────────────────────────────────────────── */}
      <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
        if (!open) { setReceiptFile(null); if (receiptFileInputRef.current) receiptFileInputRef.current.value = ""; }
        setIsUploadDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedExpense?.receipt_url ? "Replace Receipt" : "Upload Receipt"}</DialogTitle>
            <DialogDescription>Attach a receipt file to this expense</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Existing receipt notice */}
            {selectedExpense?.receipt_url && !receiptFile && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40 text-sm">
                <Paperclip className="h-4 w-4 text-primary shrink-0" />
                <span className="flex-1 text-muted-foreground">A receipt is already attached.</span>
                <Button size="sm" variant="ghost" className="h-7 px-2"
                  onClick={() => selectedExpense && handleViewReceipt(selectedExpense)} title="View current receipt">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* File picker */}
            <div className="grid gap-2">
              <Label>Receipt File</Label>
              {receiptFile ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm flex-1 truncate">{receiptFile.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{(receiptFile.size / 1024).toFixed(0)} KB</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => { setReceiptFile(null); if (receiptFileInputRef.current) receiptFileInputRef.current.value = ""; }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to select receipt</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PDF, PNG, JPG, WEBP · up to {MAX_SIZE_MB} MB</p>
                  </div>
                  <input
                    ref={receiptFileInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_TYPES}
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUploadReceipt} disabled={!receiptFile || uploadingReceipt}>
              {uploadingReceipt ? "Uploading…" : selectedExpense?.receipt_url ? "Replace Receipt" : "Upload Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
