
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage"; // Import the new AuthPage
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth"; // Import useAuth to protect routes

const queryClient = new QueryClient();

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { session, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner or a blank page while checking auth state
    return <div className="flex justify-center items-center min-h-screen">Authenticating...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
