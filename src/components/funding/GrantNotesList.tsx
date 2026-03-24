import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookText, FileText, StickyNote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotes } from "@/hooks/useNotes";
import { FundingSource } from "@/types/funding";

interface GrantNotesListProps {
  sources: FundingSource[];
  isLoading: boolean;
}

export function GrantNotesList({ sources, isLoading }: GrantNotesListProps) {
  const { user } = useAuth();
  const { notes } = useNotes();

  const grantNotes = notes.filter(n => n.funding_source_id && !n.is_folder);

  const getSourceName = (id: string) => {
    return sources.find(s => s.id === id)?.name || 'Unknown Grant';
  };

  const notesByGrant = grantNotes.reduce((acc, note) => {
    const key = note.funding_source_id!;
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {} as Record<string, typeof grantNotes>);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading grant notes...</div>;
  }

  if (grantNotes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No grant-related notes yet</h3>
            <p className="text-muted-foreground">
              Toggle "Grant Related" when creating notes to associate them with grants.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(notesByGrant).map(([sourceId, notesForGrant]) => (
        <Card key={sourceId}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookText className="h-5 w-5 text-primary" />
              {getSourceName(sourceId)}
            </CardTitle>
            <CardDescription>{notesForGrant.length} note{notesForGrant.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notesForGrant.map((note) => (
                <div key={note.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{note.title}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {note.type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          note.status === 'completed' ? 'text-green-600 border-green-200' :
                          note.status === 'archived' ? 'text-muted-foreground' : 'text-primary'
                        }`}
                      >
                        {note.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{note.content}</p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
