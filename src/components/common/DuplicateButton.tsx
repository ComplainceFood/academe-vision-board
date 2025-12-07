import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DuplicateButtonProps {
  onDuplicate: () => Promise<void>;
  itemName?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function DuplicateButton({
  onDuplicate,
  itemName = "item",
  variant = "ghost",
  size = "icon",
  className = "",
}: DuplicateButtonProps) {
  const { toast } = useToast();

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onDuplicate();
      toast({
        title: "Duplicated",
        description: `${itemName} has been duplicated.`,
      });
    } catch (error) {
      console.error("Duplicate error:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDuplicate}
      title="Duplicate"
    >
      <Copy className="h-4 w-4" />
      {size !== "icon" && <span className="ml-2">Duplicate</span>}
    </Button>
  );
}
