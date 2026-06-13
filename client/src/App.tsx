import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Loader2 } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import Wallet from "./pages/Wallet";
import Withdraw from "./pages/Withdraw";
import Admin from "./pages/Admin";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl("/");
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/surveys" component={() => <ProtectedRoute component={Surveys} />} />
      <Route path="/wallet" component={() => <ProtectedRoute component={Wallet} />} />
      <Route path="/withdraw" component={() => <ProtectedRoute component={Withdraw} />} />
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} adminOnly />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
