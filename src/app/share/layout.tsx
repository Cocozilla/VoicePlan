'use client';

// This layout is intentionally minimal. 
// The FirebaseClientProvider is now handled directly on the page to ensure timely initialization.
export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
