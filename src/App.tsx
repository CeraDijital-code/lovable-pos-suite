import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import StockPage from "./pages/StockPage";
import CampaignsPage from "./pages/CampaignsPage";
import CashRegisterPage from "./pages/CashRegisterPage";
import ReportsPage from "./pages/ReportsPage";
import StockReportPage from "./pages/StockReportPage";
import SettingsPage from "./pages/SettingsPage";
import StaffPage from "./pages/StaffPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/giris" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/giris" element={<AuthRoute><LoginPage /></AuthRoute>} />
    <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    <Route path="/stok" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
    <Route path="/kampanyalar" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} />
    <Route path="/kasa" element={<ProtectedRoute><CashRegisterPage /></ProtectedRoute>} />
    <Route path="/raporlar" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
    <Route path="/stok-raporu" element={<ProtectedRoute><StockReportPage /></ProtectedRoute>} />
    <Route path="/personel" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
    <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
    <Route path="/ayarlar" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
