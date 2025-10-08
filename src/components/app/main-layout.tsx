
'use client';

import React from 'react';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/app-sidebar';
import { MobileHeader } from '@/components/app/mobile-header';
import { AppContent } from '@/components/app/app-content';
import type { StoredPlan, StoredItinerary, AppTheme, ColorTheme, ActiveContent, TaskStatus, ConfettiTrigger, Task } from '@/ai/schemas';
import type { User } from 'firebase/auth';

type Status = 'idle' | 'recording' | 'processing' | 'success' | 'error';
type RecordingMode = 'newContent' | 'subtask' | 'updatePlan' | 'updateItinerary';

// This is now a purely presentational component.
// All state and logic are managed in `src/app/page.tsx`.
interface MainLayoutProps {
    user: User | null;
    isAuthReady: boolean;
    planHistory: StoredPlan[];
    itineraryHistory: StoredItinerary[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onSelectPlan: (plan: StoredPlan) => void;
    onSelectItinerary: (itinerary: StoredItinerary) => void;
    onDeletePlan: (e: React.MouseEvent, planId: string) => void;
    onDeleteItinerary: (e: React.MouseEvent, itineraryId: string) => void;
    appTheme: AppTheme;
    toggleTheme: () => void;
    colorTheme: ColorTheme;
    setColorTheme: (theme: ColorTheme) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    isAuthDialogOpen: boolean;
    setIsAuthDialogOpen: (isOpen: boolean) => void;
    notificationsEnabled: boolean;
    onNotificationToggle: () => void;
    isInstallable: boolean;
    onInstall: () => void;
    status: Status;
    activeContent: ActiveContent;
    errorMessage: string;
    setStatus: (status: Status) => void;
    recordingModeRef: React.MutableRefObject<RecordingMode>;
    handleStopRecording: () => void;
    handleStartRecording: (mode: RecordingMode, task?: Task) => void;
    audioStream: MediaStream | null;
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
    saveItinerary: (itinerary: StoredItinerary) => Promise<void>;
}


export function MainLayout(props: MainLayoutProps) {
    return (
        <>
            <Sidebar>
                <AppSidebar 
                    user={props.user}
                    planHistory={props.planHistory}
                    itineraryHistory={props.itineraryHistory}
                    onSelectPlan={props.onSelectPlan}
                    onSelectItinerary={props.onSelectItinerary}
                    onDeletePlan={props.onDeletePlan}
                    onDeleteItinerary={props.onDeleteItinerary}
                    activeTab={props.activeTab}
                    setActiveTab={props.setActiveTab}
                    isSettingsOpen={props.isSettingsOpen}
                    setIsSettingsOpen={props.setIsSettingsOpen}
                    isAuthDialogOpen={props.isAuthDialogOpen}
                    setIsAuthDialogOpen={props.setIsAuthDialogOpen}
                    colorTheme={props.colorTheme}
                    setColorTheme={props.setColorTheme}
                    appTheme={props.appTheme}
                    toggleTheme={props.toggleTheme}
                    notificationsEnabled={props.notificationsEnabled}
                    onNotificationToggle={props.onNotificationToggle}
                    isInstallable={props.isInstallable} 
                    onInstall={props.onInstall}
                />
            </Sidebar>
            <SidebarInset>
                <main className="flex min-h-screen w-full flex-col items-center justify-start md:justify-center p-0 md:p-4 pb-20 md:pb-4 relative overflow-hidden">
                    <div 
                        className="absolute inset-0 z-0 opacity-50"
                        style={{
                        backgroundImage: 'radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 25%), radial-gradient(circle at 75% 75%, hsl(var(--accent)) 0%, transparent 25%)',
                        animation: 'swirl 15s ease-in-out infinite',
                        }}
                    />
                    <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
                    
                    <div className="z-10 flex flex-col items-center justify-center text-center w-full h-full p-4">
                       <AppContent
                            status={props.status}
                            activeContent={props.activeContent}
                            errorMessage={props.errorMessage}
                            setStatus={props.setStatus}
                            recordingModeRef={props.recordingModeRef}
                            handleStopRecording={props.handleStopRecording}
                            handleStartRecording={props.handleStartRecording}
                            activeTab={props.activeTab}
                            setActiveTab={props.setActiveTab}
                            audioStream={props.audioStream}
                            planHistory={props.planHistory}
                            itineraryHistory={props.itineraryHistory}
                            handleTaskStatusChange={props.handleTaskStatusChange}
                            handleSubTaskStatusChange={props.handleSubTaskStatusChange}
                            editingId={props.editingId}
                            editingTitle={props.editingTitle}
                            setEditingTitle={props.setEditingTitle}
                            handleEditTitle={props.handleEditTitle}
                            handleSaveTitle={props.handleSaveTitle}
                            resetToIdle={props.resetToIdle}
                            toast={props.toast}
                            confettiTrigger={props.confettiTrigger}
                            user={props.user}
                            isAuthReady={props.isAuthReady}
                            saveItinerary={props.saveItinerary}
                        />
                    </div>

                    <MobileHeader 
                        user={props.user}
                        setIsAuthDialogOpen={props.setIsAuthDialogOpen}
                    />
                </main>
            </SidebarInset>
        </>
    )
}
