import { useState, useEffect } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Search, BookOpen, Users, Calendar, ShoppingBag, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useAuth } from "@/hooks/useAuth";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: string;
  path: string;
  icon: React.ReactNode;
}

export const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: notes } = useDataFetching<any>({ table: 'notes', enabled: !!user });
  const { data: meetings } = useDataFetching<any>({ table: 'meetings', enabled: !!user });
  const { data: supplies } = useDataFetching<any>({ table: 'supplies', enabled: !!user });
  const { data: events } = useDataFetching<any>({ table: 'planning_events', enabled: !!user });
  const { data: fundingSources } = useDataFetching<any>({ table: 'funding_sources', enabled: !!user });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search notes
    notes.forEach((note: any) => {
      if ((note.title?.toLowerCase() || '').includes(query) || (note.content?.toLowerCase() || '').includes(query)) {
        allResults.push({
          id: note.id,
          title: note.title || '(Untitled)',
          description: `Note - ${note.course || 'General'}`,
          type: 'note',
          path: '/notes',
          icon: <BookOpen className="h-4 w-4" />
        });
      }
    });

    // Search meetings
    meetings.forEach((meeting: any) => {
      if ((meeting.title?.toLowerCase() || '').includes(query) || (meeting.notes?.toLowerCase() || '').includes(query)) {
        allResults.push({
          id: meeting.id,
          title: meeting.title || '(Untitled)',
          description: `Meeting - ${meeting.type || 'meeting'}`,
          type: 'meeting',
          path: '/meetings',
          icon: <Users className="h-4 w-4" />
        });
      }
    });

    // Search supplies
    supplies.forEach((supply: any) => {
      if ((supply.name?.toLowerCase() || '').includes(query) || (supply.course?.toLowerCase() || '').includes(query)) {
        allResults.push({
          id: supply.id,
          title: supply.name || '(Unnamed)',
          description: `Supply - ${supply.course || 'General'}`,
          type: 'supply',
          path: '/supplies',
          icon: <ShoppingBag className="h-4 w-4" />
        });
      }
    });

    // Search events
    events.forEach((event: any) => {
      if ((event.title?.toLowerCase() || '').includes(query) || (event.description?.toLowerCase() || '').includes(query)) {
        allResults.push({
          id: event.id,
          title: event.title || '(Untitled)',
          description: `Event - ${event.type || 'event'}`,
          type: 'event',
          path: '/planning',
          icon: <Calendar className="h-4 w-4" />
        });
      }
    });

    // Search funding sources
    fundingSources.forEach((source: any) => {
      if ((source.name?.toLowerCase() || '').includes(query) || (source.description?.toLowerCase() || '').includes(query)) {
        allResults.push({
          id: source.id,
          title: source.name || '(Unnamed)',
          description: `Funding - ${source.type || 'grant'}`,
          type: 'funding',
          path: '/funding',
          icon: <DollarSign className="h-4 w-4" />
        });
      }
    });

    setResults(allResults.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, notes, meetings, supplies, events, fundingSources]);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
    setSearchQuery("");
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search everything...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search notes, meetings, supplies, events, and funding..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result.path)}
                  className="flex items-center gap-2"
                >
                  {result.icon}
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    <span className="text-xs text-muted-foreground">{result.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
};