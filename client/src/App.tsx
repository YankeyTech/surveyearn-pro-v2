import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import Surveys from "@/pages/Surveys";
import SurveyDetail from "@/pages/SurveyDetail";
import Wallet from "@/pages/Wallet";
import Referrals from "@/pages/Referrals";
import Rewards from "@/pages/Rewards";
import Withdraw from "@/pages/Withdraw";
import AdminDashboard from "@/pages/AdminDashboard";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/login"} component={Login} />
      <Route path={"/surveys"} component={Surveys} />
      <Route path={/^\/survey\/\d+$/} component={SurveyDetail} />
      <Route path={"/wallet"} component={Wallet} />
      <Route path={"/referrals"} component={Referrals} />
      <Route path={"/rewards"} component={Rewards} />
      <Route path={"/withdraw"} component={Withdraw} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/users"} component={AdminDashboard} />
      <Route path={"/admin/surveys"} component={AdminDashboard} />
      <Route path={"/admin/surveys/new"} component={AdminDashboard} />
      <Route path={"/admin/withdrawals"} component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
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
