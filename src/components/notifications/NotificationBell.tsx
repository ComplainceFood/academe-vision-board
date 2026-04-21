import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Clock, AlertTriangle, MessageSquare, Settings, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications, AppNotification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";

const priorityConfig = {
  urgent: { color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", dot: "bg-destructive" },
  high:   { color: "text-orange-600",  bg: "bg-orange-500/10 border-orange-500/20",  dot: "bg-orange-500" },
  medium: { color: "text-amber-600",   bg: "bg-amber-500/10 border-amber-500/20",    dot: "bg-amber-500" },
  low:    { color: "text-muted-foreground", bg: "bg-muted border-border",            dot: "bg-muted-foreground" },
};

const typeIcon = (type: AppNotification["type"]) => {
  switch (type) {
    case "communication": return <MessageSquare className="h-3.5 w-3.5" />;
    case "system":        return <Settings className="h-3.5 w-3.5" />;
    case "reminder":      return <Clock className="h-3.5 w-3.5" />;
    case "alert":         return <AlertTriangle className="h-3.5 w-3.5" />;
    default:              return <Bell className="h-3.5 w-3.5" />;
  }
};

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = priorityConfig[notification.priority] ?? priorityConfig.low;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  return (
    <div
      className={cn(
        "group relative flex gap-3 p-3 rounded-lg border transition-all duration-150",
        notification.is_read
          ? "bg-background border-border/40 opacity-70"
          : `${cfg.bg} hover:opacity-100`
      )}
    >
      {/* Unread dot */}
      {!notification.is_read && (
        <span className={`absolute top-3 right-3 h-2 w-2 rounded-full ${cfg.dot} shrink-0`} />
      )}

      {/* Type icon */}
      <div className={cn("mt-0.5 shrink-0", cfg.color)}>
        {typeIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4">
        <p className={cn("text-sm font-medium leading-snug", !notification.is_read && "font-semibold")}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
          {notification.content}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          {notification.author && (
            <span className="text-[10px] text-muted-foreground">· {notification.author}</span>
          )}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
            {notification.type}
          </Badge>
        </div>
      </div>

      {/* Actions - visible on hover */}
      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.is_read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-primary transition-colors"
            title="Mark as read"
          >
            <Check className="h-3 w-3" />
          </button>
        )}
        {notification.action_url && (
          <a
            href={notification.action_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-primary transition-colors"
            title="Open link"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button
          onClick={() => onDelete(notification.id)}
          className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteNotification } = useNotifications();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-white/10 text-white/80"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-10 z-50 w-[calc(100vw-16px)] sm:w-[360px] max-w-[360px] rounded-xl border bg-background shadow-2xl overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100vh - 80px))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Badge className="h-5 px-1.5 text-[10px]">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  All read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex border-b px-3 pt-2 pb-0 gap-1">
            {(["all", "unread"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={cn(
                  "px-3 pb-2 text-xs font-medium border-b-2 transition-colors capitalize",
                  filter === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
                {tab === "unread" && unreadCount > 0 && (
                  <span className="ml-1 text-[10px] text-destructive font-bold">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* List */}
          <ScrollArea className="flex-1" style={{ maxHeight: "380px" }}>
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-3">
                    <Bell className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {filter === "unread" ? "You're all caught up!" : "Alerts and reminders will appear here"}
                  </p>
                </div>
              ) : (
                displayed.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={markRead}
                    onDelete={deleteNotification}
                  />
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2 bg-muted/20 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {notifications.length} total · {unreadCount} unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
