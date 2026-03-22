import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Calendar, 
  FileText, 
  ShoppingCart, 
  Users,
  Zap,
  Database
} from "lucide-react";
import { useState } from "react";
import { CreateNoteDialog } from "@/components/notes/CreateNoteDialog";
import { AddItemDialog } from "@/components/supplies/AddItemDialog";
import { AddToShoppingListDialog } from "@/components/supplies/AddToShoppingListDialog";
import { AdminSeedDataManager } from "@/components/admin/AdminSeedDataManager";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  description: string;
  action: () => void;
}

export const QuickActions = () => {
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [supplyDialogOpen, setSupplyDialogOpen] = useState(false);
  const [shoppingDialogOpen, setShoppingDialogOpen] = useState(false);
  const { isSystemAdmin } = useUserRole();

  const quickActions: QuickAction[] = [
    {
      id: 'add-note',
      label: 'Add Note',
      icon: FileText,
      description: 'Create a new note or reminder',
      action: () => setNoteDialogOpen(true),
    },
    {
      id: 'add-supply',
      label: 'Add Supply',
      icon: Plus,
      description: 'Add a new supply item to inventory',
      action: () => setSupplyDialogOpen(true),
    },
    {
      id: 'shopping-list',
      label: 'Shopping List',
      icon: ShoppingCart,
      description: 'Add item to shopping list',
      action: () => setShoppingDialogOpen(true),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left space-y-2"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-2 w-full">
                    <IconComponent className="h-4 w-4" />
                    <span className="font-medium">{action.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </Button>
              );
            })}
            
            {/* Meeting Dialog as separate component since it doesn't accept props */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start text-left space-y-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Schedule Meeting</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Schedule a new meeting or appointment
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 overflow-hidden">
                <CreateMeetingDialog isOpen={true} onOpenChange={() => {}} />
              </DialogContent>
            </Dialog>
            
            {/* Admin-only seed data manager */}
            {isSystemAdmin() && (
              <div className="md:col-span-2">
                <AdminSeedDataManager />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateNoteDialog 
        open={noteDialogOpen} 
        onOpenChange={setNoteDialogOpen} 
      />
      <AddItemDialog 
        open={supplyDialogOpen} 
        onOpenChange={setSupplyDialogOpen} 
      />
      <AddToShoppingListDialog 
        open={shoppingDialogOpen} 
        onOpenChange={setShoppingDialogOpen}
        item={null}
      />
    </>
  );
};