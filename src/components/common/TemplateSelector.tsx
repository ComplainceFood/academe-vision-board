import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutTemplate, Trash2, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTemplates, Template } from "@/hooks/useTemplates";
import { useToast } from "@/hooks/use-toast";

interface TemplateSelectorProps {
  type: Template["type"];
  category?: string;
  currentData: Record<string, any>;
  onApplyTemplate: (data: Record<string, any>) => void;
}

export function TemplateSelector({
  type,
  category,
  currentData,
  onApplyTemplate,
}: TemplateSelectorProps) {
  const { templates, addTemplate, deleteTemplate, getTemplatesByType } = useTemplates();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const { toast } = useToast();

  const availableTemplates = getTemplatesByType(type).filter(
    t => !category || t.category === category
  );

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for the template.",
        variant: "destructive",
      });
      return;
    }

    addTemplate({
      name: templateName.trim(),
      type,
      category,
      data: currentData,
    });

    toast({
      title: "Template saved",
      description: `"${templateName}" has been saved as a template.`,
    });

    setTemplateName("");
    setIsSaveDialogOpen(false);
  };

  const handleApplyTemplate = (template: Template) => {
    onApplyTemplate(template.data);
    toast({
      title: "Template applied",
      description: `"${template.name}" template has been applied.`,
    });
  };

  const handleDeleteTemplate = (e: React.MouseEvent, templateId: string, templateName: string) => {
    e.stopPropagation();
    deleteTemplate(templateId);
    toast({
      title: "Template deleted",
      description: `"${templateName}" has been deleted.`,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {availableTemplates.length > 0 ? (
            <>
              {availableTemplates.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  className="flex justify-between items-center"
                  onClick={() => handleApplyTemplate(template)}
                >
                  <span className="truncate">{template.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-2 shrink-0 hover:bg-destructive/10"
                    onClick={(e) => handleDeleteTemplate(e, template.id, template.name)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No templates saved
            </div>
          )}
          <DropdownMenuItem onClick={() => setIsSaveDialogOpen(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save as Template
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save the current form values as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
