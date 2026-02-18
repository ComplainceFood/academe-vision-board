import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SupplyItem } from "@/types/shoppingList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InventoryCsvManagerProps {
  supplies: SupplyItem[];
  onRefetch: () => void;
}

interface ImportPreviewItem {
  name: string;
  category: string;
  course: string;
  current_count: number;
  total_count: number;
  threshold: number;
  cost: number | null;
  isValid: boolean;
  errors: string[];
}

export const InventoryCsvManager = ({ supplies, onRefetch }: InventoryCsvManagerProps) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Export inventory to CSV
  const handleExport = () => {
    if (supplies.length === 0) {
      toast({
        title: "No data to export",
        description: "Add some inventory items first",
        variant: "destructive"
      });
      return;
    }

    // CSV headers
    const headers = ["Name", "Category", "Course", "Current Count", "Total Count", "Threshold", "Cost", "Last Restocked"];

    // Convert data to CSV rows
    const rows = supplies.map((item) => [
    `"${item.name.replace(/"/g, '""')}"`,
    `"${item.category.replace(/"/g, '""')}"`,
    `"${item.course.replace(/"/g, '""')}"`,
    item.current_count,
    item.total_count,
    item.threshold,
    item.cost || "",
    item.last_restocked ? new Date(item.last_restocked).toLocaleDateString() : ""]
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
    link.setAttribute("download", `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${supplies.length} items to CSV`
    });
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = ["Name", "Category", "Course", "Current Count", "Total Count", "Threshold", "Cost"];
    const exampleRow = ["Beakers 250ml", "Glassware", "Chemistry 101", "45", "100", "20", "5.99"];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template downloaded",
      description: "Fill in the template and import it"
    });
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
      const name = values[0]?.replace(/^"|"$/g, '') || "";
      const category = values[1]?.replace(/^"|"$/g, '') || "";
      const course = values[2]?.replace(/^"|"$/g, '') || "";
      const current_count = parseInt(values[3]) || 0;
      const total_count = parseInt(values[4]) || 0;
      const threshold = parseInt(values[5]) || 0;
      const costValue = values[6]?.trim();
      const cost = costValue ? parseFloat(costValue) : null;

      // Validate
      if (!name) errors.push("Name is required");
      if (!category) errors.push("Category is required");
      if (!course) errors.push("Course is required");
      if (current_count < 0) errors.push("Current count cannot be negative");
      if (total_count <= 0) errors.push("Total count must be positive");
      if (current_count > total_count) errors.push("Current count exceeds total");
      if (threshold < 0) errors.push("Threshold cannot be negative");

      return {
        name,
        category,
        course,
        current_count,
        total_count,
        threshold,
        cost: cost && !isNaN(cost) ? cost : null,
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
        description: "Please sign in to import items",
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
        name: item.name,
        category: item.category,
        course: item.course,
        current_count: item.current_count,
        total_count: item.total_count,
        threshold: item.threshold,
        cost: item.cost,
        last_restocked: new Date().toISOString()
      }));

      const { error } = await supabase.from('supplies').insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Imported ${validItems.length} items to inventory`
      });

      setIsImportDialogOpen(false);
      setImportPreview([]);
      onRefetch();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: "Failed to import items. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = importPreview.filter((item) => item.isValid).length;
  const invalidCount = importPreview.filter((item) => !item.isValid).length;

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
              Import Preview
            </DialogTitle>
            <DialogDescription>
              Review the items before importing. Invalid rows will be skipped.
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
          </div>

          {importPreview.length > 0 ?
          <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Cost</TableHead>
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
                        <div>{item.name || <span className="text-muted-foreground italic">Missing</span>}</div>
                        {item.errors.length > 0 &&
                    <div className="text-xs text-destructive mt-1">
                            {item.errors.join(", ")}
                          </div>
                    }
                      </TableCell>
                      <TableCell>{item.category || "-"}</TableCell>
                      <TableCell>{item.course || "-"}</TableCell>
                      <TableCell>{item.current_count}/{item.total_count}</TableCell>
                      <TableCell>{item.threshold}</TableCell>
                      <TableCell>{item.cost ? `$${item.cost.toFixed(2)}` : "-"}</TableCell>
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

              {isImporting ? "Importing..." : `Import ${validCount} Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>);

};