import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingItem } from "@/types/shoppingList";
import * as XLSX from 'xlsx';

interface ShoppingListCsvManagerProps {
  items: ShoppingItem[];
  onRefetch: () => void;
}

interface ParsedShoppingItem {
  name: string;
  quantity: number;
  priority: "low" | "medium" | "high";
  notes: string;
  isValid: boolean;
  errors: string[];
}

export const ShoppingListCsvManager = ({ items, onRefetch }: ShoppingListCsvManagerProps) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedShoppingItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast({
        title: "No items to export",
        description: "Add some items to your shopping list first",
        variant: "destructive"
      });
      return;
    }

    const exportData = items.map(item => ({
      Name: item.name,
      Quantity: item.quantity,
      Priority: item.priority,
      Purchased: item.purchased ? "Yes" : "No",
      Notes: item.notes || ""
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shopping List");
    
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `shopping_list_${date}.xlsx`);
    
    toast({
      title: "Export successful",
      description: `Exported ${items.length} items to Excel`
    });
  };

  const handleDownloadTemplate = () => {
    const template = [
      { Name: "Beakers (500ml)", Quantity: 10, Priority: "high", Notes: "For Chemistry lab" },
      { Name: "Safety Goggles", Quantity: 25, Priority: "medium", Notes: "" },
      { Name: "Lab Notebooks", Quantity: 50, Priority: "low", Notes: "For new semester" }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shopping List Template");
    XLSX.writeFile(wb, "shopping_list_template.xlsx");
    
    toast({
      title: "Template downloaded",
      description: "Fill in the template and import it back"
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsed: ParsedShoppingItem[] = jsonData.map((row: any) => {
          const errors: string[] = [];
          
          const name = String(row.Name || row.name || "").trim();
          if (!name) errors.push("Name is required");
          
          const quantity = parseInt(row.Quantity || row.quantity || "1");
          if (isNaN(quantity) || quantity < 1) errors.push("Invalid quantity");
          
          let priority = String(row.Priority || row.priority || "medium").toLowerCase() as "low" | "medium" | "high";
          if (!["low", "medium", "high"].includes(priority)) {
            priority = "medium";
          }
          
          const notes = String(row.Notes || row.notes || "").trim();

          return {
            name,
            quantity: isNaN(quantity) ? 1 : quantity,
            priority,
            notes,
            isValid: errors.length === 0,
            errors
          };
        });

        setParsedItems(parsed);
        setIsImportDialogOpen(true);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast({
          title: "Error parsing file",
          description: "Please make sure the file is a valid Excel or CSV file",
          variant: "destructive"
        });
      }
    };
    reader.readAsArrayBuffer(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    if (!user) return;
    
    const validItems = parsedItems.filter(item => item.isValid);
    if (validItems.length === 0) {
      toast({
        title: "No valid items",
        description: "Please fix the errors and try again",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const itemsToInsert = validItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        priority: item.priority,
        notes: item.notes || null,
        purchased: false,
        user_id: user.id
      }));

      const { error } = await supabase
        .from('shopping_list')
        .insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Added ${validItems.length} items to shopping list`
      });
      
      setIsImportDialogOpen(false);
      setParsedItems([]);
      onRefetch();
    } catch (error) {
      console.error("Error importing items:", error);
      toast({
        title: "Import failed",
        description: "Failed to import items to shopping list",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = parsedItems.filter(i => i.isValid).length;
  const invalidCount = parsedItems.filter(i => !i.isValid).length;

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Shopping List Items
            </DialogTitle>
            <DialogDescription>
              Review the items before importing. {validCount} valid, {invalidCount} with errors.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {parsedItems.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedItems.map((item, index) => (
                  <TableRow key={index} className={!item.isValid ? "bg-destructive/10" : ""}>
                    <TableCell>
                      {item.isValid ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">Valid</Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.name || <span className="text-muted-foreground italic">Missing</span>}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Badge variant={
                        item.priority === "high" ? "destructive" : 
                        item.priority === "medium" ? "default" : "secondary"
                      }>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isImporting || validCount === 0}>
              {isImporting ? "Importing..." : `Import ${validCount} Items`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
