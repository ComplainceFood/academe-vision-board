
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="p-6 text-center">
          <div className="text-6xl font-extrabold mb-4">404</div>
          <FileQuestion className="h-24 w-24 mx-auto text-primary/40 mb-6" />
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Sorry, we couldn't find the page you're looking for. Please check the URL or navigate back to the dashboard.
          </p>
          <Button asChild>
            <Link to="/">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
