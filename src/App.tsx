
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import CreateEvent from "./pages/CreateEvent";
import Users from "./pages/Users";
import Organizers from "./pages/Organizers";
import AddOrganizer from "./pages/AddOrganizer";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RoleDashboard from "./pages/RoleDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Authentication Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<RoleDashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/create" element={<CreateEvent />} />
            <Route path="events/:eventId" element={<EventDetails />} />
            <Route path="users" element={<Users />} />
            <Route path="organizers" element={<Organizers />} />
            <Route path="organizers/add" element={<AddOrganizer />} />
            <Route path="messages" element={<Messages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
