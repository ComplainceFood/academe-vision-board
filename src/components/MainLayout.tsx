
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, cleanupAuthState } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { SmartProfLogoWide } from "@/components/Logo";
import { OnboardingModal } from "@/components/common/OnboardingModal";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useTheme } from "next-themes";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleDarkMode = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      cleanupAuthState();
      await supabase.auth.signOut({ scope: 'global' });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      // Even on error, clean up and redirect so user is not stuck
      navigate("/auth");
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <OnboardingModal />
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 px-3 sm:px-5 flex items-center justify-between shrink-0 gap-2" style={{ background: "linear-gradient(90deg, #0D1E41 0%, #0A3028 100%)", borderBottom: "1px solid rgba(61,170,110,0.25)" }}>
             <div className="flex items-center gap-2 min-w-0 flex-1">
               <SidebarTrigger className="shrink-0 text-white/70 hover:text-white" />
               <SmartProfLogoWide height={52} className="shrink-0 hidden xs:block" />
               <h1 className="sr-only">Smart-Prof - Organize, Optimize, Excel</h1>
             </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <GlobalSearch />
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8 sm:h-9 sm:w-9 text-white/70 hover:text-white hover:bg-white/10">
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {user &&
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-9 sm:w-9 text-white/70 hover:text-white hover:bg-white/10">
                  <LogOut className="h-4 w-4" />
                </Button>
              }
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>);

}
