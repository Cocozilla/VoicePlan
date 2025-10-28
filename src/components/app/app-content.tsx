
'use client';

import { Mic, Square, Loader2, AlertTriangle, Plus, Send, Check, Link as LinkIcon, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { StoredPlan, StoredItinerary, ActiveContent, TaskStatus, ConfettiTrigger, Status, RecordingMode, Task, ItineraryActivity } from '@/app/types';
import { PlanView } from './plan-view';
import { ItineraryView } from './itinerary-view';
import { VoiceVisualizer } from './voice-visualizer';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from 'firebase/auth';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const YouView = dynamic(() => import('./you-view').then(mod => mod.YouView), { 
    ssr: false,
    loading: () => (
         <div className="p-4 md:p-0 w-full max-w-4xl space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
            <div className="grid gap-4 mt-4">
                <Skeleton className="h-80" />
            </div>
        </div>
    )
});

interface AppContentProps {
    status: Status;
    activeContent: ActiveContent;
    errorMessage: string;
    setStatus: (status: Status) => void;
    recordingModeRef: React.MutableRefObject<RecordingMode>;
    handleStopRecording: () => void;
    handleStartRecording: (mode: RecordingMode, task?: Task) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    audioStream: MediaStream | null;
    // Plan props
    planHistory: StoredPlan[];
    itineraryHistory: StoredItinerary[];
    handleTaskStatusChange: (categoryIndex: number, taskIndex: number, newStatus: TaskStatus) => void;
    handleSubTaskStatusChange: (categoryIndex: number, taskIndex: number, subTaskIndex: number, completed: boolean) => void;
    editingId: string | null;
    editingTitle: string;
    setEditingTitle: (title: string) => void;
    handleEditTitle: (content: StoredPlan | StoredItinerary) => void;
    handleSaveTitle: () => void;
    resetToIdle: () => void;
    toast: any;
    confettiTrigger: ConfettiTrigger;
    // Itinerary props
    user: User | null;
    isAuthReady: boolean;
    saveItinerary: (itinerary: StoredItinerary) => Promise<void>;
}


const taglines = [
    "Speak your plans into action.",
    "Try: \"Create an itinerary for a 3-day trip to Tokyo.\"",
    "How about: \"Make a grocery list with milk, eggs, and bread.\"",
    "You could say: \"Plan a surprise birthday party for Sarah.\"",
    "Get started with: \"Generate a workout plan for this week.\"",
];


export function AppContent({
    status,
    activeContent,
    errorMessage,
    setStatus,
    recordingModeRef,
    handleStopRecording,
    handleStartRecording,
    activeTab,
    setActiveTab,
    audioStream,
    planHistory,
    itineraryHistory,
    handleTaskStatusChange,
    handleSubTaskStatusChange,
    editingId,
    editingTitle,
    setEditingTitle,
    handleEditTitle,
    handleSaveTitle,
    resetToIdle,
    toast,
    confettiTrigger,
    user,
    isAuthReady,
    saveItinerary
}: AppContentProps) {

    const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
    const [titles, setTitles] = useState(['VoicePlan']);
    const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning.";
        if (hour < 18) return "Good afternoon.";
        return "Good evening.";
    };

    useEffect(() => {
        if (status === 'idle') {
            const greeting = getGreeting();
            setTitles(['VoicePlan', greeting]);

            const titleInterval = setInterval(() => {
                setCurrentTitleIndex(prevIndex => (prevIndex + 1) % 2);
            }, 5000);

            const taglineInterval = setInterval(() => {
                setCurrentTaglineIndex((prevIndex) => (prevIndex + 1) % taglines.length);
            }, 5000);

            return () => {
                clearInterval(titleInterval);
                clearInterval(taglineInterval);
            };
        }
    }, [status]);
    

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSaveTitle();
        if (e.key === 'Escape') {
            setEditingTitle('');
        }
    };
    
  const handleShare = async () => {
    if (!activeContent || !user) return;

    const { type, data } = activeContent;
    const { id } = data;
    const shareUrl = `${window.location.origin}/share/${type}/${id}`;
    const shareTitle = `Check out this ${type}: ${data.title}`;
    const shareText = `I made this ${type} with VoicePlan and wanted to share it with you.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast({
          description: <div className="flex items-center gap-2"><Check className="h-4 w-4" /><span>Shared successfully!</span></div>,
        });
      } catch (error: any) {
        // AbortError and NotAllowedError are common when the user cancels the share dialog.
        // We can safely ignore these as it's expected user behavior.
        if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.error('Error sharing:', error);
            // Fallback to copying the link to the clipboard for other errors.
            navigator.clipboard.writeText(shareUrl);
            toast({
                variant: 'destructive',
                title: 'Error Sharing',
                description: 'Could not share. The link has been copied to your clipboard instead.',
            });
        }
      }
    } else {
      // Fallback for browsers that do not support the Web Share API.
      navigator.clipboard.writeText(shareUrl);
      toast({
        description: <div className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /><span>Link copied to clipboard!</span></div>,
      });
    }
  };

    if (!isAuthReady) {
        return (
           <div className="flex flex-col items-center justify-center min-h-screen w-full">
            <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.2s]"></div>
                <div className="w-4 h-4 rounded-full bg-primary animate-pulse [animation-delay:0.4s]"></div>
            </div>
            <p className="mt-4 text-muted-foreground">Connecting to service...</p>
            </div>
        );
    }

    if (activeTab === 'you') {
        return <YouView planHistory={planHistory} itineraryHistory={itineraryHistory} />;
    }

    switch (status) {
        case 'recording':
        case 'processing':
             return (
                <div className="text-center w-full h-full flex flex-col items-center justify-center">
                    <VoiceVisualizer status={status} audioStream={audioStream} />
                    <h2 className="text-2xl font-semibold mb-2 text-primary animate-pulse mt-8">
                        {status === 'recording' && 'Listening...'}
                        {status === 'processing' && 'Processing...'}
                    </h2>
                    <p className="text-muted-foreground max-w-xs">
                        {status === 'processing' && 'Crafting the perfect response.'}
                    </p>
                    {status === 'recording' && (
                         <Button
                            size="icon"
                            className="h-24 w-24 rounded-full bg-red-500 hover:bg-red-600 shadow-lg z-10 mt-6"
                            onClick={handleStopRecording}
                            aria-label="Stop recording"
                        >
                            <Square className="h-8 w-8" />
                        </Button>
                    )}
                </div>
            );
        case 'error':
            return (
                <Alert variant="destructive" className="max-w-md">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Oops! Something went wrong.</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                    <Button variant="secondary" className="mt-4" onClick={() => setStatus(activeContent ? 'success' : 'idle')}>
                        Go Back
                    </Button>
                </Alert>
            );
        case 'success':
            return (
                <div className="flex w-full max-w-2xl flex-col items-center gap-4">
                    {activeContent?.type === 'plan' && (
                        <PlanView
                            plan={activeContent.data}
                            handleTaskStatusChange={handleTaskStatusChange}
                            handleSubTaskStatusChange={handleSubTaskStatusChange}
                            handleStartRecording={handleStartRecording}
                            editingId={editingId}
                            editingTitle={editingTitle}
                            setEditingTitle={setEditingTitle}
                            handleEditTitle={handleEditTitle}
                            handleSaveTitle={handleSaveTitle}
                            handleTitleKeyDown={handleTitleKeyDown}
                            resetToIdle={resetToIdle}
                            handleShare={handleShare}
                            confettiTrigger={confettiTrigger}
                        />
                    )}
                    {activeContent?.type === 'itinerary' && (
                        <ItineraryView
                            itinerary={activeContent.data}
                            editingId={editingId}
                            editingTitle={editingTitle}
                            setEditingTitle={setEditingTitle}
                            handleEditTitle={handleEditTitle}
                            handleSaveTitle={handleSaveTitle}
                            handleTitleKeyDown={handleTitleKeyDown}
                            resetToIdle={resetToIdle}
                            handleShare={handleShare}
                        />
                    )}
                     <div className="flex items-center gap-4 mt-8">
                        <Button
                            size="icon"
                            className="h-24 w-24 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                            onClick={() => handleStartRecording(activeContent?.type === 'plan' ? 'updatePlan' : 'updateItinerary')}
                            aria-label="Update with voice"
                        >
                            <Mic className="h-10 w-10" />
                        </Button>
                    </div>
                </div>
            )
        case 'idle':
        default:
            return (
                <div className="text-center">
                    <div className="h-16 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                             <motion.h1
                                key={currentTitleIndex}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.5 }}
                                className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                            >
                                {titles[currentTitleIndex]}
                            </motion.h1>
                        </AnimatePresence>
                    </div>
                     <div className="h-12 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentTaglineIndex}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.5 }}
                                className="max-w-md mx-auto text-lg bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                            >
                                {taglines[currentTaglineIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                    <Button
                        size="icon"
                        className="h-24 w-24 rounded-full bg-primary hover:bg-primary/90 shadow-lg mt-4"
                        onClick={() => handleStartRecording('newContent')}
                        aria-label="Start recording"
                    >
                        <Mic className="h-10 w-10" />
                    </Button>
                    <p className="max-w-md mx-auto text-sm text-muted-foreground/50 mt-6">
                        Tap the microphone to create a new plan or itinerary.
                    </p>
                </div>
            );
    }
};
