import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import DirectMessagePage from "./pages/DirectMessagePage";
import UserProfilePage from "./pages/UserProfilePage";
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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><ReelsPage /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
            <Route path="/coins" element={<ProtectedRoute><CoinsPage /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><LivePage /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/ai-chat" element={<ProtectedRoute><AIChatPage /></ProtectedRoute>} />
            <Route path="/dm/:userId" element={<ProtectedRoute><DirectMessagePage /></ProtectedRoute>} />
            <Route path="/user/:userId" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
