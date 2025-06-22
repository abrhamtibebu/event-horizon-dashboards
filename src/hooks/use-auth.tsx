import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export type Role = 'admin' | 'organizer' | 'usher' | 'attendee';

interface User {
  id: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (credentials: {email: string, password: string}) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('jwt');
            if (token) {
                try {
                    const { data } = await api.get('/me');
                    setUser(data);
                } catch (error) {
                    console.error("Session expired or invalid", error);
                    localStorage.removeItem('jwt');
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (credentials: {email: string, password: string}) => {
        const { data } = await api.post('/login', credentials, {
            headers: { 'x-api-key': import.meta.env.VITE_API_KEY }
        });
        const { token, user: userData } = data;
        localStorage.setItem('jwt', token);
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            localStorage.removeItem('jwt');
            setUser(null);
            window.location.href = '/';
        }
    };
    
    const value = { isAuthenticated: !!user, user, login, logout, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 