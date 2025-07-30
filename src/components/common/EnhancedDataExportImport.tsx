import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Download, Upload, FileText, Calendar, Users, ShoppingCart, DollarSign, Info, CheckCircle } from "lucide-react";
import * as XLSX from 'xlsx';

interface ExportImportProps {
  onDataRefresh?: () => void;
}

type ExportFormat = 'json' | 'csv' | 'xlsx';

export const EnhancedDataExportImport = ({ onDataRefresh }: ExportImportProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const { toast } = useToast();
  const { user } = useAuth();

  const availableTables = [
    { id: 'notes', name: 'Notes & Commitments', icon: FileText, description: 'All your notes and annotations' },
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

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
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

    try {
      setIsExporting(true);
      setExportProgress(0);

      const totalTables = selectedTables.length;
      let completedTables = 0;
      const exportedData: { [key: string]: any[] } = {};

      for (const tableId of selectedTables) {
        const table = availableTables.find(t => t.id === tableId);
        if (!table) continue;

        try {
          const { data, error } = await supabase
            .from(tableId as any)
            .select('*')
            .eq('user_id', user!.id);

          if (error) {
            console.error(`Error fetching ${tableId}:`, error);
            toast({
              title: `Error fetching ${table.name}`,
              description: error.message,
              variant: "destructive",
            });
            continue;
          }

          // Sanitize data for export
          const sanitizedData = data?.map(record => {
            if (!record || typeof record !== 'object') return record;
            const sanitized = { ...(record as Record<string, any>) };
            
            // Remove sensitive fields
            delete sanitized.user_id;
            
            // Clean up text fields
            Object.keys(sanitized).forEach(key => {
              if (typeof sanitized[key] === 'string') {
                sanitized[key] = sanitized[key]
                  .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
                  .trim();
              }
            });
            
            return sanitized;
          }) || [];

          exportedData[tableId] = sanitizedData;
          
        } catch (error: any) {
          console.error(`Error processing ${tableId}:`, error);
        }

        completedTables++;
        setExportProgress((completedTables / totalTables) * 100);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      if (exportFormat === 'json') {
        // JSON Export (existing functionality)
        const exportObject = {
          exported_at: new Date().toISOString(),
          platform: "Academic Management Platform",
          version: "1.0",
          total_records: Object.values(exportedData).reduce((sum, records) => sum + records.length, 0),
          tables: exportedData
        };

        const dataStr = JSON.stringify(exportObject, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const filename = `academic-data-export-${timestamp}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', filename);
        linkElement.click();
        
      } else if (exportFormat === 'csv') {
        // CSV Export - create separate CSV files for each table
        for (const [tableId, records] of Object.entries(exportedData)) {
          if (records.length === 0) continue;
          
          const table = availableTables.find(t => t.id === tableId);
          const csvContent = convertToCSV(records);
          const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
          const filename = `${table?.name.replace(/\s+/g, '-').toLowerCase()}-${timestamp}.csv`;
          
          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', filename);
          linkElement.click();
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } else if (exportFormat === 'xlsx') {
        // Excel Export - create workbook with multiple sheets
        const workbook = XLSX.utils.book_new();
        
        for (const [tableId, records] of Object.entries(exportedData)) {
          if (records.length === 0) continue;
          
          const table = availableTables.find(t => t.id === tableId);
          const worksheet = XLSX.utils.json_to_sheet(records);
          const sheetName = table?.name.slice(0, 31) || tableId; // Excel sheet name limit
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
        
        const filename = `academic-data-export-${timestamp}.xlsx`;
        XLSX.writeFile(workbook, filename);
      }

      const totalRecords = Object.values(exportedData).reduce((sum, records) => sum + records.length, 0);
      toast({
        title: "Export completed",
        description: `Successfully exported ${Object.keys(exportedData).length} tables with ${totalRecords} total records as ${exportFormat.toUpperCase()}`,
      });

    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: error.message || "An unexpected error occurred during export",
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
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid JSON backup file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.tables || typeof importData.tables !== 'object') {
        throw new Error('Invalid backup file format - missing tables');
      }

      const tablesToImport = Object.keys(importData.tables);
      const totalTables = tablesToImport.length;
      let importedCount = 0;

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

        // Add user_id to each record
        const processedData = tableData.map((item: any) => ({
          ...item,
          user_id: user?.id,
          id: undefined // Let database generate new IDs
        }));

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
        title: "Import completed",
        description: `Successfully imported data from ${importedCount} tables`,
      });

      onDataRefresh?.();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Failed to import data. Please check the file format.",
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
          Enhanced Data Export & Import
        </CardTitle>
        <CardDescription>
          Export your data in multiple formats (JSON, CSV, Excel) or import from JSON backups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Export your data for backup, analysis, or migration. JSON format preserves all data structure for imports.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Data</CardTitle>
              <CardDescription>
                Export your personal data in multiple formats for backup, analysis, or migration purposes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Export Format</label>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON - Complete data with metadata</SelectItem>
                    <SelectItem value="csv">CSV - Separate files for each table</SelectItem>
                    <SelectItem value="xlsx">Excel - Single file with multiple sheets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? `Exporting... ${Math.round(exportProgress)}%` : 'Select Tables to Export'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Select Tables to Export</DialogTitle>
                    <DialogDescription>
                      Choose which data tables to include in your export file.
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
                      <Badge variant="secondary">
                        {selectedTables.length} of {availableTables.length} selected
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
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
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={selectedTables.includes(table.id)}
                                onChange={() => {}}
                              />
                              <table.icon className="h-4 w-4" />
                              <div>
                                <p className="font-medium text-sm">{table.name}</p>
                                <p className="text-xs text-muted-foreground">{table.description}</p>
                              </div>
                            </div>
                            {selectedTables.includes(table.id) && (
                              <CheckCircle className="h-4 w-4 text-primary" />
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

                    <Button 
                      onClick={exportData} 
                      disabled={isExporting || selectedTables.length === 0}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as {exportFormat.toUpperCase()}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Import Data</CardTitle>
              <CardDescription>
                Import data from a JSON backup file to restore your information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                className="w-full"
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={isImporting}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isImporting ? `Importing... ${Math.round(importProgress)}%` : 'Select JSON File to Import'}
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

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Only JSON files exported from this platform are supported. Import will add data to existing records.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};