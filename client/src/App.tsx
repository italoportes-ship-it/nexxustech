import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import Home from "./pages/Home";
import Softwares from "./pages/Softwares";
import Cursos from "./pages/Cursos";
import Category from "./pages/Category";
import ProductDetail from "./pages/ProductDetail";
import B2B from "./pages/B2B";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import ChatWidget from "./components/ChatWidget";

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/softwares" component={Softwares} />
          <Route path="/cursos" component={Cursos} />
          <Route path="/categoria/:slug" component={Category} />
          <Route path="/produto/:slug" component={ProductDetail} />
          <Route path="/b2b" component={B2B} />
          <Route path="/carrinho" component={Cart} />
          <Route path="/checkout/:orderId" component={Checkout} />
          <Route path="/conta" component={Account} />
          <Route path="/admin" component={Admin} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
