
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { FirebaseClientProvider } from '@/firebase';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <FirebaseClientProvider>{children}</FirebaseClientProvider>
    </SidebarProvider>
  );
}
