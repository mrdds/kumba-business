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
        }
    }, [user?.id]);

    const login = async (data: any) => {
        // [SSO] Redirect to Core Login
        const currentUrl = window.location.origin + '/dashboard'; // Redirect back to dashboard
        window.location.href = `https://kumba-auth.trocplus.ci/login?redirect_url=${encodeURIComponent(currentUrl)}`;
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setUser(null);
        setToken(null);
        // [SSO] Global Logout via Kumba Auth
        window.location.href = 'https://kumba-auth.trocplus.ci/logout?redirect=http://localhost:3002/';
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
