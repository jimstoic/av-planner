"use client";

import React, { useState } from 'react';
import { useProjectStore, Staff } from '@/store/projectStore';
import { useStaffMasterStore } from '@/store/staffMasterStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Pencil, Trash2, UserPlus, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function StaffManager() {
    const { staff, addStaff, updateStaff, removeStaff } = useProjectStore();
    const { masterStaff } = useStaffMasterStore();

    // State for master-select dialog
    const [isMasterSelectOpen, setIsMasterSelectOpen] = useState(false);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    // State for manual-add / edit dialog
    const [isManualDialogOpen, setIsManualDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<Staff> | null>(null);

    // ---- Master select (checkbox) ----
    const assignedMasterIds = new Set(
        staff
            .map(s => masterStaff.find(m => m.name === s.name && m.role === s.role)?.id)
            .filter(Boolean) as string[]
    );

    const handleOpenMasterSelect = () => {
        setCheckedIds(new Set(assignedMasterIds));
        setIsMasterSelectOpen(true);
    };

    const toggleCheck = (id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleApplyMasterSelect = () => {
        // Add newly checked staff
        masterStaff.forEach(m => {
            if (checkedIds.has(m.id) && !assignedMasterIds.has(m.id)) {
                addStaff({
                    name: m.name,
                    role: m.role,
                    dayRate: m.dayRate,
                    daysAssigned: 0,
                    email: m.email || '',
                });
            }
        });

        // Remove unchecked staff that were previously assigned from master
        staff.forEach(s => {
            const master = masterStaff.find(m => m.name === s.name && m.role === s.role);
            if (master && !checkedIds.has(master.id)) {
                removeStaff(s.id);
            }
        });

        const added = masterStaff.filter(m => checkedIds.has(m.id) && !assignedMasterIds.has(m.id)).length;
        const removed = staff.filter(s => {
            const master = masterStaff.find(m => m.name === s.name && m.role === s.role);
            return master && !checkedIds.has(master.id);
        }).length;

        if (added > 0 || removed > 0) {
            toast.success(`スタッフを更新しました（+${added} / -${removed}）`);
        }
        setIsMasterSelectOpen(false);
    };

    // ---- Manual add/edit ----
    const handleOpenManual = (s?: Staff) => {
        setEditingStaff(s ? { ...s } : { name: '', role: '', dayRate: 0, email: '' });
        setIsManualDialogOpen(true);
    };

    const handleSaveManual = () => {
        if (!editingStaff?.name || !editingStaff?.role) {
            toast.error('名前と役割は必須です');
            return;
        }
        if (editingStaff.id) {
            updateStaff(editingStaff.id, editingStaff);
            toast.success('スタッフ情報を更新しました');
        } else {
            addStaff({
                name: editingStaff.name,
                role: editingStaff.role,
                dayRate: editingStaff.dayRate || 0,
                daysAssigned: 0,
                email: editingStaff.email || '',
            });
            toast.success(`${editingStaff.name} をアサインしました`);
        }
        setIsManualDialogOpen(false);
        setEditingStaff(null);
    };

    const isMasterStaff = (s: Staff) =>
        masterStaff.some(m => m.name === s.name && m.role === s.role);

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {masterStaff.length > 0 ? (
                    <Button size="sm" onClick={handleOpenMasterSelect}>
                        <Users className="mr-2 h-4 w-4" />
                        マスターから選択
                    </Button>
                ) : (
                    <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        スタッフマスター未登録 — ダッシュボードの「管理ツール」から登録してください
                    </div>
                )}
                <Button size="sm" variant="outline" onClick={() => handleOpenManual()}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    手動追加
                </Button>
            </div>

            {/* Assigned Staff Table */}
            <div className="border rounded-md overflow-hidden bg-white dark:bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>名前</TableHead>
                            <TableHead>役割</TableHead>
                            <TableHead className="text-right">日当</TableHead>
                            <TableHead className="w-[110px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                                    アサインされたスタッフがいません
                                </TableCell>
                            </TableRow>
                        ) : (
                            staff.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {s.name}
                                            {isMasterStaff(s) && (
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">M</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{s.role}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        ¥{s.dayRate.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleOpenManual(s)}
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => {
                                                    if (confirm(`${s.name} のアサインを解除しますか？`)) removeStaff(s.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Master Select Dialog (Checkbox) */}
            <Dialog open={isMasterSelectOpen} onOpenChange={setIsMasterSelectOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>スタッフをアサイン</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 max-h-[400px] overflow-y-auto space-y-1">
                        {masterStaff.map((m) => (
                            <label
                                key={m.id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                                <Checkbox
                                    checked={checkedIds.has(m.id)}
                                    onCheckedChange={() => toggleCheck(m.id)}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{m.name}</div>
                                    <div className="text-xs text-muted-foreground">{m.role}</div>
                                </div>
                                <div className="text-sm font-mono text-muted-foreground shrink-0">
                                    ¥{m.dayRate.toLocaleString()}/日
                                </div>
                            </label>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMasterSelectOpen(false)}>
                            キャンセル
                        </Button>
                        <Button onClick={handleApplyMasterSelect}>
                            適用（{checkedIds.size}名）
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manual Add / Edit Dialog */}
            <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingStaff?.id ? 'スタッフ編集' : '手動でスタッフ追加'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">名前 *</Label>
                            <Input
                                className="col-span-3"
                                value={editingStaff?.name || ''}
                                onChange={(e) => setEditingStaff(p => ({ ...p, name: e.target.value }))}
                                placeholder="山田 太郎"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">役割 *</Label>
                            <Input
                                className="col-span-3"
                                value={editingStaff?.role || ''}
                                onChange={(e) => setEditingStaff(p => ({ ...p, role: e.target.value }))}
                                placeholder="Director, Camera, Sound..."
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">日当 (¥)</Label>
                            <Input
                                type="number"
                                className="col-span-3"
                                value={editingStaff?.dayRate || ''}
                                onChange={(e) => setEditingStaff(p => ({ ...p, dayRate: e.target.value === '' ? 0 : Number(e.target.value) }))}
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input
                                type="email"
                                className="col-span-3"
                                value={editingStaff?.email || ''}
                                onChange={(e) => setEditingStaff(p => ({ ...p, email: e.target.value }))}
                                placeholder="taro@example.com"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManualDialogOpen(false)}>
                            キャンセル
                        </Button>
                        <Button onClick={handleSaveManual}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
