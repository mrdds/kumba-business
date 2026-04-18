import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { getUserProfile, setLogoutCallback } from '../services/api';

type AuthContextType = {
    user: any;
    isLoading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signUp: (data: any) => Promise<void>;
    signOut: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = React.useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            if (token) {
                // Validate token by fetching profile
                const profile = await getUserProfile();
                setUser(profile);
            }
        } catch (e) {
            console.log("Token validation failed, logging out:", e);
            await signOut();
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
        setLogoutCallback(() => {
            console.log('API signaled logout');
            setUser(null);
            // SecureStore clearing is done by api.ts before calling this, but safe to do again or just rely on state clear.
            // But verify: signOut function in AuthContext also clears SecureStore.
            // Let's reuse signOut to be safe, but signOut is async and sets user null.
            // We can't easily call async signOut from here without wrappers.
            // Simplest: just setUser(null) as api.ts already cleared tokens.
        });
    }, [checkAuth]);

    const hasPermission = (permission: string) => {
        if (!user) return false;
        if (user.permissions?.['*']) return true; // Super Admin check
        return !!user.permissions?.[permission];
    };

    const signIn = async (email: string, pass: string) => {
        try {
            const response = await api.post('/token/pair', { username: email, password: pass });
            const { access, refresh } = response.data;
            await SecureStore.setItemAsync('access_token', access);
            await SecureStore.setItemAsync('refresh_token', refresh);

            // Fetch profile immediately to populate user object
            const profile = await getUserProfile();
            setUser(profile);

            // Navigation is handled by RootLayout useEffect
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const signUp = async (data: any) => {
        try {
            await api.post('/auth/register', data);
            await signIn(data.email, data.password);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const signOut = async () => {
        try {
            await SecureStore.deleteItemAsync('access_token');
            await SecureStore.deleteItemAsync('refresh_token');
        } catch (error) {
            console.error('Error signing out:', error);
        }
        setUser(null);
        // Navigation is handled by RootLayout useEffect
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};
