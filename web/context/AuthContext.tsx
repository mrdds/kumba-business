'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile } from '../services/api';
import { io } from 'socket.io-client';

type AuthContextType = {
    user: any;
    login: (data: any) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    isLoading: boolean;
    token: string | null;
};

const AuthContext = createContext < AuthContextType > ({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState < any > (null);
    const [isLoading, setIsLoading] = useState(true);

    const [token, setToken] = useState < string | null > (null);

    const fetchUser = async () => {
        // [SSO] Check for tokens in URL params first
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const access = urlParams.get('access_token');
            const refresh = urlParams.get('refresh_token');

            if (access && refresh) {
                localStorage.setItem('access_token', access);
                localStorage.setItem('refresh_token', refresh);
                setToken(access);
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }

        const storedToken = localStorage.getItem('access_token');
        setToken(storedToken);
        if (storedToken) {
            try {
                const profile = await getUserProfile();
                setUser(profile);
            } catch (e) {
                console.error("Failed to load user", e);
                // localStorage.removeItem('access_token');
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // Real-time updates integration
    useEffect(() => {
        if (user && user.id) {
            /* Disabling dead socket.io connection causing noise 
            const socket = io(process.env.NEXT_PUBLIC_REALTIME_URL || 'http://localhost:8088', {
                transports: ['websocket'],
            });

            socket.on('connect', () => {
                socket.emit('register', user.id);
            });

            socket.on('profile_updated', (data) => {
                console.log('Realtime Profile Update received:', data);
                fetchUser(); // Re-fetch the profile data immediately
            });

            return () => {
                socket.disconnect();
            };
            */
            return () => {};
        }
    }, [user?.id]);

    const login = async (data: any) => {
        // [SSO] Perform local login against Business API (which proxies/syncs to Kumba Auth)
        const { login: apiLogin } = await import('../services/api');
        try {
            const tokens = await apiLogin(data);
            if (tokens.access && tokens.refresh) {
                localStorage.setItem('access_token', tokens.access);
                localStorage.setItem('refresh_token', tokens.refresh);
                setToken(tokens.access);
                await fetchUser();
                // Redirect to dashboard
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error("Login error in context:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setToken(null);
        // Redirect to local login
        window.location.href = '/auth/login';
    };

    const refreshUser = async () => {
        await fetchUser();
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshUser, isLoading, token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
