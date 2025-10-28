
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { PlanView } from '@/components/app/plan-view';
import { ItineraryView } from '@/components/app/itinerary-view';
import { StoredPlan, StoredItinerary } from '@/app/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SharePage() {
  const { firestore } = useFirebase();
  const params = useParams();
  const [content, setContent] = useState<StoredPlan | StoredItinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params || !firestore) {
      return; // Wait for params and firestore to be available
    }

    let type = Array.isArray(params.type) ? params.type[0] : params.type;
    let idFromUrl = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!type || !idFromUrl) {
      setLoading(false);
      setError("Invalid share link: Missing type or ID.");
      return;
    }

    // Handle old link format (userId_planId) and new format (planId)
    // This makes sure old links don't break.
    const idParts = idFromUrl.split('_');
    const id = idParts.length > 1 ? idParts[1] : idParts[0];


    const fetchContent = async () => {
      setLoading(true);
      try {
        // Fetch from the correct public collection based on the app's architecture
        const collectionName = type === 'plan' ? 'shared_plans' : 'shared_itineraries';
        const docRef = doc(firestore, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as StoredItinerary | StoredPlan;
          setContent({ ...data, id: docSnap.id });
        } else {
          setError('Shared content not found. The link may have expired or been removed.');
        }
      } catch (e: any) {
        console.error('Error fetching shared content:', e);
        setError(e.message || 'Failed to fetch content.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [params, firestore]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="w-full max-w-2xl">
        {loading && (
          <div className="flex flex-col items-center justify-center flex-1">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg">Loading shared content...</p>
          </div>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Content</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {content && params && (
          <div className="w-full">
            {(Array.isArray(params.type) ? params.type[0] : params.type) === 'plan' ? (
              <PlanView plan={content as StoredPlan} />
            ) : (
              <ItineraryView itinerary={content as StoredItinerary} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

    