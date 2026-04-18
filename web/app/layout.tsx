import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import ChatWidget from '../modules/connect/components/ChatWidget';
import { ConnectProvider } from '../modules/connect/context/ConnectProvider';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kumba Business',
  description: 'Manage your business finances',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            <ConnectProvider>
              {children}
              <ChatWidget />
            </ConnectProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
