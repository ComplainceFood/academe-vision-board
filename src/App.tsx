
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { createContext, useContext } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NotesPage from "./pages/NotesPage";
import MeetingsPage from "./pages/MeetingsPage";
import SuppliesPage from "./pages/SuppliesPage";
import PlanningPage from "./pages/PlanningPage";
import AuthPage from "./pages/AuthPage";
import SettingsPage from "./pages/SettingsPage";

// Create a query client with automatic data refresh configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 60000, // 1 minute
    },
  },
});

// Define the type for the refresh context
interface RefreshContextProps {
  triggerRefresh: (table?: string) => void;
}

// Create a context for global refresh functionality
export const RefreshContext = createContext<RefreshContextProps>({
  triggerRefresh: () => {},
});

export const useRefreshContext = () => useContext(RefreshContext);

// Helper function to trigger refresh events
const triggerRefresh = (table?: string) => {
  console.log(`Triggering refresh for ${table || 'all tables'}`);
  window.dispatchEvent(
    new CustomEvent("refreshData", { detail: { table } })
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RefreshContext.Provider value={{ triggerRefresh }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings"
              element={
                <ProtectedRoute>
                  <MeetingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/supplies"
              element={
                <ProtectedRoute>
                  <SuppliesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/planning"
              element={
                <ProtectedRoute>
                  <PlanningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RefreshContext.Provider>
  </QueryClientProvider>
);

export default App;
