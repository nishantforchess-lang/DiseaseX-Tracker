import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Intake from "@/pages/Intake";
import Results from "@/pages/Results";
import Protocol from "@/pages/Protocol";
import Protocols from "@/pages/Protocols";
import Queue from "@/pages/Queue";
import Outbreaks from "@/pages/Outbreaks";
import PatientDetail from "@/pages/PatientDetail";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/intake" component={Intake} />
        <Route path="/results/:id" component={Results} />
        <Route path="/protocol/:id" component={Protocol} />
        <Route path="/protocols" component={Protocols} />
        <Route path="/queue" component={Queue} />
        <Route path="/outbreaks" component={Outbreaks} />
        <Route path="/patient/:id" component={PatientDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
