

'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { PlanView } from '@/components/app/plan-view';
import { ItineraryView } from '@/components/app/itinerary-view';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { GeneratePlanFromTextOutput, GenerateItineraryFromTextOutput, StoredPlan, StoredItinerary } from '@/ai/schemas';


export default function SharePage({ params }: { params: { type: 'plan' | 'itinerary', id: string } }) {
    const [content, setContent] = useState<StoredPlan | StoredItinerary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        if (params.id && params.type) {
            const fetchContent = async () => {
                const { firestore } = initializeFirebase();
                if (!firestore) {
                  setError('Firestore is not available.');
                  setLoading(false);
                  return;
                }
                try {
                    // This path reads from the public collection, which is populated by the save functions.
                    const collectionName = params.type === 'plan' ? 'plans' : 'itineraries';
                    const docRef = doc(firestore, collectionName, params.id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        setContent(docSnap.data() as StoredPlan | StoredItinerary);
                    } else {
                        setError('The requested content could not be found. The link may be expired or the content may have been deleted.');
                    }
                } catch (e) {
                    console.error("Error fetching document: ", e);
                    setError('An error occurred while trying to load the content.');
                } finally {
                    setLoading(false);
                }
            };

            fetchContent();
        }
    }, [params.id, params.type]);

    const ReadOnlyWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="pointer-events-none">
            {children}
        </div>
    );
    
    if (loading) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                <div className="w-full max-w-2xl space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                    </div>
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                 <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Content Not Found</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    if (!content) {
        return null;
    }

    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-start bg-muted/20 p-4 md:p-8 relative overflow-hidden">
             <div 
                className="absolute inset-0 z-0 opacity-30"
                style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 35%), radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 35%)',
                }}
            />
            <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            
            <div className="z-10 w-full max-w-2xl">
                {params.type === 'plan' ? (
                     <ReadOnlyWrapper>
                        <PlanView plan={content as StoredPlan} handleTaskStatusChange={()=>{}} handleSubTaskStatusChange={()=>{}} handleStartRecording={()=>{}} editingId={null} editingTitle={""} setEditingTitle={()=>{}} handleEditTitle={()=>{}} handleSaveTitle={()=>{}} handleTitleKeyDown={()=>{}} resetToIdle={()=>{}} handleCopyLink={()=>{}} confettiTrigger={null} />
                    </ReadOnlyWrapper>
                ) : (
                     <ReadOnlyWrapper>
                        <ItineraryView itinerary={content as StoredItinerary} />
                    </ReadOnlyWrapper>
                )}
            </div>

            <footer className="z-10 mt-8 text-center text-muted-foreground text-sm">
                <p>Shared via VoicePlan</p>
            </footer>
        </main>
    );
}
