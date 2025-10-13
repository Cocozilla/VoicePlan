'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const HomePageContent = dynamic(() => import('./HomePageContent'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen w-full">
      <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.2s]"></div>
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.4s]"></div>
      </div>
      <p className="mt-4 text-muted-foreground">Loading Planner...</p>
    </div>
  ),
});

export default function Home() {
  return <HomePageContent />;
}
