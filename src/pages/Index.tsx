
import { MainLayout } from "@/components/MainLayout";
import { SeedDataButton } from "@/components/SeedDataButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

const Index = () => {
  const { user } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold mb-6">Welcome to Academia Vision</h1>
          <p className="text-lg mb-8">Your teaching assistant for managing courses, notes, and supplies.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Track promises you make to students</li>
                  <li>Manage your course notes</li>
                  <li>Schedule and organize meetings</li>
                  <li>Track teaching supplies and inventory</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Seed Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  To get started quickly, you can populate your account with sample data.
                  This will add sample data to all tables (notes, meetings, supplies, and expenses).
                </p>
                <SeedDataButton />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </QueryClientProvider>
  );
};

export default Index;
