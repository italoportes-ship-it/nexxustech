import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import ChatWidget from "./components/ChatWidget";
import WelcomeToast from "./components/WelcomeToast";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Softwares = lazy(() => import("./pages/Softwares"));
const Cursos = lazy(() => import("./pages/Cursos"));
const Category = lazy(() => import("./pages/Category"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const B2B = lazy(() => import("./pages/B2B"));
const Cart = lazy(() => import("./pages/Cart"));
const CheckoutStart = lazy(() => import("./pages/CheckoutStart"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutProcessing = lazy(() => import("./pages/CheckoutProcessing"));
const CheckoutCancelled = lazy(() => import("./pages/CheckoutCancelled"));
const CheckoutError = lazy(() => import("./pages/CheckoutError"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Compare = lazy(() => import("./pages/Compare"));
const Protocol = lazy(() => import("./pages/Protocol"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#0071E3] animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location}>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/softwares" component={Softwares} />
            <Route path="/cursos" component={Cursos} />
            <Route path="/categoria/:slug" component={Category} />
            <Route path="/produto/:slug" component={ProductDetail} />
            <Route path="/b2b" component={B2B} />
            <Route path="/carrinho" component={Cart} />
            <Route path="/checkout/novo" component={CheckoutStart} />
            <Route path="/checkout/sucesso" component={CheckoutSuccess} />
            <Route path="/checkout/processando" component={CheckoutProcessing} />
            <Route path="/checkout/cancelado" component={CheckoutCancelled} />
            <Route path="/checkout/erro" component={CheckoutError} />
            <Route path="/checkout/:orderId" component={Checkout} />
            <Route path="/conta" component={Account} />
            <Route path="/admin" component={Admin} />
            <Route path="/faq" component={FAQ} />
            <Route path="/comparar" component={Compare} />
            <Route path="/protocolo" component={Protocol} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
          <ChatWidget />
          <WelcomeToast />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
