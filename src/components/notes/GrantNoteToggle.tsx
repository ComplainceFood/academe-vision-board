import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";
import { FundingSource } from "@/types/funding";

interface GrantNoteToggleProps {
  isGrantNote: boolean;
  onGrantNoteChange: (value: boolean) => void;
  fundingSourceId: string | null;
  onFundingSourceChange: (value: string | null) => void;
}

export function GrantNoteToggle({ 
  isGrantNote, 
  onGrantNoteChange, 
  fundingSourceId, 
  onFundingSourceChange 
}: GrantNoteToggleProps) {
  const { user } = useAuth();
  const { data: fundingSources } = useDataFetching<FundingSource>({
    table: 'funding_sources',
    filters: [{ column: 'status', value: 'active' }],
    enabled: !!user && isGrantNote,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="grant-note" className="text-sm font-medium">
          Grant Related
        </Label>
        <Switch
          id="grant-note"
          checked={isGrantNote}
          onCheckedChange={(checked) => {
            onGrantNoteChange(checked);
            if (!checked) onFundingSourceChange(null);
          }}
        />
      </div>
      {isGrantNote && (
        <Select
          value={fundingSourceId || ""}
          onValueChange={(val) => onFundingSourceChange(val || null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a grant..." />
          </SelectTrigger>
          <SelectContent>
            {fundingSources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
