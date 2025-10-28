
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { PlanView } from '@/components/app/plan-view';
import { ItineraryView } from '@/components/app/itinerary-view';
import { StoredPlan, StoredItinerary } from '@/app/types';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SharePageContent() {
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

    const id = idFromUrl;

    const fetchContent = async () => {
      setLoading(true);
      
      const collectionName = type === 'plan' ? 'shared_plans' : 'shared_itineraries';
      const docRef = doc(firestore, collectionName, id);

      getDoc(docRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StoredItinerary | StoredPlan;
          setContent({ ...data, id: docSnap.id });
        } else {
          setError('Shared content not found. The link may have expired or been removed.');
        }
        setLoading(false);
      }).catch(serverError => {
        // Create the rich, contextual error.
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'get',
        });
        
        // Emit the error to be caught by the global listener.
        errorEmitter.emit('permission-error', permissionError);
        
        // Also set a local error for the UI.
        setError('The requested content could not be found or you do not have permission to view it. The link may be expired or the content may have been deleted.');
        setLoading(false);
      });
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
        {error && !loading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Content</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {content && (
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


export default function SharePage() {
    return <SharePageContent />;
}
