
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AppProviders } from './providers';
import { ClientOnly } from '@/components/ui/client-only';


const APP_NAME = "VoicePlan";
const APP_DESCRIPTION = "Your personal AI-powered planner.";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});


export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head />
      <body className="font-body antialiased">
        <ClientOnly>
          <AppProviders>
            {children}
            <Toaster />
          </AppProviders>
        </ClientOnly>
      </body>
    </html>
  );
}
