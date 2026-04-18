
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { createContext, useContext } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NotesPage from "./pages/NotesPage";
import MeetingsPage from "./pages/MeetingsPage";
import SuppliesPage from "./pages/SuppliesPage";
import PlanningPage from "./pages/PlanningPage";
import FundingPage from "./pages/FundingPage";
import AchievementsPage from "./pages/AchievementsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TestingPage from "./pages/TestingPage";
import SettingsPage from "./pages/SettingsPage";
import FeedbackPage from "./pages/FeedbackPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { default as GoogleOAuthCallback } from "./pages/GoogleOAuthCallback";
import OutlookOAuthCallbackPage from "./pages/OutlookOAuthCallbackPage";
import LandingPreview from "./pages/LandingPreview";
import { OAuthTokenCapture } from "@/components/auth/OAuthTokenCapture";
import { PrivacyPolicy } from "./components/legal/PrivacyPolicy";
import { TermsOfService } from "./components/legal/TermsOfService";
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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { isSystemAdmin, loading: roleLoading } = useUserRole();

  if (loading || roleLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isSystemAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const { user, loading } = useAuth();
  
  console.log('AppContent - user:', user?.id, 'loading:', loading);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      <OAuthTokenCapture />
      <Routes>
        {/* Public routes - no authentication required */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/landing" element={<LandingPreview />} />
        <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
        <Route path="/auth/outlook/callback" element={<OutlookOAuthCallbackPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        
        {/* Protected routes - authentication required */}
        <Route
          path="/"
          element={
            user ? <Index /> : <LandingPreview />
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
          path="/funding"
          element={
            <ProtectedRoute>
              <FundingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/achievements"
          element={
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/testing"
          element={
            <AdminRoute>
              <TestingPage />
            </AdminRoute>
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
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communications"
          element={
            <ProtectedRoute>
              <CommunicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RefreshContext.Provider value={{ triggerRefresh }}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </RefreshContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
