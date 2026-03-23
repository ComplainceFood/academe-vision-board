import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, MessageSquare, BookText, ClipboardList, Calendar, DollarSign, Settings, LogOut, BarChart3, MessageCircle, Megaphone, Award, TestTube, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function AppSidebar() {
  const location = useLocation();
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSystemAdmin } = useUserRole();

  const isAdmin = isSystemAdmin();

  const navigationItems = [{
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
    adminOnly: false,
  }, {
    id: "notes",
    title: "Notes & Commitments",
    icon: BookText,
    path: "/notes",
    adminOnly: false,
  }, {
    id: "meetings",
    title: "Meetings",
    icon: MessageSquare,
    path: "/meetings",
    adminOnly: false,
  }, {
    id: "supplies",
    title: "Supplies & Expenses",
    icon: ClipboardList,
    path: "/supplies",
    adminOnly: false,
  }, {
    id: "planning",
    title: "Semester & Planning",
    icon: Calendar,
    path: "/planning",
    adminOnly: false,
  }, {
    id: "funding",
    title: "Grant Management",
    icon: DollarSign,
    path: "/funding",
    adminOnly: false,
  }, {
    id: "achievements",
    title: "Scholastic Achievements",
    icon: Award,
    path: "/achievements",
    adminOnly: false,
  }, {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    path: "/analytics",
    adminOnly: false,
  }, {
    id: "testing",
    title: "Testing Platform",
    icon: TestTube,
    path: "/testing",
    adminOnly: true,
  }, {
    id: "admin-users",
    title: "User Management",
    icon: Users,
    path: "/admin/users",
    adminOnly: true,
  }, {
    id: "communications",
    title: "Admin Communications",
    icon: Megaphone,
    path: "/communications",
    adminOnly: false,
  }, {
    id: "feedback",
    title: "Platform Feedback",
    icon: MessageCircle,
    path: "/feedback",
    adminOnly: false,
  }, {
    id: "settings",
    title: "Settings",
    icon: Settings,
    path: "/settings",
    adminOnly: false,
  }].filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      // Clean up auth state first
      const cleanupAuthState = () => {
        localStorage.removeItem('supabase.auth.token');
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      };

      cleanupAuthState();

      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {








        // Ignore errors
      } // Force page reload for clean state
      window.location.href = '/auth';} catch (error) {console.error("Error signing out:", error); // Even if signout fails, clean up and redirect
      window.location.href = '/auth';}};return <Sidebar>
      <SidebarHeader className="p-4 py-[10px] pb-[10px]">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <span className="text-xl font-bold text-white">SP</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-bold">Smart-Prof</span>
            <span className="text-xs text-muted-foreground">Teaching Smarter</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="my-[30px]">
        <SidebarMenu>
          {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild className={cn(isActive && "bg-primary/10 text-primary")}>
                  <Link to={item.path} className="flex items-center gap-3 bg-primary-foreground">
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>);

        })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.display_name?.charAt(0)?.toUpperCase() ||
              profile?.first_name?.charAt(0)?.toUpperCase() ||
              "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {profile?.display_name ||
              `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
              "User"}
              </span>
              <span className="text-xs text-muted-foreground">
                {profile?.position || "Academic"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-full" asChild>
            <Link to="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>;
}