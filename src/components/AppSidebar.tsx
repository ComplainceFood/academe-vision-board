import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, MessageSquare, BookText, ClipboardList, Calendar, DollarSign, Settings, LogOut, BarChart3, MessageCircle, Megaphone, Award, TestTube, Users } from "lucide-react";
import { SmartProfLogo } from "@/components/Logo";
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
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = '/auth';
    }
  };;

  return (
    <Sidebar style={{ background: "linear-gradient(180deg, #0D1E41 0%, #0A3028 60%, #1B7A5A 100%)" }}>
      {/* Header */}
      <SidebarHeader className="p-4 py-3 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3 px-2">
          <div className="rounded-xl p-0.5" style={{ background: "linear-gradient(135deg, #3DAA6E, #1B7A5A)" }}>
            <SmartProfLogo size={36} className="rounded-[10px]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-base font-bold tracking-tight text-white">
              Smart<span style={{ color: "#3DAA6E" }}>-Prof</span>
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>Teaching Smarter</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav items */}
      <SidebarContent className="my-[30px]">
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "transition-all duration-150",
                    isActive ? "text-white" : "text-white/70 hover:text-white"
                  )}
                  style={
                    isActive
                      ? { background: "linear-gradient(90deg, rgba(61,170,110,0.28) 0%, rgba(27,122,90,0.18) 100%)", borderLeft: "3px solid #3DAA6E" }
                      : { background: "transparent", borderLeft: "3px solid transparent" }
                  }
                >
                  <Link to={item.path} className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5", isActive ? "text-[#3DAA6E]" : "text-white/60")} />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback style={{ background: "linear-gradient(135deg, #1B7A5A, #3DAA6E)", color: "#fff" }}>
              {profile?.display_name?.charAt(0)?.toUpperCase() ||
                profile?.first_name?.charAt(0)?.toUpperCase() ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate">
              {profile?.display_name ||
                `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
                "User"}
            </span>
            <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
              {profile?.position || "Academic"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            className="flex-1 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
            asChild
          >
            <Link to="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="icon"
            className="flex-1 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}