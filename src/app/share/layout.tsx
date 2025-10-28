
'use client';

import { FirebaseClientProvider } from '@/firebase';

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <FirebaseClientProvider>{children}</FirebaseClientProvider>;
}
