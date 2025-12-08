'use client';

import { useMemo, useState } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, format } from 'date-fns';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
    projects: any[];
}

export function TimelineView({ projects }: TimelineViewProps) {
    // Default to December 2025 as per mock data
    const [currentMonth, setCurrentMonth] = useState(new Date(2025, 11, 1));

    const daysInMonth = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth)
        });
    }, [currentMonth]);

    return (
        <div className="h-full flex flex-col border rounded-md bg-background shadow-sm overflow-hidden relative">
            {/* Using Radix Primitive directly to control Viewport/Scrollbar placement */}
            <ScrollArea.Root className="w-full h-full overflow-hidden bg-white dark:bg-zinc-950">
                <ScrollArea.Viewport className="w-full h-full rounded-[inherit]">
                    <div className="min-w-fit flex flex-col">

                        {/* Timeline Header (Dates) */}
                        <div className="flex border-b bg-muted/40 sticky top-0 z-20">
                            <div className="w-48 shrink-0 p-3 font-bold text-sm border-r flex items-center bg-card sticky left-0 z-30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                                {format(currentMonth, 'MMMM yyyy')}
                            </div>
                            <div className="flex">
                                {daysInMonth.map((day) => (
                                    <div
                                        key={day.toString()}
                                        className={cn(
                                            "w-12 h-12 flex flex-col items-center justify-center border-r text-xs shrink-0 select-none",
                                            (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/30"
                                        )}
                                    >
                                        <span className="font-semibold">{format(day, 'd')}</span>
                                        <span className="text-[10px] text-muted-foreground">{format(day, 'E')}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline Body (Projects) */}
                        <div className="flex-1">
                            {projects.map((project) => (
                                <div key={project.id} className="flex border-b hover:bg-muted/10 transition-colors h-14 items-center group relative">
                                    {/* Project Name Label (Sticky Left) */}
                                    <div className="w-48 shrink-0 p-3 h-full border-r bg-background/95 sticky left-0 z-10 flex items-center justify-between border-r-2 group-hover:bg-background shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
                                        <span className="truncate text-sm font-medium">{project.projectName}</span>
                                    </div>

                                    {/* Timeline Bars */}
                                    <div className="flex">
                                        {daysInMonth.map((day) => {
                                            const start = parseISO(String(project.startDate));
                                            const end = parseISO(String(project.endDate));
                                            const isStart = isSameDay(day, start);
                                            const isEnd = isSameDay(day, end);
                                            const isDuring = isWithinInterval(day, { start, end });

                                            if (isDuring) {
                                                return (
                                                    <div key={day.toString()} className="w-12 shrink-0 h-14 relative flex items-center justify-center p-0.5">
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "h-8 w-full cursor-pointer transition-all hover:brightness-110",
                                                                        isStart && "rounded-l-md ml-1",
                                                                        isEnd && "rounded-r-md mr-1",
                                                                        !isStart && !isEnd && "rounded-none",
                                                                        project.status === 'confirmed' ? "bg-blue-500" : "bg-amber-500",
                                                                        "opacity-90 hover:opacity-100"
                                                                    )}
                                                                />
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" side="top">
                                                                <ProjectCard project={project} />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={day.toString()}
                                                    className={cn(
                                                        "w-12 shrink-0 h-14 border-r border-dashed border-gray-100 dark:border-gray-800",
                                                        (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/20"
                                                    )}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea.Viewport>

                {/* Horizontal Scrollbar */}
                <ScrollArea.Scrollbar orientation="horizontal" className="flex select-none touch-none p-0.5 bg-zinc-100 transition-colors duration-[160ms] ease-out hover:bg-zinc-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
                    <ScrollArea.Thumb className="flex-1 bg-zinc-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                </ScrollArea.Scrollbar>

                {/* Vertical Scrollbar */}
                <ScrollArea.Scrollbar orientation="vertical" className="flex select-none touch-none p-0.5 bg-zinc-100 transition-colors duration-[160ms] ease-out hover:bg-zinc-200 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5">
                    <ScrollArea.Thumb className="flex-1 bg-zinc-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
                </ScrollArea.Scrollbar>

                <ScrollArea.Corner className="bg-zinc-200" />
            </ScrollArea.Root>
        </div>
    );
}
