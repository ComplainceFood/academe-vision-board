import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  course: string;
  receipt?: boolean;
}

interface ExpenseCsvManagerProps {
  expenses: Expense[];
  onRefetch: () => void;
}

interface ImportPreviewItem {
  date: string;
  description: string;
  amount: number;
  category: string;
  course: string;
  receipt: boolean;
  isValid: boolean;
  errors: string[];
}

export const ExpenseCsvManager = ({ expenses, onRefetch }: ExpenseCsvManagerProps) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Export expenses to CSV
  const handleExport = () => {
    if (expenses.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some expenses first",
        variant: "destructive"
      });
      return;
    }

    // CSV headers
    const headers = ["Date", "Description", "Amount", "Category", "Course", "Has Receipt"];

    // Convert data to CSV rows
    const rows = expenses.map((expense) => [
    new Date(expense.date).toLocaleDateString(),
    `"${expense.description.replace(/"/g, '""')}"`,
    expense.amount.toFixed(2),
    `"${expense.category.replace(/"/g, '""')}"`,
    `"${expense.course.replace(/"/g, '""')}"`,
    expense.receipt ? "Yes" : "No"]
    );

    // Combine headers and rows
    const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))].
    join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${expenses.length} expenses to CSV`
    });
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = ["Date", "Description", "Amount", "Category", "Course", "Has Receipt"];
    const exampleRow = ["2025-01-15", "Lab Equipment Rental", "250.00", "Equipment", "Chemistry 101", "Yes"];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "expenses_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template downloaded",
      description: "Fill in the template and import it"
    });
  };

  // Parse date string to ISO format
  const parseDate = (dateStr: string): string | null => {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  // Parse CSV file
  const parseCSV = (text: string): ImportPreviewItem[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Skip header row
    const dataRows = lines.slice(1);

    return dataRows.map((line) => {
      // Handle quoted values with commas
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const errors: string[] = [];
      const dateStr = values[0]?.replace(/^"|"$/g, '') || "";
      const description = values[1]?.replace(/^"|"$/g, '') || "";
      const amountStr = values[2]?.replace(/^"|"$/g, '') || "";
      const category = values[3]?.replace(/^"|"$/g, '') || "";
      const course = values[4]?.replace(/^"|"$/g, '') || "";
      const receiptStr = values[5]?.replace(/^"|"$/g, '').toLowerCase() || "";

      const parsedDate = parseDate(dateStr);
      const amount = parseFloat(amountStr);
      const receipt = receiptStr === 'yes' || receiptStr === 'true' || receiptStr === '1';

      // Validate
      if (!parsedDate) errors.push("Invalid date format");
      if (!description) errors.push("Description is required");
      if (isNaN(amount) || amount <= 0) errors.push("Amount must be a positive number");
      if (!category) errors.push("Category is required");
      if (!course) errors.push("Course is required");

      return {
        date: parsedDate || dateStr,
        description,
        amount: isNaN(amount) ? 0 : amount,
        category,
        course,
        receipt,
        isValid: errors.length === 0,
        errors
      };
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setImportPreview(parsed);
      setIsImportDialogOpen(true);
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Import validated items
  const handleImport = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to import expenses",
        variant: "destructive"
      });
      return;
    }

    const validItems = importPreview.filter((item) => item.isValid);
    if (validItems.length === 0) {
      toast({
        title: "No valid items",
        description: "Please fix the errors before importing",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const itemsToInsert = validItems.map((item) => ({
        user_id: user.id,
        date: item.date,
        description: item.description,
        amount: item.amount,
        category: item.category,
        course: item.course,
        receipt: item.receipt
      }));

      const { error } = await supabase.from('expenses').insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${validItems.length} expenses`
      });

      setIsImportDialogOpen(false);
      setImportPreview([]);
      onRefetch();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "Failed to import expenses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = importPreview.filter((item) => item.isValid).length;
  const invalidCount = importPreview.filter((item) => !item.isValid).length;
  const totalAmount = importPreview.filter((item) => item.isValid).reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2 bg-accent">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-accent">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden" />

      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Expenses Preview
            </DialogTitle>
            <DialogDescription>
              Review the expenses before importing. Invalid rows will be skipped.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 mb-4">
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {validCount} valid
            </Badge>
            {invalidCount > 0 &&
            <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {invalidCount} invalid
              </Badge>
            }
            {validCount > 0 &&
            <Badge variant="secondary">
                Total: ${totalAmount.toFixed(2)}
              </Badge>
            }
          </div>

          {importPreview.length > 0 ?
          <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreview.map((item, index) =>
                <TableRow key={index} className={!item.isValid ? "bg-destructive/10" : ""}>
                      <TableCell>
                        {item.isValid ?
                    <CheckCircle2 className="h-4 w-4 text-green-500" /> :

                    <AlertCircle className="h-4 w-4 text-destructive" />
                    }
                      </TableCell>
                      <TableCell>
                        <div>{item.date ? new Date(item.date).toLocaleDateString() : <span className="text-muted-foreground italic">Invalid</span>}</div>
                        {item.errors.length > 0 &&
                    <div className="text-xs text-destructive mt-1">
                            {item.errors.join(", ")}
                          </div>
                    }
                      </TableCell>
                      <TableCell>{item.description || "-"}</TableCell>
                      <TableCell>${item.amount.toFixed(2)}</TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>{item.course || "-"}</TableCell>
                      <TableCell>{item.receipt ? "Yes" : "No"}</TableCell>
                    </TableRow>
                )}
                </TableBody>
              </Table>
            </ScrollArea> :

          <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No valid data found in the CSV file. Make sure your file has the correct format.
              </AlertDescription>
            </Alert>
          }

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Need a template?</span>
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleDownloadTemplate}>
              Download CSV template
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={validCount === 0 || isImporting}>

              {isImporting ? "Importing..." : `Import ${validCount} Expenses ($${totalAmount.toFixed(2)})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

};