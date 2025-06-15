import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus } from "lucide-react";
import { FundingExpenditure } from "@/types/funding";
import { ExpenditureDialog } from "./ExpenditureDialog";

interface ExpendituresListProps {
  expenditures: FundingExpenditure[];
  isLoading: boolean;
  onRefetch: () => void;
}

export const ExpendituresList = ({ expenditures, isLoading, onRefetch }: ExpendituresListProps) => {
  const [editingExpenditure, setEditingExpenditure] = useState<FundingExpenditure | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (expenditures.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-medium">No expenditures recorded</h3>
            <p className="text-muted-foreground">
              Start tracking your funding expenditures to monitor your spending.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Record Expenditure
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {expenditures.map((expenditure) => (
          <Card key={expenditure.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{expenditure.description}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {expenditure.funding_source?.name || 'Unknown Source'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-lg font-semibold">
                    {formatCurrency(expenditure.amount)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingExpenditure(expenditure);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <div className="font-medium">{expenditure.category}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <div className="font-medium">{formatDate(expenditure.expenditure_date)}</div>
                </div>
                {expenditure.receipt_number && (
                  <div>
                    <span className="text-muted-foreground">Receipt:</span>
                    <div className="font-medium">{expenditure.receipt_number}</div>
                  </div>
                )}
                {expenditure.approved_by && (
                  <div>
                    <span className="text-muted-foreground">Approved by:</span>
                    <div className="font-medium">{expenditure.approved_by}</div>
                  </div>
                )}
              </div>
              
              {expenditure.notes && (
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Notes:</span>
                  <p className="text-sm mt-1">{expenditure.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <ExpenditureDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          onRefetch();
          setIsAddDialogOpen(false);
        }}
      />

      <ExpenditureDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingExpenditure={editingExpenditure}
        onSuccess={() => {
          onRefetch();
          setIsEditDialogOpen(false);
          setEditingExpenditure(null);
        }}
      />
    </>
  );
};