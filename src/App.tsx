import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import ReelsPage from "./pages/ReelsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import CreatePage from "./pages/CreatePage";
import AuthPage from "./pages/AuthPage";
import CoinsPage from "./pages/CoinsPage";
import LivePage from "./pages/LivePage";
import DiscoverPage from "./pages/DiscoverPage";
import NotificationsPage from "./pages/NotificationsPage";
import AIChatPage from "./pages/AIChatPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reels" element={<ReelsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/coins" element={<CoinsPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/ai-chat" element={<AIChatPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
