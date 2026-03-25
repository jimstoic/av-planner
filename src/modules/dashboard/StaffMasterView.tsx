"use client";

import React, { useState } from 'react';
import { useStaffMasterStore, StaffMaster } from '@/store/staffMasterStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

export function StaffMasterView() {
    const { masterStaff, addMasterStaff, updateMasterStaff, removeMasterStaff } = useStaffMasterStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Partial<StaffMaster> | null>(null);

    const handleOpen = (staff?: StaffMaster) => {
        setEditing(staff ? { ...staff } : { name: '', dayRate: 0, email: '' });
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!editing?.name) {
            toast.error('名前は必須です');
            return;
        }
        if (editing.id) {
            updateMasterStaff(editing.id, editing);
            toast.success('スタッフ情報を更新しました');
        } else {
            addMasterStaff({
                name: editing.name,
                dayRate: editing.dayRate || 0,
                email: editing.email || '',
                phone: editing.phone || '',
            });
            toast.success(`${editing.name} をマスターに登録しました`);
        }
        setIsDialogOpen(false);
        setEditing(null);
    };

    const handleDelete = (staff: StaffMaster) => {
        if (!confirm(`「${staff.name}」をマスターから削除しますか？\nプロジェクトにアサイン済みのデータには影響しません。`)) return;
        removeMasterStaff(staff.id);
        toast.success(`${staff.name} を削除しました`);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" /> スタッフマスター
                </h2>
                <p className="text-muted-foreground mt-1 text-lg">
                    プロジェクト横断で使用するスタッフの共通データを管理します
                </p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>登録スタッフ一覧</CardTitle>
                        <CardDescription>
                            プロジェクトでアサインする際にこのリストから選択できます
                        </CardDescription>
                    </div>
                    <Button onClick={() => handleOpen()}>
                        <Plus className="mr-2 h-4 w-4" /> 新規登録
                    </Button>
                </CardHeader>
                <CardContent>
                    {masterStaff.length === 0 ? (
                        <div className="py-16 text-center border-2 border-dashed rounded-lg">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground text-sm mb-4">
                                スタッフがまだ登録されていません
                            </p>
                            <Button variant="outline" onClick={() => handleOpen()}>
                                <Plus className="mr-2 h-4 w-4" /> 最初のスタッフを登録
                            </Button>
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>名前</TableHead>
                                        <TableHead className="text-right">日当</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {masterStaff.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell className="font-medium">{s.name}</TableCell>
                                            <TableCell className="text-right font-mono">
                                                ¥{s.dayRate.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {s.email || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleOpen(s)}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleDelete(s)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing?.id ? 'スタッフ編集' : 'スタッフ新規登録'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">名前 *</Label>
                            <Input
                                className="col-span-3"
                                value={editing?.name || ''}
                                onChange={(e) => setEditing(p => ({ ...p, name: e.target.value }))}
                                placeholder="山田 太郎"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">日当 (¥)</Label>
                            <Input
                                type="number"
                                className="col-span-3"
                                value={editing?.dayRate || ''}
                                onChange={(e) => setEditing(p => ({ ...p, dayRate: e.target.value === '' ? 0 : Number(e.target.value) }))}
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Email</Label>
                            <Input
                                type="email"
                                className="col-span-3"
                                value={editing?.email || ''}
                                onChange={(e) => setEditing(p => ({ ...p, email: e.target.value }))}
                                placeholder="taro@example.com"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">電話番号</Label>
                            <Input
                                className="col-span-3"
                                value={editing?.phone || ''}
                                onChange={(e) => setEditing(p => ({ ...p, phone: e.target.value }))}
                                placeholder="090-0000-0000"
                            />
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
