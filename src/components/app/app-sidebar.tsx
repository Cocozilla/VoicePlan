
'use client';

import { PanelLeft, Trash2, Settings, Sun, Moon, Bell, BellOff, Download, User as UserIcon, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import { format, parseISO, isValid } from 'date-fns';
import type { StoredPlan, StoredItinerary, ColorTheme } from '@/app/types';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


interface AppSidebarProps {
    user: User | null;
    planHistory: StoredPlan[];
    itineraryHistory: StoredItinerary[];
    onSelectPlan: (plan: StoredPlan) => void;
    onSelectItinerary: (itinerary: StoredItinerary) => void;
    onDeletePlan: (e: React.MouseEvent, planId: string) => void;
    onDeleteItinerary: (e: React.MouseEvent, itineraryId: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (isOpen: boolean) => void;
    isAuthDialogOpen: boolean;
    setIsAuthDialogOpen: (isOpen: boolean) => void;
    colorTheme: ColorTheme;
    setColorTheme: (theme: ColorTheme) => void;
    appTheme: 'light' | 'dark';
    toggleTheme: () => void;
    notificationsEnabled: boolean;
    onNotificationToggle: () => void;
    isInstallable: boolean;
    onInstall: () => void;
    onSignOut: () => void;
}

export function AppSidebar({
    user,
    planHistory,
    itineraryHistory,
    onSelectPlan,
    onSelectItinerary,
    onDeletePlan,
    onDeleteItinerary,
    activeTab,
    setActiveTab,
    isSettingsOpen,
    setIsSettingsOpen,
    isAuthDialogOpen,
    setIsAuthDialogOpen,
    colorTheme,
    setColorTheme,
    appTheme,
    toggleTheme,
    notificationsEnabled,
    onNotificationToggle,
    isInstallable,
    onInstall,
    onSignOut
}: AppSidebarProps) {
    const isMobile = useIsMobile();
    const showYouTab = planHistory.length > 0 || itineraryHistory.length > 0;
    
    const UserProfileButton = () => {
        if (!user) return null;

        if (user.isAnonymous) {
            return (
                <Button variant="ghost" onClick={() => setIsAuthDialogOpen(true)}>
                    <UserIcon className="mr-2"/>
                    Sign Up / Log In
                </Button>
            );
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                            <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <>
            <SidebarHeader>
                 <div className="flex items-center justify-between p-2">
                    <div className="font-semibold text-lg">VoicePlan</div>
                    {!isMobile && <UserProfileButton />}
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className={cn("w-full grid", showYouTab ? "grid-cols-3" : "grid-cols-2")}>
                        <TabsTrigger value="plans">Plans</TabsTrigger>
                        <TabsTrigger value="itineraries">Itineraries</TabsTrigger>
                        {showYouTab && (
                             <TabsTrigger value="you">You</TabsTrigger>
                        )}
                    </TabsList>
                    <TabsContent value="plans">
                        <SidebarMenu>
                            {planHistory.length > 0 ? (
                                planHistory.map(plan => (
                                    <SidebarMenuItem key={plan.id}>
                                        <SidebarMenuButton
                                            onClick={() => onSelectPlan(plan)}
                                            isActive={activeTab === 'plans'}
                                            className="h-auto py-2"
                                        >
                                            <div className="flex flex-col items-start text-left w-full">
                                                <span className="font-medium truncate w-full">
                                                    {plan.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(plan.createdAt).toLocaleString(undefined, {
                                                        weekday: 'long',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                        </SidebarMenuButton>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/menu-item:opacity-100"
                                            onClick={(e) => onDeletePlan(e, plan.id)}
                                        >
                                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </SidebarMenuItem>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                   {user ? 'No plans saved yet. Create one!' : 'Sign in to see your plans.'}
                                </div>
                            )}
                        </SidebarMenu>
                    </TabsContent>
                    <TabsContent value="itineraries">
                        <SidebarMenu>
                            {itineraryHistory.length > 0 ? (
                                itineraryHistory.map(itinerary => (
                                    <SidebarMenuItem key={itinerary.id}>
                                        <SidebarMenuButton
                                            onClick={() => onSelectItinerary(itinerary)}
                                            isActive={activeTab === 'itineraries'}
                                            className="h-auto py-2"
                                        >
                                            <div className="flex flex-col items-start text-left w-full">
                                                <span className="font-medium truncate w-full">
                                                    {itinerary.title}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {itinerary.startDate && isValid(parseISO(itinerary.startDate)) && itinerary.endDate && isValid(parseISO(itinerary.endDate)) ? (
                                                        <>
                                                            {format(parseISO(itinerary.startDate), "MMM d")} - {format(parseISO(itinerary.endDate), "MMM d, yyyy")}
                                                        </>
                                                    ) : (
                                                        'Invalid date'
                                                    )}
                                                </span>
                                            </div>
                                        </SidebarMenuButton>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover/menu-item:opacity-100"
                                            onClick={(e) => onDeleteItinerary(e, itinerary.id)}
                                        >
                                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </SidebarMenuItem>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    {user ? 'No itineraries created yet.' : 'Sign in to see your itineraries.'}
                                </div>
                            )}
                        </SidebarMenu>
                    </TabsContent>
                </Tabs>
                </SidebarContent>
            <SidebarFooter>
                 {isMobile && <UserProfileButton />}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start">
                            <Settings className="mr-2" />
                            Settings
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Settings</DialogTitle>
                            <DialogDescription>
                                Customize the look, feel, and notifications of your planner.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Color Theme</Label>
                                <RadioGroup
                                    value={colorTheme}
                                    onValueChange={(value) => setColorTheme(value as ColorTheme)}
                                    className="flex gap-4"
                                >
                                    <Label htmlFor="theme-purple" className="flex flex-col items-center gap-2 cursor-pointer">
                                        <RadioGroupItem value="purple" id="theme-purple" className="sr-only" />
                                        <div className={cn("h-12 w-12 rounded-full border-2", colorTheme === 'purple' && "border-ring")}>
                                            <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 to-violet-600" />
                                        </div>
                                        <span>Purple</span>
                                    </Label>
                                    <Label htmlFor="theme-mint" className="flex flex-col items-center gap-2 cursor-pointer">
                                        <RadioGroupItem value="mint" id="theme-mint" className="sr-only" />
                                        <div className={cn("h-12 w-12 rounded-full border-2", colorTheme === 'mint' && "border-ring")}>
                                            <div className="h-full w-full rounded-full bg-gradient-to-br from-green-300 to-teal-500" />
                                        </div>
                                        <span>Mint</span>
                                    </Label>
                                    <Label htmlFor="theme-red" className="flex flex-col items-center gap-2 cursor-pointer">
                                        <RadioGroupItem value="red" id="theme-red" className="sr-only" />
                                        <div className={cn("h-12 w-12 rounded-full border-2", colorTheme === 'red' && "border-ring")}>
                                            <div className="h-full w-full rounded-full bg-gradient-to-br from-red-400 to-rose-600" />
                                        </div>
                                        <span>Red</span>
                                    </Label>
                                    <Label htmlFor="theme-blue" className="flex flex-col items-center gap-2 cursor-pointer">
                                        <RadioGroupItem value="blue" id="theme-blue" className="sr-only" />
                                        <div className={cn("h-12 w-12 rounded-full border-2", colorTheme === 'blue' && "border-ring")}>
                                            <div className="h-full w-full rounded-full bg-gradient-to-br from-sky-400 to-blue-600" />
                                        </div>
                                        <span>Blue</span>
                                    </Label>
                                </RadioGroup>
                            </div>
                            <Separator />
                            <div className='flex items-center justify-between rounded-lg border p-4'>
                                <div className='space-y-0.5'>
                                    <Label>Dark Mode</Label>
                                    <p className='text-xs text-muted-foreground'>
                                        Toggle between light and dark themes.
                                    </p>
                                </div>
                                <Switch
                                    checked={appTheme === 'dark'}
                                    onCheckedChange={toggleTheme}
                                    aria-label="Toggle theme"
                                />
                            </div>
                            <div className='flex items-center justify-between rounded-lg border p-4'>
                                <div className='space-y-0.5'>
                                    <Label>Notifications</Label>
                                    <p className='text-xs text-muted-foreground'>
                                        Enable or disable push notifications.
                                    </p>
                                </div>
                                 <Switch
                                    checked={notificationsEnabled}
                                    onCheckedChange={onNotificationToggle}
                                    aria-label="Toggle notifications"
                                />
                            </div>
                            {isInstallable && (
                                <>
                                    <Separator />
                                    <Button variant="outline" className="w-full" onClick={onInstall}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Install App
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </SidebarFooter>
        </>
    );
}
