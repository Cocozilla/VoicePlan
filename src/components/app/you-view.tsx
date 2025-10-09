
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { StoredPlan, StoredItinerary, Task, ItineraryActivity, GenerateUserInsightsOutput } from '@/app/types';
import { ChartContainer, ChartTooltip, ChartTooltipContent, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserInsights } from '@/app/actions';
import { Lightbulb, CalendarDays, Zap, CalendarCheck, Plane, CheckSquare } from 'lucide-react';
import { format, parseISO, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';
import { Badge } from '../ui/badge';

interface YouViewProps {
    planHistory: StoredPlan[];
    itineraryHistory: StoredItinerary[];
}

type AgendaItem = {
    date: Date;
    title: string;
    type: 'task' | 'itinerary';
    source: string; // e.g., "Project Plan" or "Trip to Tokyo"
    data: Task | ItineraryActivity;
};


export function YouView({ planHistory, itineraryHistory }: YouViewProps) {
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<GenerateUserInsightsOutput | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(true);
    const [agenda, setAgenda] = useState<AgendaItem[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // This effect runs only once on the client side after the component mounts
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Don't run any of this logic until the component has mounted on the client
        if (!isClient) {
            return;
        }

        if (planHistory.length > 0 || itineraryHistory.length > 0) {
            setLoading(false);
            fetchInsights();
            generateAgenda();
        } else {
             setLoading(false);
             setInsightsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isClient, planHistory, itineraryHistory]);

    const fetchInsights = async () => {
        setInsightsLoading(true);
        const result = await fetchUserInsights({ planHistory, itineraryHistory });
        if (result.insights) {
            setInsights(result.insights);
        }
        setInsightsLoading(false);
    };

    const generateAgenda = () => {
        const today = startOfDay(new Date());
        const nextSevenDays = { start: today, end: endOfDay(addDays(today, 6)) };
        let items: AgendaItem[] = [];

        // Process Plans
        planHistory.forEach(plan => {
            plan.categories.forEach(category => {
                category.tasks.forEach(task => {
                    if (task.deadline) {
                        try {
                            // Use new Date() for more flexible parsing of formats like "September 11th"
                            const deadlineDate = new Date(task.deadline);
                             if (!isNaN(deadlineDate.getTime()) && isWithinInterval(startOfDay(deadlineDate), nextSevenDays)) {
                                items.push({
                                    date: deadlineDate,
                                    title: task.task,
                                    type: 'task',
                                    source: plan.title,
                                    data: task,
                                });
                            }
                        } catch (e) {
                            console.warn(`Could not parse date from task deadline: ${task.deadline}`);
                        }
                    }
                });
            });
        });

        // Process Itineraries
        itineraryHistory.forEach(itinerary => {
            try {
                const itineraryStartDate = parseISO(itinerary.startDate);
                itinerary.days.forEach(day => {
                    // Calculate the date for each specific day in the itinerary
                    const dayDate = addDays(itineraryStartDate, day.day - 1);
                    if (isWithinInterval(startOfDay(dayDate), nextSevenDays)) {
                        day.activities.forEach(activity => {
                            items.push({
                                date: dayDate,
                                title: activity.description,
                                type: 'itinerary',
                                source: itinerary.title,
                                data: activity,
                            });
                        });
                    }
                });
            } catch (e) {
                 console.warn(`Invalid date format for itinerary startDate: ${itinerary.startDate}`);
            }
        });

        // Sort items chronologically
        items.sort((a, b) => a.date.getTime() - b.date.getTime());
        setAgenda(items);
    }

    const taskStatusData = () => {
        const statuses: { [key: string]: number } = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };
        planHistory.forEach(plan => {
            plan.categories.forEach(cat => {
                cat.tasks.forEach(task => {
                    if(task.status) {
                        statuses[task.status]++;
                    }
                });
            });
        });
        return Object.entries(statuses).map(([name, value]) => ({ name, value }));
    }

    const chartData = taskStatusData();
    const chartConfig = {
        value: { label: "Tasks", color: "hsl(var(--foreground))" },
        "To Do": { label: "To Do", color: "hsl(var(--destructive))" },
        "In Progress": { label: "In Progress", color: "hsl(var(--accent))" },
        "Done": { label: "Done", color: "hsl(var(--primary))" },
    }

    if (loading) {
        return (
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
    }

    if (!planHistory.length && !itineraryHistory.length) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                <h2 className="text-2xl font-semibold">No Data Yet</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    Create a few plans or itineraries, and your personalized insights will appear here!
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-4xl p-4 sm:p-0 animate-in fade-in-50">
            <div className='mb-4'>
                <h1 className="text-3xl font-bold">Your Dashboard</h1>
                <p className="text-muted-foreground">A look at your productivity and planning habits.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{chartData.find(d => d.name === 'Done')?.value || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            across {planHistory.length} total plans
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trips Planned</CardTitle>
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{itineraryHistory.length}</div>
                        <p className="text-xs text-muted-foreground">
                           Ready for your next adventure?
                        </p>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarCheck className="text-primary" />
                         What's Next
                    </CardTitle>
                    <CardDescription>Your agenda for the next 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    {agenda.length > 0 ? (
                        <div className="space-y-4">
                            {agenda.map((item, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="font-semibold text-sm">{format(item.date, 'MMM')}</div>
                                        <div className="text-xl font-bold text-primary">{format(item.date, 'd')}</div>
                                    </div>
                                    <div className="w-full pl-4 border-l-2 border-border">
                                         <div className="flex items-center gap-2 font-semibold">
                                            {item.type === 'task' ? <CheckSquare className="h-4 w-4 text-muted-foreground" /> : <Plane className="h-4 w-4 text-muted-foreground" />}
                                            <span>{item.title}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            From: {item.source}
                                        </p>
                                        {item.type === 'itinerary' && 'time' in item.data && (
                                            <Badge variant="outline" className="mt-2">
                                                {(item.data as ItineraryActivity).time}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Your schedule for the next week is clear!</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="text-primary" />
                            AI Insights
                        </CardTitle>
                        <CardDescription>Personalized feedback from your AI assistant.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {insightsLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-5 w-3/5" />
                            </div>
                        ) : (
                            <ul className="space-y-3 text-sm text-foreground/90">
                            {insights?.insights.map((insight, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="mt-0.5">{insight.emoji}</span>
                                    <span>{insight.text}</span>
                                </li>
                            ))}
                            {insights?.productivityPeak && (
                                    <li className="flex items-start gap-3 font-medium">
                                        <span className="mt-0.5">🚀</span>
                                        <span>Your most productive day seems to be <span className="text-primary">{insights.productivityPeak}</span>!</span>
                                    </li>
                            )}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Task Status Breakdown</CardTitle>
                        <CardDescription>
                        A look at the current status of all your tasks.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    tickLine={false} 
                                    axisLine={false}
                                    tickMargin={10}
                                />
                                <ChartTooltip 
                                    cursor={false} 
                                    content={<ChartTooltipContent 
                                        indicator="dot" 
                                        hideLabel 
                                    />} 
                                />
                                <Bar dataKey="value" layout="vertical" radius={5}>
                                    {chartData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
                                    ))}\
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
