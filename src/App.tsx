import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import BorrowerDashboard from "./pages/BorrowerDashboard";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const baseName = import.meta.env.BASE_URL || "/";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter basename={baseName}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/borrower" element={<BorrowerDashboard />} />
            <Route path="/librarian" element={<LibrarianDashboard />} />
            <Route path="/supervisor" element={<SupervisorDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
