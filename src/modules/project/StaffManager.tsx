"use client";

import React, { useState } from 'react';
import { useProjectStore, Staff } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Pencil, Trash2, Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function StaffManager() {
    const { staff, addStaff, updateStaff, removeStaff } = useProjectStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Partial<Staff> | null>(null);

    const handleSave = () => {
        if (!editingStaff?.name) return;

        if (editingStaff.id) {
            updateStaff(editingStaff.id, editingStaff);
        } else {
            addStaff({
                name: editingStaff.name,
                role: editingStaff.role || 'Staff',
                dayRate: Number(editingStaff.dayRate) || 0,
                daysAssigned: 0,
                email: editingStaff.email || ''
            });
        }
        setIsDialogOpen(false);
        setEditingStaff(null);
    };

    const handleEdit = (staff: Staff) => {
        setEditingStaff({ ...staff });
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingStaff({
            name: '',
            role: 'Operator',
            dayRate: 35000,
            email: ''
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("このスタッフを削除してもよろしいですか？")) {
            removeStaff(id);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" /> スタッフ一覧
                </h3>
                <Button onClick={handleAddNew} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> 新規スタッフ登録
                </Button>
            </div>

            <div className="border rounded-md overflow-hidden bg-white dark:bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>名前</TableHead>
                            <TableHead>役割</TableHead>
                            <TableHead className="text-right">日当 (目安)</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    スタッフが登録されていません
                                </TableCell>
                            </TableRow>
                        ) : (
                            staff.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.name}</TableCell>
                                    <TableCell>{s.role}</TableCell>
                                    <TableCell className="text-right">¥{s.dayRate?.toLocaleString()}</TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                                            <Trash2 className="h-4 w-4 text-red-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStaff?.id ? 'スタッフ編集' : '新規スタッフ登録'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">名前</Label>
                            <Input id="name" value={editingStaff?.name || ''} onChange={(e) => setEditingStaff(p => ({ ...p, name: e.target.value }))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">役割</Label>
                            <Input id="role" value={editingStaff?.role || ''} onChange={(e) => setEditingStaff(p => ({ ...p, role: e.target.value }))} className="col-span-3" placeholder="Dir, Cam, Sound..." />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="rate" className="text-right">日当</Label>
                            <Input id="rate" type="number" value={editingStaff?.dayRate || ''} onChange={(e) => setEditingStaff(p => ({ ...p, dayRate: Number(e.target.value) }))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" type="email" value={editingStaff?.email || ''} onChange={(e) => setEditingStaff(p => ({ ...p, email: e.target.value }))} className="col-span-3" />
                        </div>
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
