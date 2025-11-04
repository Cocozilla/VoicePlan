'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { StoredPlan, StoredItinerary } from '@/app/types';
import { PlanView } from '@/components/app/plan-view';
import { ItineraryView } from '@/components/app/itinerary-view';
import { LoaderCircle, AlertTriangle, ArrowLeft, BrainCircuit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type SharePageParams = {
  params: {
    type: 'plan' | 'itinerary';
    id: string;
  };
};

export default function SharePage({ params }: SharePageParams) {
  const { type, id } = params;

  const firestore = useFirestore();
  const [content, setContent] = useState<StoredPlan | StoredItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContent = async () => {
      if (!firestore) return;
      
      if (!id || !type) {
        setError('Invalid share link.');
        setLoading(false);
        return;
      }

      const collectionName = type === 'plan' ? 'shared_plans' : 'shared_itineraries';
      const docRef = doc(firestore, collectionName, id);

      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as StoredPlan | StoredItinerary);
        } else {
          setError('The shared content could not be found. It may have been deleted by the owner.');
        }
      } catch (e: any) {
        console.error("Error fetching shared content:", e);
        setError(`An unexpected error occurred: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [firestore, id, type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading shared content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Content</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Homepage
          </Link>
        </Button>
      </div>
    );
  }

  if (content) {
    return (
      <div className="animate-in fade-in zoom-in-95">
        {type === 'plan' ? (
          <PlanView plan={content as StoredPlan} />
        ) : (
          <ItineraryView itinerary={content as StoredItinerary} />
        )}

        <div className="mt-8 text-center border-t pt-8">
            <p className="text-lg font-semibold mb-4">Enjoy this plan?</p>
            <Button asChild size="lg">
              <Link href="/">
                <BrainCircuit className="mr-2 h-5 w-5" />
                Create Your Own AI Plan
              </Link>
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Powered by <Link href="/" className="underline hover:text-primary">VoicePlan</Link>
            </p>
        </div>
      </div>
    );
  }

  return null;
}
