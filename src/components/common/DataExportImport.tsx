import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Upload, FileText, Calendar, Users, ShoppingCart, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { sanitizeFilename, validateJsonInput, sanitizeTextInput, validateNumericInput } from "@/utils/inputValidation";

interface ExportImportProps {
  onDataRefresh?: () => void;
}

type ExportFormat = 'json' | 'csv' | 'xlsx';

export const DataExportImport = ({ onDataRefresh }: ExportImportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const { toast } = useToast();
  const { user } = useAuth();

  const availableTables = [
    { id: 'notes', name: 'Notes', icon: FileText, description: 'All your notes and annotations' },
    { id: 'meetings', name: 'Meetings', icon: Users, description: 'Meeting records and schedules' },
    { id: 'planning_events', name: 'Calendar Events', icon: Calendar, description: 'Calendar events and planning' },
    { id: 'supplies', name: 'Supplies', icon: ShoppingCart, description: 'Supply inventory and records' },
    { id: 'expenses', name: 'Expenses', icon: DollarSign, description: 'Expense tracking data' },
    { id: 'funding_sources', name: 'Funding Sources', icon: DollarSign, description: 'Funding sources and grants' },
    { id: 'funding_expenditures', name: 'Expenditures', icon: DollarSign, description: 'Funding expenditure records' },
    { id: 'shopping_list', name: 'Shopping Lists', icon: ShoppingCart, description: 'Shopping list items' },
    { id: 'future_planning', name: 'Future Planning', icon: Calendar, description: 'Future planning tasks' },
  ];

  const handleTableSelection = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAllTables = () => {
    setSelectedTables(availableTables.map(table => table.id));
  };

  const clearSelection = () => {
    setSelectedTables([]);
  };

  const exportData = async () => {
    if (selectedTables.length === 0) {
      toast({
        title: "No tables selected",
        description: "Please select at least one table to export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const exportData: any = {
        exportDate: new Date().toISOString(),
        exportedBy: user?.email,
        tables: {},
      };

      const totalTables = selectedTables.length;
      
      for (let i = 0; i < selectedTables.length; i++) {
        const tableId = selectedTables[i];
        setExportProgress(((i + 1) / totalTables) * 100);

        const { data, error } = await supabase
          .from(tableId as any)
          .select('*')
          .eq('user_id', user?.id);

        if (error) {
          console.error(`Error exporting ${tableId}:`, error);
          continue;
        }

        exportData.tables[tableId] = data;
      }

      // Sanitize export data before creating file
      const sanitizedExportData = {
        ...exportData,
        exportDate: new Date().toISOString(),
        exportedBy: sanitizeTextInput(exportData.exportedBy || '', 255),
        version: '1.0',
        tables: Object.fromEntries(
          Object.entries(exportData.tables).map(([tableId, data]) => [
            tableId,
            Array.isArray(data) ? data.map((item: any) => {
              // Remove sensitive system fields and sanitize content
              const cleanItem = { ...item };
              delete cleanItem.password;
              delete cleanItem.token;
              delete cleanItem.secret;
              
              // Sanitize text fields
              Object.keys(cleanItem).forEach(key => {
                if (typeof cleanItem[key] === 'string') {
                  cleanItem[key] = sanitizeTextInput(cleanItem[key], 5000);
                }
              });
              
              return cleanItem;
            }) : data
          ])
        )
      };

      // Create secure filename
      const timestamp = new Date().toISOString().split('T')[0];
      const secureFilename = sanitizeFilename(`academia-vision-backup-${timestamp}.json`);

      // Create and download the file
      const blob = new Blob([JSON.stringify(sanitizedExportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = secureFilename;
      link.setAttribute('download', secureFilename); // Prevent manipulation
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete! 🎉",
        description: `Successfully exported ${selectedTables.length} tables to JSON file`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced security validations
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    if (file.size > maxFileSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file extension and MIME type
    if (!file.name.endsWith('.json') || file.type !== 'application/json') {
      toast({
        title: "Invalid file type",
        description: "Please select a valid JSON backup file",
        variant: "destructive",
      });
      return;
    }

    // Sanitize filename
    const sanitizedFilename = sanitizeFilename(file.name);
    if (sanitizedFilename !== file.name) {
      toast({
        title: "Security Warning",
        description: "File name contains potentially unsafe characters",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      
      // Validate JSON structure securely
      const importData = validateJsonInput(text);
      if (!importData) {
        throw new Error('Invalid or unsafe JSON format');
      }

      if (!importData.tables || typeof importData.tables !== 'object') {
        throw new Error('Invalid backup file format - missing tables');
      }

      // Validate import data structure
      if (importData.exportedBy && typeof importData.exportedBy !== 'string') {
        throw new Error('Invalid backup file format - corrupted metadata');
      }

      const tablesToImport = Object.keys(importData.tables);
      const totalTables = tablesToImport.length;
      let importedCount = 0;

      // Limit number of tables to prevent resource exhaustion
      if (totalTables > 20) {
        throw new Error('Backup file contains too many tables. Maximum 20 allowed.');
      }

      for (let i = 0; i < tablesToImport.length; i++) {
        const tableId = tablesToImport[i];
        
        // Validate table name against known tables
        if (!availableTables.some(table => table.id === tableId)) {
          console.warn(`Skipping unknown table: ${tableId}`);
          continue;
        }
        
        const tableData = importData.tables[tableId];
        setImportProgress(((i + 1) / totalTables) * 100);

        if (!Array.isArray(tableData) || tableData.length === 0) continue;

        // Limit number of records per table
        if (tableData.length > 1000) {
          console.warn(`Table ${tableId} has too many records. Limiting to 1000.`);
          tableData.splice(1000);
        }

        // Sanitize and validate each record
        const processedData = tableData.map(item => {
          if (typeof item !== 'object' || item === null) {
            return null;
          }

          // Sanitize text fields
          const sanitizedItem: any = { user_id: user?.id };
          
          Object.entries(item).forEach(([key, value]) => {
            if (key === 'id') return; // Skip ID to let database generate new ones
            if (key === 'user_id') return; // Always use current user's ID
            
            if (typeof value === 'string') {
              sanitizedItem[key] = sanitizeTextInput(value, 5000);
            } else if (typeof value === 'number') {
              const numValue = validateNumericInput(value);
              if (numValue !== null) {
                sanitizedItem[key] = numValue;
              }
            } else if (typeof value === 'boolean') {
              sanitizedItem[key] = Boolean(value);
            } else if (Array.isArray(value)) {
              // Sanitize array elements
              sanitizedItem[key] = value
                .slice(0, 100) // Limit array size
                .map(v => typeof v === 'string' ? sanitizeTextInput(v, 1000) : v);
            } else if (value instanceof Date || typeof value === 'string') {
              // Handle dates
              sanitizedItem[key] = value;
            }
          });

          return sanitizedItem;
        }).filter(item => item !== null);

        if (processedData.length === 0) continue;

        const { error } = await supabase
          .from(tableId as any)
          .insert(processedData);

        if (error) {
          console.error(`Error importing ${tableId}:`, error);
          continue;
        }

        importedCount++;
      }

      toast({
        title: "Import Complete! 🎉",
        description: `Successfully imported data from ${importedCount} tables`,
      });

      onDataRefresh?.();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export & Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Create backups of your data or restore from previous backups. 
            All exports include only your personal data.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export Section */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full" disabled={isExporting}>
                <Download className="h-4 w-4" />
                {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Export Data'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Export Your Data</DialogTitle>
                <DialogDescription>
                  Select which tables you want to include in your backup file.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllTables}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear All
                  </Button>
                  <span className="text-sm text-muted-foreground flex items-center">
                    {selectedTables.length} of {availableTables.length} selected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {availableTables.map((table) => (
                    <div
                      key={table.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTables.includes(table.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleTableSelection(table.id)}
                    >
                      <div className="flex items-center gap-2">
                        <table.icon className="h-4 w-4" />
                        <div>
                          <p className="font-medium text-sm">{table.name}</p>
                          <p className="text-xs text-muted-foreground">{table.description}</p>
                        </div>
                        {selectedTables.includes(table.id) && (
                          <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Exporting data...</span>
                      <span>{Math.round(exportProgress)}%</span>
                    </div>
                    <Progress value={exportProgress} />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={exportData} disabled={isExporting || selectedTables.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Selected Tables
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Import Section */}
          <div className="space-y-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              id="import-file"
              disabled={isImporting}
            />
            <Button
              variant="outline"
              className="flex items-center gap-2 w-full"
              onClick={() => document.getElementById('import-file')?.click()}
              disabled={isImporting}
            >
              <Upload className="h-4 w-4" />
              {isImporting ? `Importing... ${Math.round(importProgress)}%` : 'Import Data'}
            </Button>
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing data...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Note:</strong> Export creates a JSON file with all your selected data. 
          Import will add data to existing records (duplicates may occur). 
          Always backup before importing.
        </div>
      </CardContent>
    </Card>
  );
};