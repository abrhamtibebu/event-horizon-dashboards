import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  QrCode, 
  Users, 
  MessageSquare, 
  User,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsherMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function UsherMobileLayout({ children, title = 'Usher App' }: UsherMobileLayoutProps) {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/dashboard/usher' },
    { icon: QrCode, label: 'Scan', path: '/dashboard/usher/redemption' },
    { icon: Users, label: 'Guests', path: '/dashboard/usher/events' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/messages' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0b1630] text-white font-sans selection:bg-primary/30 pb-20 overflow-x-hidden">
      {/* App Header */}
      <header className="sticky top-0 z-50 bg-[#0b1630]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-xs">EV</span>
          </div>
          <h1 className="font-bold text-lg tracking-tight">{title}</h1>
        </div>
        <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b1630]"></span>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pt-4">
        {children}
      </main>

      {/* Persistent Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0b1630]/90 backdrop-blur-2xl border-t border-white/10 px-2 pt-2 pb-safe-area shadow-[0_-8px_30px_rgb(0,0,0,0.4)]">
        <div className="flex justify-around items-center max-w-md mx-auto h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex flex-col items-center justify-center flex-1 transition-all duration-300 gap-1 relative",
                  isActive ? "text-primary scale-110" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10" : ""
                )}>
                  <Icon className={cn(
                    "w-6 h-6",
                    isActive ? "drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" : ""
                  )} />
                </div>
                <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
      
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
}
