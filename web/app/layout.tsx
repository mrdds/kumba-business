import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@livekit/components-styles';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import ChatWidget from '../modules/connect/components/ChatWidget';
import { ConnectProvider } from '../modules/connect/context/ConnectProvider';
import { PreferencesProvider } from '../context/PreferencesContext';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OurSpace Business',
  description: 'Gestion financière et RH pour entreprises modernes',
  manifest: '/manifest.json',
  themeColor: '#4f46e5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OurSpace',
  },
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <PreferencesProvider>
          <AuthProvider>
            <NotificationProvider>
              <ConnectProvider>
                {children}
                <ChatWidget />
                <Toaster position="top-right" />
              </ConnectProvider>
            </NotificationProvider>
          </AuthProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
