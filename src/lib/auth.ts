// Mock function to get user role - replace with actual authentication
export const getCurrentUserRole = (): string => {
    // This would typically come from your authentication system
    // For demo purposes, we'll cycle through roles or use localStorage
    const savedRole = localStorage.getItem("demo-user-role");
    if (savedRole) return savedRole;
    
    // Default to admin for demo
    localStorage.setItem("demo-user-role", "admin");
    return "admin";
  }; 