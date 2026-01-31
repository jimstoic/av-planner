import React, { useState, useMemo, useEffect } from 'react';
import { useProjectStore, ScheduleItem, Staff } from '@/store/projectStore';
import { format, addDays, differenceInDays, isSameDay, startOfDay, isWithinInterval } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, User, Trash2, ChevronLeft, ChevronRight, Globe, Layers, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { StaffManager } from '@/modules/project/StaffManager';
import { schedulerService, ProjectSummary } from '@/services/schedulerService';

export function ScheduleView() {
    const {
        startDate,
        endDate,
        schedule,
        staff,
        addScheduleItem,
        updateScheduleItem,
        removeScheduleItem
    } = useProjectStore();

    const [viewMode, setViewMode] = useState<'project' | 'global'>('project');
    const [globalTab, setGlobalTab] = useState<'timeline' | 'staff' | 'equipment'>('timeline');
    const [globalProjects, setGlobalProjects] = useState<ProjectSummary[]>([]);
    const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);

    // Mock token retrieval
    const getAccessToken = () => {
        return (window as any).gapi?.auth?.getToken()?.access_token || '';
    };

    useEffect(() => {
        if (viewMode === 'global' && globalProjects.length === 0) {
            const fetchGlobal = async () => {
                setIsLoadingGlobal(true);
                try {
                    const token = getAccessToken();
                    if (token) {
                        const projects = await schedulerService.fetchAllProjects(token);
                        setGlobalProjects(projects);
                    } else {
                        console.warn("No access token found for global fetch");
                        // In a real app, maybe redirect to login or show detailed error
                    }
                } catch (error) {
                    console.error("Failed to load global projects", error);
                    // toast.error("Global schedule load failed")
                } finally {
                    setIsLoadingGlobal(false);
                }
            };
            fetchGlobal();
        }
    }, [viewMode]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ScheduleItem> | null>(null);

    // Calculate timeline range
    const timelineStart = useMemo(() => addDays(startOfDay(startDate), -1), [startDate]);
    const timelineEnd = useMemo(() => addDays(startOfDay(endDate), 1), [endDate]);
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;

    // Helper to get position and width percentage
    const getPositionStyle = (start: Date, end: Date) => {
        const startDiff = differenceInDays(startOfDay(start), timelineStart);
        const duration = differenceInDays(startOfDay(end), startOfDay(start)) + 1; // Inclusive

        const left = (startDiff / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        return { left: `${left}%`, width: `${width}%` };
    };

    // Generate days array for header
    const days = useMemo(() => {
        const arr = [];
        for (let i = 0; i < totalDays; i++) {
            arr.push(addDays(timelineStart, i));
        }
        return arr;
    }, [timelineStart, totalDays]);

    const handleSave = () => {
        if (!editingItem?.title || !editingItem.start || !editingItem.end) return;

        if (editingItem.id) {
            updateScheduleItem(editingItem.id, editingItem);
        } else {
            addScheduleItem({
                title: editingItem.title,
                type: editingItem.type || 'other',
                start: editingItem.start,
                end: editingItem.end,
                description: editingItem.description || '',
                assignedStaffIds: editingItem.assignedStaffIds || []
            });
        }
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const handleAddNew = () => {
        setEditingItem({
            title: '',
            type: 'setup',
            start: startDate,
            end: startDate,
            assignedStaffIds: []
        });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: ScheduleItem) => {
        setEditingItem({ ...item });
        setIsDialogOpen(true);
    };

    return (
        <div className="flex flex-col h-full w-full bg-background">
            {/* Header / Tabs */}
            <div className="border-b bg-muted/20 px-4 py-2 flex justify-between items-center">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'project' | 'global')} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="project">
                            <Layers className="w-4 h-4 mr-2" />
                            Project Schedule
                        </TabsTrigger>
                        <TabsTrigger value="global">
                            <Globe className="w-4 h-4 mr-2" />
                            Global Overview
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {viewMode === 'project' && (
                    <div className="flex gap-2">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <User className="mr-2 h-4 w-4" /> スタッフ管理
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <StaffManager />
                            </DialogContent>
                        </Dialog>
                        <Button size="sm" onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" /> 追加
                        </Button>
                    </div>
                )}
            </div>

            {viewMode === 'global' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="border-b px-4 py-2 bg-background">
                        <Tabs value={globalTab} onValueChange={(v) => setGlobalTab(v as any)} className="w-auto">
                            <TabsList>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="staff">Staff Availability</TabsTrigger>
                                <TabsTrigger value="equipment">Equipment Usage</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        {isLoadingGlobal ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading all projects...
                            </div>
                        ) : (
                            <div className="min-w-[1000px] border rounded-lg bg-card shadow-sm overflow-hidden">
                                {globalTab === 'timeline' && <GlobalTimeline projects={globalProjects} />}
                                {globalTab === 'staff' && <GlobalStaffView projects={globalProjects} />}
                                {globalTab === 'equipment' && <GlobalEquipmentView projects={globalProjects} />}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Gantt Area (Project Mode) */}
            {viewMode === 'project' && (
                <div className="flex-1 overflow-auto p-4 relative">
                    <div className="min-w-[800px] border rounded-lg bg-card shadow-sm overflow-hidden">
                        {/* Timeline Header */}
                        <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                            <div className="w-48 p-4 font-semibold text-sm border-r bg-muted/50 shrink-0 sticky left-0 z-20">
                                タスク / イベント
                            </div>
                            <div className="flex-1 flex relative">
                                {days.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "flex-1 min-w-[60px] border-r p-2 text-center text-xs flex flex-col justify-center",
                                            isSameDay(day, new Date()) && "bg-blue-50/50"
                                        )}
                                    >
                                        <span className="font-semibold">{format(day, 'M/d')}</span>
                                        <span className="text-muted-foreground">{format(day, 'E', { locale: ja })}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timeline Body */}
                        <div className="results-container relative min-h-[400px]">
                            {/* Grid Lines Background */}
                            <div className="absolute inset-0 flex ml-48 pointer-events-none">
                                {days.map((_, i) => (
                                    <div key={i} className="flex-1 border-r h-full opacity-20" />
                                ))}
                            </div>

                            {/* Project Duration Indicator */}
                            <div className="flex border-b hover:bg-muted/10 transition-colors h-12 items-center relative group">
                                <div className="w-48 px-4 font-medium text-sm border-r shrink-0 sticky left-0 bg-background group-hover:bg-muted/10 z-10 flex items-center">
                                    📽️ プロジェクト期間
                                </div>
                                <div className="flex-1 relative h-full">
                                    <div
                                        className="absolute top-2 bottom-2 rounded-md bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-xs font-bold text-primary truncate px-2"
                                        style={getPositionStyle(startDate, endDate)}
                                    >
                                        Overall Duration
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Items */}
                            {schedule.map((item) => (
                                <div key={item.id} className="flex border-b hover:bg-muted/10 transition-colors h-14 items-center relative group">
                                    <div className="w-48 px-4 py-2 border-r shrink-0 sticky left-0 bg-background group-hover:bg-muted/10 z-10">
                                        <div className="font-medium text-sm truncate">{item.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {item.assignedStaffIds?.length || 0} p
                                        </div>
                                    </div>

                                    <div className="flex-1 relative h-full cursor-pointer" onClick={() => handleEdit(item)}>
                                        <div
                                            className={cn(
                                                "absolute top-2 bottom-2 rounded-md flex px-2 items-center text-xs font-semibold shadow-sm transition-all hover:brightness-110",
                                                item.type === 'setup' && "bg-amber-100 text-amber-800 border-amber-300",
                                                item.type === 'rehearsal' && "bg-purple-100 text-purple-800 border-purple-300",
                                                item.type === 'show' && "bg-red-100 text-red-800 border-red-300",
                                                item.type === 'strike' && "bg-slate-100 text-slate-800 border-slate-300",
                                                item.type === 'other' && "bg-blue-100 text-blue-800 border-blue-300",
                                            )}
                                            style={getPositionStyle(item.start, item.end)}
                                        >
                                            <span className="truncate">{item.description || item.type.toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Empty State Help */}
                            {schedule.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    スケジュールが登録されていません。<br />右上の追加ボタンから登録してください。
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem?.id ? 'スケジュール編集' : 'スケジュール追加'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">タイトル</Label>
                            <Input id="title" value={editingItem?.title || ''} onChange={(e) => setEditingItem(prev => ({ ...prev, title: e.target.value }))} className="col-span-3" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">種別</Label>
                            <Select value={editingItem?.type} onValueChange={(v: "setup" | "rehearsal" | "show" | "strike" | "other") => setEditingItem(prev => ({ ...prev, type: v }))}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="setup">Setup (仕込み)</SelectItem>
                                    <SelectItem value="rehearsal">Rehearsal (リハ)</SelectItem>
                                    <SelectItem value="show">Show (本番)</SelectItem>
                                    <SelectItem value="strike">Strike (撤収)</SelectItem>
                                    <SelectItem value="other">Other (その他)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">期間</Label>
                            <div className="col-span-3 flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editingItem?.start && "text-muted-foreground")}>
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {editingItem?.start ? format(editingItem.start, "PPP") : "Start Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent mode="single" selected={editingItem?.start} onSelect={(date) => setEditingItem(prev => ({ ...prev, start: date || new Date() }))} initialFocus />
                                    </PopoverContent>
                                </Popover>

                                <span className="flex items-center text-muted-foreground">→</span>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editingItem?.end && "text-muted-foreground")}>
                                            <Calendar className="mr-2 h-4 w-4" />
                                            {editingItem?.end ? format(editingItem.end, "PPP") : "End Date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarComponent mode="single" selected={editingItem?.end} onSelect={(date) => setEditingItem(prev => ({ ...prev, end: date || new Date() }))} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">詳細</Label>
                            <Input value={editingItem?.description || ''} onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))} className="col-span-3" placeholder="備考など" />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4 border-t pt-4">
                            <Label className="text-right pt-2">スタッフ割当</Label>
                            <div className="col-span-3 space-y-2 max-h-32 overflow-y-auto border p-2 rounded-md">
                                {staff && staff.length > 0 ? staff.map(s => (
                                    <div key={s.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`staff-${s.id}`}
                                            checked={editingItem?.assignedStaffIds?.includes(s.id)}
                                            onCheckedChange={(checked) => {
                                                const current = editingItem?.assignedStaffIds || [];
                                                if (checked) {
                                                    setEditingItem(prev => ({ ...prev, assignedStaffIds: [...current, s.id] }));
                                                } else {
                                                    setEditingItem(prev => ({ ...prev, assignedStaffIds: current.filter(id => id !== s.id) }));
                                                }
                                            }}
                                        />
                                        <label htmlFor={`staff-${s.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            {s.name} <span className="text-xs text-muted-foreground">({s.role})</span>
                                        </label>
                                    </div>
                                )) : (
                                    <div className="text-xs text-muted-foreground">スタッフが登録されていません。<br />見積もり画面等からスタッフを追加してください。</div>
                                )}
                            </div>
                        </div>

                        {editingItem?.id && (
                            <div className="flex justify-end pt-4">
                                <Button variant="destructive" size="sm" onClick={() => { removeScheduleItem(editingItem.id!); setIsDialogOpen(false); }}>
                                    <Trash2 className="h-4 w-4 mr-2" /> 削除
                                </Button>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Sub-components for Global View

function GlobalTimeline({ projects }: { projects: ProjectSummary[] }) {
    // Determine overall range
    const allDates = projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
    const minDate = allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date();
    const maxDate = allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : addDays(new Date(), 30);

    // Add buffer
    const start = addDays(startOfDay(minDate), -2);
    const end = addDays(startOfDay(maxDate), 5);
    const days = differenceInDays(end, start) + 1;

    // Helper
    const getStyle = (s: Date, e: Date) => {
        const sDiff = differenceInDays(startOfDay(new Date(s)), start);
        const dur = differenceInDays(startOfDay(new Date(e)), startOfDay(new Date(s))) + 1;
        return {
            left: `${(sDiff / days) * 100}%`,
            width: `${(dur / days) * 100}%`
        };
    };

    return (
        <div className="relative">
            {/* Header Dates */}
            <div className="flex border-b bg-muted/50 sticky top-0 z-10 w-full">
                <div className="w-48 p-2 border-r bg-muted/50 shrink-0 sticky left-0 z-20 font-bold text-sm flex items-center">
                    Project Name
                </div>
                <div className="flex-1 relative h-10">
                    {/* Simplified Date Axis */}
                    <div className="absolute inset-0 flex">
                        {Array.from({ length: Math.ceil(days / 7) }).map((_, i) => (
                            <div key={i} className="flex-1 border-r text-xs p-1 text-muted-foreground mr-0">
                                {format(addDays(start, i * 7), 'M/d')}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rows */}
            <div className="bg-white dark:bg-card min-h-[400px]">
                {projects.map(p => (
                    <div key={p.id} className="flex border-b h-12 items-center hover:bg-muted/5 relative">
                        <div className="w-48 px-4 py-1 border-r shrink-0 sticky left-0 bg-background z-10 truncate text-sm font-medium" title={p.name}>
                            {p.name}
                        </div>
                        <div className="flex-1 relative h-full">
                            {/* Project Bar */}
                            <div
                                className="absolute top-2 bottom-2 bg-blue-500 rounded-md shadow-sm flex items-center px-2 text-white text-xs overflow-hidden"
                                style={getStyle(p.startDate, p.endDate)}
                            >
                                {p.venue}
                            </div>

                            {/* Milestones? */}
                            {p.schedule.map(s => (
                                <div
                                    key={s.id}
                                    className="absolute top-3 bottom-3 bg-white/30 border border-white/50 rounded-sm"
                                    style={getStyle(s.start, s.end)}
                                    title={s.title}
                                />
                            ))}
                        </div>
                    </div>
                ))}
                {projects.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">No projects found.</div>
                )}
            </div>
        </div>
    );
}

function GlobalStaffView({ projects }: { projects: ProjectSummary[] }) {
    // Unique staff list across all projects
    const allStaff = new Map<string, Staff>();
    projects.forEach(p => {
        p.staff.forEach(s => {
            if (!allStaff.has(s.id)) allStaff.set(s.id, s);
        });
    });

    const staffList = Array.from(allStaff.values());

    // Range (similar to timeline, maybe just next 30 days default?)
    const today = startOfDay(new Date());
    const end = addDays(today, 30);
    const days = 31;

    return (
        <div>
            <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                <div className="w-48 p-2 border-r z-20 sticky left-0 font-bold text-sm">Staff Member</div>
                <div className="flex-1 flex">
                    {Array.from({ length: days }).map((_, i) => (
                        <div key={i} className={`flex-1 min-w-[30px] border-r text-center text-[10px] p-1 ${isSameDay(addDays(today, i), new Date()) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                            {format(addDays(today, i), 'd')}
                        </div>
                    ))}
                </div>
            </div>

            {staffList.map(s => (
                <div key={s.id} className="flex border-b h-10 items-center hover:bg-muted/5">
                    <div className="w-48 px-4 border-r shrink-0 sticky left-0 bg-background z-10 text-sm truncate">
                        {s.name} <span className="text-xs text-muted-foreground">({s.role})</span>
                    </div>
                    <div className="flex-1 flex h-full relative">
                        {/* Show assignments */}
                        {projects.map(p => {
                            // Check if this staff is in this project
                            const projectStaff = p.staff.find(ps => ps.id === s.id || ps.name === s.name); // Fallback to name match
                            if (!projectStaff) return null;

                            // Calculate overlap with view range
                            const pStart = new Date(p.startDate);
                            const pEnd = new Date(p.endDate);

                            // Simple intersection check
                            if (pEnd < today || pStart > end) return null;

                            const barStart = pStart < today ? today : pStart;
                            const barEnd = pEnd > end ? end : pEnd;

                            const left = (differenceInDays(barStart, today) / days) * 100;
                            const width = (differenceInDays(barEnd, barStart) + 1 / days) * 100;

                            return (
                                <div
                                    key={p.id}
                                    className="absolute top-1 bottom-1 bg-purple-500/80 rounded px-1 text-[10px] text-white overflow-hidden text-center flex items-center justify-center opacity-80 hover:opacity-100 hover:z-10 cursor-help"
                                    style={{
                                        left: `${left}%`,
                                        width: `${(differenceInDays(barEnd, barStart) + 1) / days * 100}%`
                                    }}
                                    title={`${p.name}: ${format(pStart, 'M/d')}-${format(pEnd, 'M/d')}`}
                                >
                                    {p.name.slice(0, 5)}...
                                </div>
                            );
                        })}

                        {/* Grid lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {Array.from({ length: days }).map((_, i) => (
                                <div key={i} className="flex-1 border-r opacity-10" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
            {staffList.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No staff found in projects.</div>
            )}
        </div>
    );
}

function GlobalEquipmentView({ projects }: { projects: ProjectSummary[] }) {
    // 1. Identify all unique equipment IDs used
    const usageMap = new Map<string, { projectId: string; projectName: string; start: Date; end: Date }[]>();

    projects.forEach(p => {
        p.equipmentIds.forEach(eqId => {
            const list = usageMap.get(eqId) || [];
            list.push({
                projectId: p.id,
                projectName: p.name,
                start: new Date(p.startDate),
                end: new Date(p.endDate)
            });
            usageMap.set(eqId, list);
        });
    });

    // Filter to show only items with potential conflicts (or all?)
    const sortedEquipment = Array.from(usageMap.entries()).sort((a, b) => b[1].length - a[1].length);

    // Range: Next 30 days
    const today = startOfDay(new Date());
    const end = addDays(today, 30);
    const days = 31;

    return (
        <div>
            <div className="p-2 text-sm text-muted-foreground bg-amber-50 border-b">
                Note: Showing usage based on Project Duration. Potential conflicts highlighted in Red.
            </div>
            <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                <div className="w-48 p-2 border-r z-20 sticky left-0 font-bold text-sm">Equipment ID</div>
                <div className="flex-1 flex">
                    {Array.from({ length: days }).map((_, i) => (
                        <div key={i} className="flex-1 min-w-[30px] border-r text-center text-[10px] p-1">
                            {format(addDays(today, i), 'd')}
                        </div>
                    ))}
                </div>
            </div>

            {sortedEquipment.map(([eqId, usages]) => (
                <div key={eqId} className="flex border-b h-10 items-center hover:bg-muted/5">
                    <div className="w-48 px-4 border-r shrink-0 sticky left-0 bg-background z-10 text-xs font-mono truncate" title={eqId}>
                        {eqId}
                    </div>
                    <div className="flex-1 flex h-full relative">
                        {/* Usages */}
                        {usages.map((u, idx) => {
                            if (u.end < today || u.start > end) return null;

                            const barStart = u.start < today ? today : u.start;
                            const barEnd = u.end > end ? end : u.end;

                            // Check conflict
                            const isConflict = usages.some(other =>
                                other.projectId !== u.projectId &&
                                other.end >= u.start &&
                                other.start <= u.end
                            );

                            return (
                                <div
                                    key={u.projectId + idx}
                                    className={cn(
                                        "absolute top-1 bottom-1 rounded px-1 text-[8px] text-white overflow-hidden text-center flex items-center justify-center border border-white/20",
                                        isConflict ? "bg-red-500/80 z-20" : "bg-green-500/60"
                                    )}
                                    style={{
                                        left: `${(differenceInDays(barStart, today) / days) * 100}%`,
                                        width: `${(differenceInDays(barEnd, barStart) + 1) / days * 100}%`
                                    }}
                                    title={`${u.projectName} (${isConflict ? 'CONFLICT' : 'OK'})`}
                                >
                                    {u.projectName.slice(0, 3)}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            {sortedEquipment.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No equipment usage found.</div>
            )}
        </div>
    );
}
