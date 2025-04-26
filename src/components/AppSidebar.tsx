
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookText, 
  ClipboardList, 
  Calendar, 
  Settings, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar() {
  const [activeItem, setActiveItem] = useState("dashboard");

  const navigationItems = [
    { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/" },
    { id: "notes", title: "Notes & Promises", icon: BookText, path: "/notes" },
    { id: "meetings", title: "Meetings", icon: MessageSquare, path: "/meetings" },
    { id: "supplies", title: "Supplies", icon: ClipboardList, path: "/supplies" },
    { id: "planning", title: "Planning", icon: Calendar, path: "/planning" },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <span className="text-xl font-bold text-white">AV</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold">AcademeVision</span>
            <span className="text-xs text-muted-foreground">Academic Productivity</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton 
                asChild 
                className={cn(
                  activeItem === item.id && "bg-primary/10 text-primary"
                )}
                onClick={() => setActiveItem(item.id)}
              >
                <Link to={item.path} className="flex items-center gap-3">
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">DP</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Dr. Peterson</span>
              <span className="text-xs text-muted-foreground">Assistant Professor</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-full">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="w-full">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
