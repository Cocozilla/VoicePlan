
'use client';

import { Plane, Edit, Send, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { StoredItinerary } from '@/app/types';
import { format, parseISO, isValid } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface ItineraryViewProps {
    itinerary: StoredItinerary;
    editingId?: string | null;
    editingTitle?: string;
    setEditingTitle?: (title: string) => void;
    handleEditTitle?: (content: StoredItinerary) => void;
    handleSaveTitle?: () => void;
    handleTitleKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    resetToIdle?: () => void;
    handleShare?: () => void;
}

export function ItineraryView({
    itinerary,
    editingId,
    editingTitle,
    setEditingTitle,
    handleEditTitle,
    handleSaveTitle,
    handleTitleKeyDown,
    resetToIdle,
    handleShare,
}: ItineraryViewProps) {

    const isEditable = handleEditTitle && handleSaveTitle && setEditingTitle && handleTitleKeyDown;
    const showFooter = resetToIdle && handleShare;

    return (
        <Card className="w-full max-w-2xl shadow-xl animate-in fade-in zoom-in-95 border-0 md:border md:rounded-lg">
            <CardHeader className="p-4 md:p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 group">
                        <div className="flex items-center gap-2 text-xl md:text-2xl">
                            <Plane className="text-primary size-5 md:size-6" />
                            {isEditable && editingId === itinerary.id ? (
                                <Input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onBlur={handleSaveTitle}
                                    onKeyDown={handleTitleKeyDown}
                                    className="text-xl md:text-2xl font-semibold p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                    autoFocus
                                />
                            ) : (
                                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                                    {itinerary.title}
                                    {isEditable && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleEditTitle(itinerary)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardTitle>
                            )}
                        </div>
                        <CardDescription className="text-xs md:text-sm">
                            {itinerary.startDate && isValid(parseISO(itinerary.startDate)) && itinerary.endDate && isValid(parseISO(itinerary.endDate)) ? (
                                `${format(parseISO(itinerary.startDate), "MMMM d, yyyy")} - ${format(parseISO(itinerary.endDate), "MMMM d, yyyy")}`
                            ) : (
                                'Invalid date range'
                            )}
                        </CardDescription>
                    </div>
                     <div className="text-xs text-muted-foreground text-right shrink-0 ml-2 md:ml-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span className='hidden md:inline'>Created: {new Date(itinerary.createdAt).toLocaleDateString()}</span>
                                    <span className='md:hidden'>{new Date(itinerary.createdAt).toLocaleDateString()}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Last updated: {new Date(itinerary.updatedAt).toLocaleString()}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 md:pt-0">
                <Accordion type="multiple" defaultValue={itinerary.days.map(d => `day-${d.day}`)} className="w-full">
                    {itinerary.days.map((day, dayIndex) => (
                        <AccordionItem value={`day-${day.day}`} key={`day-${day.day}`} className="border-b-0">
                             <div className="flex items-center group/day bg-muted/30 md:bg-transparent rounded-md md:rounded-none">
                                <AccordionTrigger className="text-lg font-semibold px-4 py-3 md:px-0 md:py-4 flex-1">
                                    <div className='flex items-center gap-2 w-full'>
                                        <span>Day {day.day}:</span>
                                        <span className='flex-1 text-left'>{day.title}</span>
                                    </div>
                                </AccordionTrigger>
                            </div>
                            <AccordionContent>
                                <ul className="space-y-4 pt-2">
                                    {day.activities.map((activity) => (
                                        <li key={activity.id} className="flex items-start gap-4 pl-4">
                                            <div className="w-12 text-right text-sm font-medium text-primary shrink-0">
                                                <span>
                                                    {activity.time}
                                                </span>
                                            </div>
                                            <div className="relative w-full">
                                                <div className="absolute left-[-1.3rem] top-0 h-full w-px bg-border"></div>
                                                <div className="absolute left-[-1.5rem] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background"></div>
                                                <div className="pl-2">
                                                    <div className="font-medium flex items-center gap-2">
                                                        {activity.emoji && <span className="text-lg">{activity.emoji}</span>}
                                                        <span>
                                                            {activity.description}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="capitalize mt-1">{activity.type}</Badge>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
            {showFooter && (
                <CardFooter className="flex justify-center items-center gap-2 p-4 md:p-6">
                    <Button variant="outline" onClick={resetToIdle}>
                        <Plus className="mr-2 h-4 w-4" />
                        New
                    </Button>
                    <Button onClick={handleShare}>
                        <Send className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
