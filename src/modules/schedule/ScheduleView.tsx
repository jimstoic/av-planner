import React, { useState, useMemo } from 'react';
import { useProjectStore, ScheduleItem, Staff } from '@/store/projectStore';
import { format, addDays, differenceInDays, isSameDay, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, Clock, User, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { StaffManager } from '@/modules/project/StaffManager';

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

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<ScheduleItem> | null>(null);

    // Calculate timeline range (Project Start - 1 day to Project End + 1 day)
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
            {/* Header */}

            <div className="border-b p-4 flex justify-between items-center bg-muted/20">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">スケジュール</h2>
                    <p className="text-sm text-muted-foreground">プロジェクトの進行管理とスタッフ配置</p>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <User className="mr-2 h-4 w-4" /> スタッフ管理
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                            <StaffManager />
                        </DialogContent>
                    </Dialog>
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" /> スケジュール追加
                    </Button>
                </div>
            </div>

            {/* Gantt Area */}
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
                                    <span className="text-muted-foreground">{format(day, 'vip', { locale: ja })}</span>
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
