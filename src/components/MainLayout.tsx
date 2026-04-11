
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Sun, Moon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, cleanupAuthState } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { GlobalSearch } from "@/components/common/GlobalSearch";
import { SmartProfLogo } from "@/components/Logo";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
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
    <SidebarProvider>
      <div className="min-h-screen w-full flex">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 md:h-16 border-b px-3 sm:px-6 flex items-center justify-between bg-sidebar-accent shrink-0">
             <div className="flex items-center gap-2 sm:gap-3 min-w-0">
               <SidebarTrigger />
               <SmartProfLogo size={32} />
               <span className="text-base font-bold text-foreground tracking-tight hidden sm:inline">
                 Smart<span className="text-primary">-Prof</span>
               </span>
               <h1 className="sr-only">Smart-Prof — Organize, Optimize, Excel</h1>
             </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <GlobalSearch />
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                  {isDarkMode ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
                </Button>
                {user &&
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                }
              </div>
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>);

}