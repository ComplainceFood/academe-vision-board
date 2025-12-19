import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Link2, 
  Unlink, 
  RefreshCw, 
  Download, 
  ExternalLink, 
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Loader2,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrcidWork {
  title: string;
  journalTitle?: string;
  publicationDate?: string;
  doi?: string;
  url?: string;
  type?: string;
  selected?: boolean;
}

interface OrcidIntegrationProps {
  currentOrcidId?: string | null;
  onRefresh: () => void;
}

export function OrcidIntegration({ currentOrcidId, onRefresh }: OrcidIntegrationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orcidId, setOrcidId] = useState(currentOrcidId || "");
  const [isLinked, setIsLinked] = useState(!!currentOrcidId);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [works, setWorks] = useState<OrcidWork[]>([]);
  const [researcherName, setResearcherName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (currentOrcidId) {
      setOrcidId(currentOrcidId);
      setIsLinked(true);
    }
  }, [currentOrcidId]);

  const validateOrcid = (id: string) => {
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    return orcidRegex.test(id);
  };

  const handleLink = async () => {
    if (!orcidId || !validateOrcid(orcidId)) {
      toast({
        title: "Invalid ORCID",
        description: "Please enter a valid ORCID iD (e.g., 0000-0002-1825-0097)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify ORCID exists and update profile
      const { data, error } = await supabase.functions.invoke('fetch-orcid-works', {
        body: { orcidId, userId: user?.id },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setIsLinked(true);
      setResearcherName(data.researcherName);
      toast({
        title: "ORCID Linked Successfully",
        description: `Connected to ${data.researcherName || orcidId} with ${data.totalWorks} works found.`,
      });
      onRefresh();
    } catch (error: any) {
      console.error("Error linking ORCID:", error);
      toast({
        title: "Failed to Link ORCID",
        description: error.message || "Could not verify ORCID profile. Please check the ID and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ orcid_id: null })
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsLinked(false);
      setOrcidId("");
      toast({
        title: "ORCID Unlinked",
        description: "Your ORCID profile has been disconnected.",
      });
      onRefresh();
    } catch (error) {
      console.error("Error unlinking ORCID:", error);
      toast({
        title: "Error",
        description: "Failed to unlink ORCID profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorks = async () => {
    if (!orcidId) return;

    setIsFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-orcid-works', {
        body: { orcidId, userId: user?.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setWorks(data.works.map((w: OrcidWork) => ({ ...w, selected: true })));
      setResearcherName(data.researcherName);
      setShowImportDialog(true);
    } catch (error: any) {
      console.error("Error fetching ORCID works:", error);
      toast({
        title: "Failed to Fetch Works",
        description: error.message || "Could not retrieve publications from ORCID.",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const toggleWorkSelection = (index: number) => {
    setWorks(prev => prev.map((w, i) => 
      i === index ? { ...w, selected: !w.selected } : w
    ));
  };

  const selectAll = () => {
    setWorks(prev => prev.map(w => ({ ...w, selected: true })));
  };

  const deselectAll = () => {
    setWorks(prev => prev.map(w => ({ ...w, selected: false })));
  };

  const importSelectedWorks = async () => {
    const selectedWorks = works.filter(w => w.selected);
    if (selectedWorks.length === 0) {
      toast({
        title: "No Works Selected",
        description: "Please select at least one publication to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const achievements = selectedWorks.map(work => ({
        user_id: user?.id,
        category: 'publication',
        title: work.title,
        venue: work.journalTitle || null,
        date: work.publicationDate || null,
        url: work.url || null,
        status: 'published',
        visibility: 'public',
        tags: work.doi ? [`doi:${work.doi}`, 'orcid-import'] : ['orcid-import'],
      }));

      const { error } = await supabase
        .from('scholastic_achievements')
        .insert(achievements);

      if (error) throw error;

      toast({
        title: "Publications Imported!",
        description: `Successfully imported ${selectedWorks.length} publication${selectedWorks.length > 1 ? 's' : ''} from ORCID.`,
      });
      setShowImportDialog(false);
      onRefresh();
    } catch (error) {
      console.error("Error importing publications:", error);
      toast({
        title: "Import Failed",
        description: "Could not import publications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getWorkTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      'journal-article': 'Journal Article',
      'book-chapter': 'Book Chapter',
      'conference-paper': 'Conference Paper',
      'book': 'Book',
      'dissertation': 'Dissertation',
      'report': 'Report',
      'other': 'Other',
    };
    return types[type || 'other'] || type || 'Other';
  };

  return (
    <>
      <Card className="border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <svg viewBox="0 0 256 256" className="h-6 w-6" fill="currentColor">
                  <path d="M128,0C57.3,0,0,57.3,0,128s57.3,128,128,128s128-57.3,128-128S198.7,0,128,0z M86.3,186.2H70.9V79.1h15.4V186.2z M78.6,70.8c-5.4,0-9.8-4.4-9.8-9.8c0-5.4,4.4-9.8,9.8-9.8c5.4,0,9.8,4.4,9.8,9.8C88.4,66.4,84,70.8,78.6,70.8z M184.4,186.2h-15.4v-54.5c0-14.2-5.4-20.4-15.1-20.4c-12.3,0-18.9,8.6-18.9,22.3v52.6h-15.4V79.1h14.9v14.4c4.6-9.8,13.9-16.2,26-16.2c18.5,0,28.8,11.5,28.8,34.3V186.2z"/>
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  ORCID Integration
                  {isLinked && (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Link your ORCID iD to automatically import your publications
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLinked ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter your ORCID iD (e.g., 0000-0002-1825-0097)"
                  value={orcidId}
                  onChange={(e) => setOrcidId(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button onClick={handleLink} disabled={isLoading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Link ORCID
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">ORCID iD:</span>
                  <a 
                    href={`https://orcid.org/${orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    {orcidId}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {researcherName && (
                  <Badge variant="outline">{researcherName}</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={fetchWorks} 
                  disabled={isFetching}
                  className="gap-2"
                >
                  {isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Import Publications
                </Button>
                <Button variant="ghost" size="icon" onClick={handleUnlink} disabled={isLoading}>
                  <Unlink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            ORCID provides a persistent identifier for researchers. Link your profile to automatically import your publication list.{" "}
            <a href="https://orcid.org/register" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
              Don't have an ORCID? Register here →
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Import Publications from ORCID
            </DialogTitle>
            <DialogDescription>
              Found {works.length} publication{works.length !== 1 ? 's' : ''} from your ORCID profile. Select which ones to import.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">
              {works.filter(w => w.selected).length} of {works.length} selected
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect All</Button>
            </div>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {works.map((work, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    work.selected 
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' 
                      : 'bg-muted/30 border-muted hover:bg-muted/50'
                  }`}
                  onClick={() => toggleWorkSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      checked={work.selected} 
                      onCheckedChange={() => toggleWorkSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight">{work.title}</h4>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {getWorkTypeLabel(work.type)}
                        </Badge>
                      </div>
                      {work.journalTitle && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{work.journalTitle}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {work.publicationDate && (
                          <span>{new Date(work.publicationDate).getFullYear()}</span>
                        )}
                        {work.doi && (
                          <span className="font-mono">DOI: {work.doi}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {works.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No publications found in your ORCID profile.</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={importSelectedWorks} 
              disabled={isImporting || works.filter(w => w.selected).length === 0}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Import {works.filter(w => w.selected).length} Publication{works.filter(w => w.selected).length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
