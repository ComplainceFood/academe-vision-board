
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { createContext, useContext, lazy, Suspense } from "react";
import { OAuthTokenCapture } from "@/components/auth/OAuthTokenCapture";

// Eagerly loaded - needed immediately on any page load
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { default as GoogleOAuthCallback } from "./pages/GoogleOAuthCallback";
import OutlookOAuthCallbackPage from "./pages/OutlookOAuthCallbackPage";
import LandingPreview from "./pages/LandingPreview";
import NotFound from "./pages/NotFound";

// Lazy loaded - only fetched when the user navigates to that route
const Index = lazy(() => import("./pages/Index"));
const NotesPage = lazy(() => import("./pages/NotesPage"));
const MeetingsPage = lazy(() => import("./pages/MeetingsPage"));
const SuppliesPage = lazy(() => import("./pages/SuppliesPage"));
const PlanningPage = lazy(() => import("./pages/PlanningPage"));
const FundingPage = lazy(() => import("./pages/FundingPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const TestingPage = lazy(() => import("./pages/TestingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const CommunicationsPage = lazy(() => import("./pages/CommunicationsPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const PrivacyPolicy = lazy(() => import("./components/legal/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import("./components/legal/TermsOfService").then(m => ({ default: m.TermsOfService })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      <OAuthTokenCapture />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
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
      </Suspense>
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
