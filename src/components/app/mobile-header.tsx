
'use client';

import { User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { LogOut } from 'lucide-react';
import { signOutFromApp } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface MobileHeaderProps {
    user: User | null;
    setIsAuthDialogOpen: (isOpen: boolean) => void;
}

export function MobileHeader({ 
    user,
    setIsAuthDialogOpen,
}: MobileHeaderProps) {
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            await signOutFromApp();
            toast({
                description: "You have been signed out.",
            });
        } catch (error) {
            console.error("Sign out error", error);
            toast({
                variant: "destructive",
                title: "Sign Out Failed",
                description: "An error occurred while signing out.",
            });
        }
    };
    
    const UserProfileButton = () => {
        if (!user) return <Button variant="ghost" size="icon" />;

        if (user.isAnonymous) {
            return (
                <Button variant="ghost" size="icon" onClick={() => setIsAuthDialogOpen(true)}>
                    <UserIcon />
                </Button>
            );
        }

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                            <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

        );
    }
    
    return (
        <header className="md:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between bg-background/80 backdrop-blur-sm p-2 border-t">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">VoicePlan</h1>
            <UserProfileButton />
        </header>
    );
}
