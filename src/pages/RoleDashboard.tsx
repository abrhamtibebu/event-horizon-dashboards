
import { useEffect, useState } from "react";
import AdminDashboard from "./AdminDashboard";
import OrganizerDashboard from "./OrganizerDashboard";
import UsherDashboard from "./UsherDashboard";

// Mock function to get user role - replace with actual authentication
const getCurrentUserRole = (): string => {
  // This would typically come from your authentication system
  // For demo purposes, we'll cycle through roles or use localStorage
  const savedRole = localStorage.getItem("demo-user-role");
  if (savedRole) return savedRole;
  
  // Default to admin for demo
  localStorage.setItem("demo-user-role", "admin");
  return "admin";
};

export default function RoleDashboard() {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const role = getCurrentUserRole();
    setUserRole(role);
  }, []);

  // Role switcher for demo purposes - remove in production
  const switchRole = (role: string) => {
    localStorage.setItem("demo-user-role", role);
    setUserRole(role);
  };

  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Demo Role Switcher - Remove in production */}
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">
          <strong>Demo Mode:</strong> Switch between user roles to see different dashboards
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => switchRole("admin")}
            className={`px-3 py-1 text-xs rounded ${
              userRole === "admin" 
                ? "bg-blue-600 text-white" 
                : "bg-white text-blue-600 border border-blue-600"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => switchRole("organizer")}
            className={`px-3 py-1 text-xs rounded ${
              userRole === "organizer" 
                ? "bg-purple-600 text-white" 
                : "bg-white text-purple-600 border border-purple-600"
            }`}
          >
            Organizer
          </button>
          <button
            onClick={() => switchRole("usher")}
            className={`px-3 py-1 text-xs rounded ${
              userRole === "usher" 
                ? "bg-green-600 text-white" 
                : "bg-white text-green-600 border border-green-600"
            }`}
          >
            Usher
          </button>
        </div>
      </div>

      {/* Render appropriate dashboard based on role */}
      {userRole === "admin" && <AdminDashboard />}
      {userRole === "organizer" && <OrganizerDashboard />}
      {userRole === "usher" && <UsherDashboard />}
    </div>
  );
}
