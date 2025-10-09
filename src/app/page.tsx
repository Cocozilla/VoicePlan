
'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addSubtasksFromVoice, fetchUserInsights, signUpWithEmail, signInWithEmail, signOutFromApp, updatePlanFromVoice, updateItineraryFromVoice, generateContentFromVoice } from './actions';
import { MainLayout } from '@/components/app/main-layout';
import { useFirestore, useUser, FirebaseClientProvider, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, getDoc, setDoc, deleteDoc, query, orderBy, getDocs, writeBatch } from "firebase/firestore";
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { signInAnonymously } from 'firebase/auth';
import { useAuth } from '@/firebase';
import type { 
    StoredPlan, 
    StoredItinerary, 
    GeneratePlanFromTextOutput,
    GenerateItineraryFromTextOutput,
    Task,
    Status,
    AppTheme,
    ColorTheme,
    TaskStatus,
    RecordingMode,
    ActiveContent,
    ConfettiTrigger
} from './types';

function HomePageContent() {
  // State for UI and content
  const [status, setStatus] = useState<Status>('idle');
  const [activeContent, setActiveContent] = useState<ActiveContent>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('plans');
  const [confettiTrigger, setConfettiTrigger] = useState<ConfettiTrigger>(null);
  
  // State for editing content
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // State for data history
  const [planHistory, setPlanHistory] = useState<StoredPlan[]>([]);
  const [itineraryHistory, setItineraryHistory] = useState<StoredItinerary[]>([]);

  // State for authentication and system settings
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [appTheme, setAppTheme] = useState<AppTheme>('light');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('purple');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { isInstallable, promptInstall } = usePWAInstall();

  // Refs for media and recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingModeRef = useRef<RecordingMode>('newContent');
  const activeTaskRef = useRef<Task | null>(null); 
  const audioStream = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // --- Start of Effects ---
  
  // Anonymous sign-in effect
  useEffect(() => {
    if (!isUserLoading && !user) {
        signInAnonymously(auth).catch(error => {
            console.warn("Anonymous sign-in failed:", error);
            toast({
                variant: "destructive",
                title: "Offline Mode",
                description: "Could not connect to sync services. Your work will be saved locally.",
            });
        });
    }
  }, [isUserLoading, user, auth, toast]);

  // Data Fetching Effect (triggered by user change)
  useEffect(() => {
      if (user) {
          fetchHistoryFromFirestore(user.uid);
      } else {
          // Clear history if user signs out
          setPlanHistory([]);
          setItineraryHistory([]);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Theme Effects
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as AppTheme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setAppTheme(initialTheme);
    
    const storedColorTheme = localStorage.getItem('colorTheme') as ColorTheme | null;
    if (storedColorTheme) setColorTheme(storedColorTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(appTheme);
    localStorage.setItem('theme', appTheme);
  }, [appTheme]);

  useEffect(() => {
    document.body.classList.remove('theme-purple', 'theme-mint', 'theme-red', 'theme-blue');
    document.body.classList.add(`theme-${colorTheme}`);
    localStorage.setItem('colorTheme', colorTheme);
  }, [colorTheme]);


  // --- End of Effects ---

  // --- Start of Handlers ---

  const toggleTheme = () => {
    setAppTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleNotificationToggle = async () => {
     if (!("Notification" in window) || !("serviceWorker" in navigator)) {
         toast({ variant: 'destructive', description: "This browser does not support push notifications." });
         return;
     }

     if (notificationsEnabled) {
         toast({ 
             title: "Notifications are managed in your browser",
             description: "To turn off notifications, please manage them in your browser or system settings.",
         });
         return;
     }
     
      try {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
              setNotificationsEnabled(true);
              toast({ description: "Notifications have been enabled." });
          } else {
              setNotificationsEnabled(false);
              toast({ 
                  variant: 'destructive', 
                  title: "Permission Denied",
                  description: "You've disabled notifications. To enable them, please go to your browser settings."
              });
          }
      } catch(error) {
          console.error("Error requesting notification permission:", error)
          setNotificationsEnabled(false);
          toast({
              variant: 'destructive',
              title: 'Error',
              description: 'An unexpected error occurred while requesting permissions.',
          });
      }
  };

  const fetchHistoryFromFirestore = async (userId: string) => {
    if (!firestore || !user) {
        console.error("Firestore is not initialized or user is not authenticated.");
        return;
    }
    try {
        const planQuery = query(collection(firestore, `users/${userId}/plans`), orderBy("createdAt", "desc"));
        const planSnapshot = await getDocs(planQuery);
        const plans = planSnapshot.docs.map(doc => doc.data() as StoredPlan);
        setPlanHistory(plans);

        const itineraryQuery = query(collection(firestore, `users/${userId}/itineraries`), orderBy("createdAt", "desc"));
        const itinerarySnapshot = await getDocs(itineraryQuery);
        const itineraries = itinerarySnapshot.docs.map(doc => doc.data() as StoredItinerary);
        setItineraryHistory(itineraries);
    } catch (error) {
        console.error("Error fetching history from Firestore: ", error);
        toast({
            variant: "destructive",
            title: "Error Loading Data",
            description: "Could not load your saved content. Check Firestore rules.",
        });
    }
  }


  const savePlan = async (plan: StoredPlan) => {
    const isNewPlan = !planHistory.some(p => p.id === plan.id);
    if (isNewPlan) {
        setPlanHistory(prev => [plan, ...prev]);
    } else {
        setPlanHistory(prev => prev.map(p => p.id === plan.id ? plan : p));
    }
    
    if (activeContent?.type === 'plan' && activeContent.data.id === plan.id) {
        setActiveContent({type: 'plan', data: plan});
    }

    if (!firestore || !user) return;
    
    const userPlanRef = doc(firestore, `users/${user.uid}/plans`, plan.id);
    setDoc(userPlanRef, plan, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userPlanRef.path,
        operation: 'write',
        requestResourceData: plan,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }
  
  const saveItinerary = async (itinerary: StoredItinerary) => {
    const isNewItinerary = !itineraryHistory.some(i => i.id === itinerary.id);
     if (isNewItinerary) {
        setItineraryHistory(prev => [itinerary, ...prev]);
    } else {
        setItineraryHistory(prev => prev.map(i => i.id === itinerary.id ? itinerary : i));
    }

    if (activeContent?.type === 'itinerary' && activeContent.data.id === itinerary.id) {
        setActiveContent({type: 'itinerary', data: itinerary});
    }

    if (!firestore || !user) return;

    const userItineraryRef = doc(firestore, `users/${user.uid}/itineraries`, itinerary.id);
    setDoc(userItineraryRef, itinerary, { merge: true }).catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userItineraryRef.path,
        operation: 'write',
        requestResourceData: itinerary,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  }

  const handleStartRecording = async (mode: RecordingMode, task?: Task) => {
    recordingModeRef.current = mode;
    if (mode === 'subtask' && task) {
        activeTaskRef.current = task;
    } else {
        activeTaskRef.current = null;
    }
    setErrorMessage('');
    if (mode === 'newContent') setActiveContent(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.current = stream;
      setStatus('recording');
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.addEventListener('dataavailable', (event) => {
        audioChunksRef.current.push(event.data);
      });
      mediaRecorderRef.current.start();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.');
      setStatus('error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.addEventListener('stop', async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        setStatus('processing');
        if (audioStream.current) {
            audioStream.current.getTracks().forEach(track => track.stop());
            audioStream.current = null;
        }
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const audioDataUri = reader.result as string;

          switch (recordingModeRef.current) {
            case 'newContent': {
              const result = await generateContentFromVoice({ audioDataUri, context: activeContent?.type });
              if (!result) {
                setErrorMessage('An unexpected response was received from the server.');
                setStatus('error');
              } else if (result.error) {
                setErrorMessage(result.error); setStatus('error');
              } else if (result.content?.type === 'plan' && result.content.data) {
                  if (!user) {
                      setErrorMessage("You must be logged in to create a plan.");
                      setStatus('error');
                      break;
                  }
                  const newPlan: StoredPlan = {userId: user.uid, ...(result.content.data as GeneratePlanFromTextOutput), id: `plan-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), transcription: result.transcription || '' };
                  setActiveContent({type: 'plan', data: newPlan});
                  savePlan(newPlan);
                  setStatus('success'); setActiveTab('plans');
              } else if (result.content?.type === 'itinerary' && result.content.data) {
                  if (!user) {
                      setErrorMessage("You must be logged in to create an itinerary.");
                      setStatus('error');
                      break;
                  }
                  const newItinerary: StoredItinerary = {userId: user.uid, ...(result.content.data as GenerateItineraryFromTextOutput), id: `itinerary-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), transcription: result.transcription || '' };
                  setActiveContent({type: 'itinerary', data: newItinerary});
                  saveItinerary(newItinerary);
                  setStatus('success'); setActiveTab('itineraries');
              } else {
                  setErrorMessage("Sorry, I couldn't determine whether to create a plan or an itinerary. Please try again."); setStatus('error');
              }
              break;
            }
            case 'updatePlan': {
                if (activeContent?.type !== 'plan') break;
                const result = await updatePlanFromVoice({ audioDataUri, existingPlan: activeContent.data });
                if (!result) {
                    setErrorMessage('An unexpected response was received from the server.');
                    setStatus('error');
                } else if (result.error) {
                    setErrorMessage(result.error); setStatus('error');
                } else if (result.updatedPlan) {
                    const updatedPlan: StoredPlan = { ...activeContent.data, ...result.updatedPlan, updatedAt: new Date().toISOString(), transcription: result.transcription || '' };
                    savePlan(updatedPlan);
                    setStatus('success');
                }
                break;
            }
            case 'updateItinerary': {
                if (activeContent?.type !== 'itinerary') break;
                const result = await updateItineraryFromVoice({ audioDataUri, existingItinerary: activeContent.data });
                if (!result) {
                    setErrorMessage('An unexpected response was received from the server.');
                    setStatus('error');
                } else if (result.error) {
                    setErrorMessage(result.error); setStatus('error');
                } else if (result.updatedItinerary) {
                    const updatedItinerary: StoredItinerary = { ...activeContent.data, ...result.updatedItinerary, updatedAt: new Date().toISOString(), transcription: result.transcription || '' };
                    saveItinerary(updatedItinerary);
                    setStatus('success');
                }
                break;
            }
            case 'subtask': {
               if (!activeTaskRef.current || activeContent?.type !== 'plan') break;
               const result = await addSubtasksFromVoice({ audioDataUri, existingTask: activeTaskRef.current });
               if (!result) {
                    setErrorMessage('An unexpected response was received from the server.');
                    setStatus('error');
               } else if (result.error) {
                  setErrorMessage(result.error); setStatus('error');
               } else if (result.updatedTask) {
                  const newActivePlan = { ...activeContent.data };
                  newActivePlan.categories = newActivePlan.categories.map(c => ({...c, tasks: c.tasks.map(t => t.id === result.updatedTask?.id ? result.updatedTask : t)}));
                  newActivePlan.updatedAt = new Date().toISOString();
                  savePlan(newActivePlan);
                  setStatus('success');
               }
               break;
            }
          }
        };
      });
      mediaRecorderRef.current.stop();
    }
  };
  

  const handleTaskStatusChange = (categoryIndex: number, taskIndex: number, newStatus: TaskStatus) => {
    if (activeContent?.type !== 'plan') return;
    const updatedPlan = { ...activeContent.data };
    const task = updatedPlan.categories[categoryIndex].tasks[taskIndex];
    if (newStatus === 'Done' && task.status !== 'Done') setConfettiTrigger({ id: task.id, timestamp: Date.now() });
    task.status = newStatus;
    updatedPlan.updatedAt = new Date().toISOString();
    savePlan(updatedPlan);
  };
  
  const handleSubTaskStatusChange = (categoryIndex: number, taskIndex: number, subTaskIndex: number, completed: boolean) => {
    if (activeContent?.type !== 'plan') return;
    const updatedPlan = { ...activeContent.data };
    if (updatedPlan.categories[categoryIndex].tasks[taskIndex].subtasks) {
        const subtask = updatedPlan.categories[categoryIndex].tasks[taskIndex].subtasks![subTaskIndex];
        if(completed && !subtask.completed) setConfettiTrigger({ id: subtask.id, timestamp: Date.now() });
        subtask.completed = completed;
        updatedPlan.updatedAt = new Date().toISOString();
        savePlan(updatedPlan);
    }
  };

  const handleEditTitle = (content: StoredPlan | StoredItinerary) => {
    setEditingId(content.id); setEditingTitle(content.title);
  };

  const handleSaveTitle = () => {
    if (!editingId) return;
    if(activeTab === 'plans' && activeContent?.type === 'plan') {
        const updatedPlan = { ...activeContent.data, title: editingTitle, updatedAt: new Date().toISOString() };
        savePlan(updatedPlan);
    } else if (activeTab === 'itineraries' && activeContent?.type === 'itinerary') {
        const updatedItinerary = { ...activeContent.data, title: editingTitle, updatedAt: new Date().toISOString() };
        saveItinerary(updatedItinerary);
    }
    setEditingId(null); setEditingTitle('');
  };

  const resetToIdle = () => {
    setStatus('idle'); setActiveContent(null); setErrorMessage('');
  };
  
  const handleSelectPlanFromHistory = (plan: StoredPlan) => {
    setActiveContent({type: 'plan', data: plan}); setStatus('success'); setActiveTab('plans');
  }

  const handleSelectItineraryFromHistory = (itinerary: StoredItinerary) => {
    setActiveContent({type: 'itinerary', data: itinerary}); setStatus('success'); setActiveTab('itineraries');
  }
  
  const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    if (!firestore || !user) return;

    setPlanHistory(prev => prev.filter(p => p.id !== planId));
    if (activeContent?.data.id === planId) resetToIdle();
    
    const planRef = doc(firestore, `users/${user.uid}/plans`, planId);
    deleteDoc(planRef).catch(async (serverError) => {
        if(user) fetchHistoryFromFirestore(user.uid); // Refetch to restore optimistic update
        const permissionError = new FirestorePermissionError({
            path: planRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  const handleDeleteItinerary = async (e: React.MouseEvent, itineraryId: string) => {
    e.stopPropagation();
    if (!firestore || !user) return;
    
    setItineraryHistory(prev => prev.filter(i => i.id !== itineraryId));
    if (activeContent?.data.id === itineraryId) resetToIdle();

    const itineraryRef = doc(firestore, `users/${user.uid}/itineraries`, itineraryId);
    deleteDoc(itineraryRef).catch(async (serverError) => {
        if(user) fetchHistoryFromFirestore(user.uid); // Refetch to restore optimistic update
        const permissionError = new FirestorePermissionError({
            path: itineraryRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  }

  return (
    <MainLayout
      user={user}
      isAuthReady={!isUserLoading}
      planHistory={planHistory}
      itineraryHistory={itineraryHistory}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onSelectPlan={handleSelectPlanFromHistory}
      onSelectItinerary={handleSelectItineraryFromHistory}
      onDeletePlan={handleDeletePlan}
      onDeleteItinerary={handleDeleteItinerary}
      appTheme={appTheme}
      toggleTheme={toggleTheme}
      colorTheme={colorTheme}
      setColorTheme={setColorTheme}
      isSettingsOpen={isSettingsOpen}
      setIsSettingsOpen={setIsSettingsOpen}
      isAuthDialogOpen={isAuthDialogOpen}
      setIsAuthDialogOpen={setIsAuthDialogOpen}
      notificationsEnabled={notificationsEnabled}
      onNotificationToggle={handleNotificationToggle}
      isInstallable={isInstallable}
      onInstall={promptInstall}
      status={status}
      activeContent={activeContent}
      errorMessage={errorMessage}
      setStatus={setStatus}
      recordingModeRef={recordingModeRef}
      handleStopRecording={handleStopRecording}
      handleStartRecording={handleStartRecording}
      audioStream={audioStream.current}
      handleTaskStatusChange={handleTaskStatusChange}
      handleSubTaskStatusChange={handleSubTaskStatusChange}
      editingId={editingId}
      editingTitle={editingTitle}
      setEditingTitle={setEditingTitle}
      handleEditTitle={handleEditTitle}
      handleSaveTitle={handleSaveTitle}
      resetToIdle={resetToIdle}
      toast={toast}
      confettiTrigger={confettiTrigger}
      saveItinerary={saveItinerary}
    />
  );
}

export default function Home() {
    return (
        <FirebaseClientProvider>
            <HomePageContent />
        </FirebaseClientProvider>
    )
}
