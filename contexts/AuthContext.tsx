import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { Staff } from '../types.ts';
import { INITIAL_STAFF } from '../constants.tsx';

interface AuthContextType {
  currentUser: Staff | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for a logged-in user in localStorage on initial load
        try {
            const storedUser = localStorage.getItem('tide_pms_user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            localStorage.removeItem('tide_pms_user');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        setLoading(true);
        return new Promise(resolve => {
            setTimeout(() => {
                const user = INITIAL_STAFF.find(
                    staff => staff.name.toLowerCase() === username.toLowerCase() && staff.password === password
                );

                if (user) {
                    const { password: _, ...userToStore } = user;
                    setCurrentUser(userToStore as Staff);
                    localStorage.setItem('tide_pms_user', JSON.stringify(userToStore));
                    setLoading(false);
                    resolve(true);
                } else {
                    setLoading(false);
                    resolve(false);
                }
            }, 1000); // Simulate network delay
        });
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('tide_pms_user');
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};