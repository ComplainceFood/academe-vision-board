
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, PackageOpen, FileText } from "lucide-react";

interface SuppliesStatsProps {
  warningItems: number;
  totalSupplies: number;
  totalExpenses: number;
}

export const SuppliesStats = ({ warningItems, totalSupplies, totalExpenses }: SuppliesStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="glassmorphism">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold">{warningItems}</div>
              <p className="text-sm text-muted-foreground">Items below threshold</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glassmorphism">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-secondary/10 text-secondary">
              <PackageOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold">{totalSupplies}</div>
              <p className="text-sm text-muted-foreground">Different items tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="glassmorphism">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-3xl font-bold">${totalExpenses.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Semester to date</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
