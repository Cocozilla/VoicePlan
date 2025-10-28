
'use client';

import { BrainCircuit, Edit, Calendar, User, Building, Bell, MoreVertical, Plus, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { StoredPlan, TaskStatus, ConfettiTrigger } from '@/app/types';
import type { Task } from '@/ai/schemas';
import { Confetti } from '../ui/confetti';

type RecordingMode = 'newContent' | 'subtask' | 'updatePlan' | 'updateItinerary';

interface PlanViewProps {
    plan: StoredPlan;
    handleTaskStatusChange?: (categoryIndex: number, taskIndex: number, newStatus: TaskStatus) => void;
    handleSubTaskStatusChange?: (categoryIndex: number, taskIndex: number, subTaskIndex: number, completed: boolean) => void;
    handleStartRecording?: (mode: RecordingMode, task?: Task) => void;
    editingId?: string | null;
    editingTitle?: string;
    setEditingTitle?: (title: string) => void;
    handleEditTitle?: (content: StoredPlan) => void;
    handleSaveTitle?: () => void;
    handleTitleKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    resetToIdle?: () => void;
    handleShare?: () => void;
    confettiTrigger?: ConfettiTrigger;
}

export function PlanView({
    plan,
    handleTaskStatusChange,
    handleSubTaskStatusChange,
    handleStartRecording,
    editingId,
    editingTitle,
    setEditingTitle,
    handleEditTitle,
    handleSaveTitle,
    handleTitleKeyDown,
    resetToIdle,
    handleShare,
    confettiTrigger
}: PlanViewProps) {
    const isEditable = handleEditTitle && handleSaveTitle && setEditingTitle && handleTitleKeyDown;
    const isInteractive = handleTaskStatusChange && handleSubTaskStatusChange && handleStartRecording;
    const showFooter = resetToIdle && handleShare;

    const getPriorityBadgeVariant = (priority: 'High' | 'Medium' | 'Low' | undefined) => {
        switch (priority) {
            case 'High': return 'destructive';
            case 'Medium': return 'secondary';
            default: return 'outline';
        }
    };

    const getStatusBadgeVariant = (status: TaskStatus | undefined) => {
        switch (status) {
            case 'Done': return 'default';
            case 'In Progress': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <Card className="w-full max-w-2xl shadow-xl animate-in fade-in zoom-in-95 border-0 md:border md:rounded-lg">
            <CardHeader className="p-4 md:p-6">
                <div className="flex justify-between items-start">
                    <div className="flex-1 group">
                        <div className="flex items-center gap-2 text-xl md:text-2xl">
                            <BrainCircuit className="text-primary size-5 md:size-6" />
                            {isEditable && editingId === plan.id ? (
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
                                    {plan.title}
                                    {isEditable && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleEditTitle(plan)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </CardTitle>
                            )}
                        </div>
                        <CardDescription className="text-xs md:text-sm">
                            {plan.summary}
                        </CardDescription>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0 ml-2 md:ml-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <span className='hidden md:inline'>Created: {new Date(plan.createdAt).toLocaleDateString()}</span>
                                    <span className='md:hidden'>{new Date(plan.createdAt).toLocaleDateString()}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Last updated: {new Date(plan.updatedAt).toLocaleString()}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 md:p-6 md:pt-0">
                <Accordion type="multiple" defaultValue={plan.categories.map(c => c.category)} className="w-full">
                    {plan.categories.map((category, catIndex) => (
                        <AccordionItem value={category.category} key={`${category.category}-${catIndex}`} className="border-b-0">
                            <AccordionTrigger className="text-lg font-semibold px-4 py-3 md:px-0 md:py-4 bg-muted/30 md:bg-transparent">
                                {category.category}
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-0 md:space-y-2">
                                    {category.tasks.map((task, taskIndex) => (
                                        <li key={task.id || taskIndex} className="md:p-4 md:bg-muted/50 md:rounded-lg">
                                            <Collapsible>
                                                <div className="flex items-start gap-3 p-4 md:p-0">
                                                    <div className="relative">
                                                        <Checkbox
                                                            id={`task-${catIndex}-${taskIndex}`}
                                                            className='mt-1'
                                                            checked={task.status === 'Done'}
                                                            onCheckedChange={(checked) => isInteractive && handleTaskStatusChange(catIndex, taskIndex, checked ? 'Done' : 'To Do')}
                                                            disabled={!isInteractive}
                                                        />
                                                         {confettiTrigger?.id === task.id && <Confetti key={confettiTrigger.timestamp} />}
                                                    </div>
                                                    <div className='flex-1'>
                                                        <label
                                                            htmlFor={`task-${catIndex}-${taskIndex}`}
                                                            className={cn("font-medium text-base flex items-start gap-3", isInteractive ? 'cursor-pointer': 'cursor-default', task.status === 'Done' && 'line-through text-muted-foreground')}
                                                        >
                                                            {task.emoji && <span className="text-xl mt-[-2px]">{task.emoji}</span>}
                                                            <span>{task.task}</span>
                                                        </label>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground pl-8 mt-2">
                                                            {task.deadline && <div className="flex items-center gap-1.5"><Calendar className="size-4" /> {task.deadline}</div>}
                                                            {task.people && task.people.length > 0 && <div className="flex items-center gap-1.5"><User className="size-4" /> {task.people.join(', ')}</div>}
                                                            {task.organizations && task.organizations.length > 0 && <div className="flex items-center gap-1.5"><Building className="size-4" /> {task.organizations.join(', ')}</div>}
                                                            {task.reminder && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="flex items-center gap-1.5 text-primary cursor-default">
                                                                                <Bell className="size-4" /> {task.reminder.time}
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Reminder: {task.reminder.question}</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isInteractive && (
                                                        <div className="flex flex-col sm:flex-row gap-2 items-center ml-auto">
                                                            <div className="hidden md:flex gap-2">
                                                                {task.status && <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>}
                                                                {task.priority && <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>}
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleStartRecording('subtask', task)}>
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        Add Subtasks
                                                                    </DropdownMenuItem>
                                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                                        <CollapsibleTrigger asChild>
                                                                            <DropdownMenuItem>
                                                                                <MoreVertical className="mr-2 h-4 w-4" />
                                                                                View Subtasks
                                                                            </DropdownMenuItem>
                                                                        </CollapsibleTrigger>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    )}
                                                </div>
                                                <CollapsibleContent className="mt-4 px-4 pb-4 md:pl-8">
                                                    <p className="text-sm font-semibold mb-2">Subtasks:</p>
                                                    <ul className="space-y-3">
                                                        {task.subtasks?.map((sub, subIndex) => (
                                                            <li key={sub.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                                                <div className="relative">
                                                                    <Checkbox
                                                                        id={`subtask-${catIndex}-${taskIndex}-${subIndex}`}
                                                                        checked={sub.completed}
                                                                        onCheckedChange={(checked) => isInteractive && handleSubTaskStatusChange(catIndex, taskIndex, subIndex, !!checked)}
                                                                        disabled={!isInteractive}
                                                                    />
                                                                    {confettiTrigger?.id === sub.id && <Confetti key={confettiTrigger.timestamp} />}
                                                                </div>
                                                                <label
                                                                    htmlFor={`subtask-${catIndex}-${taskIndex}-${subIndex}`}
                                                                    className={cn("flex-1 text-sm", isInteractive ? 'cursor-pointer': 'cursor-default', sub.completed && 'line-through text-muted-foreground')}
                                                                >
                                                                    {sub.text}
                                                                </label>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CollapsibleContent>
                                            </Collapsible>
                                            <Separator className="md:hidden" />
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
