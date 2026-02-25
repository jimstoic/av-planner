"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Save, CloudUpload, Search, Monitor, Box, Download, Upload } from 'lucide-react';
import { equipmentService } from '@/services/equipmentService';
import { Equipment } from '@/types/equipment';
import { initialEquipment } from '@/data/initialEquipment';
import { getCategoryColor } from '@/constants/colors';
import { Badge } from '@/components/ui/badge';
import { EquipmentForm } from '@/components/library/EquipmentForm';


export function EquipmentMasterView() {
    const { data: session } = useSession();
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit/Create State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<Equipment> | null>(null);

    useEffect(() => {
        if (session?.accessToken) {
            loadMasterList();
        }
    }, [session]);

    const loadMasterList = async () => {
        if (!session?.accessToken) return;
        setIsLoading(true);
        try {
            const list = await equipmentService.fetchMasterEquipmentList(session.accessToken);
            setEquipmentList(list);
        } catch (e) {
            console.error(e);
            toast.error("機材マスターの読み込みに失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveList = async () => {
        if (!session?.accessToken) return;
        if (!confirm("現在のリストで共有マスターを上書き更新しますか？")) return;

        setIsLoading(true);
        try {
            await equipmentService.saveMasterEquipmentList(session.accessToken, equipmentList);
            toast.success("共有マスターに保存しました");
        } catch (e) {
            console.error(e);
            toast.error("保存に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(equipmentList, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "equipment_master_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        toast.success("マスターデータをJSON形式で書き出しました");
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json)) {
                    setEquipmentList(json);
                    setIsDirty(true);
                    toast.success(`JSONから ${json.length} 件のデータを取り込みました（保存ボタンで確定してください）`);
                } else {
                    toast.error("無効なJSON形式です。配列形式である必要があります。");
                }
            } catch (err) {
                toast.error("JSONのパースに失敗しました");
            }
        };
        reader.readAsText(file);
    };

    const [isDirty, setIsDirty] = useState(false);

    const handleImportSeed = async () => {
        if (!confirm("注意：Excelから取り込んだ初期データで現在のリストを完全に上書きしてもよろしいですか？\n※既存のデータは削除されます。")) return;

        setIsLoading(true);
        try {
            // Use locally imported initialEquipment
            const seedData = initialEquipment;
            setEquipmentList(seedData);
            setIsDirty(true);

            if (session?.accessToken) {
                await equipmentService.saveMasterEquipmentList(session.accessToken, seedData);
                toast.success(`初期データ(${seedData.length}件)を取り込み、保存しました`);
            } else {
                toast.warning("データはロードされましたが、保存にはログインが必要です");
            }
        } catch (e) {
            console.error(e);
            toast.error("Import failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveItem = (item: Equipment) => {
        setEquipmentList(prev => {
            if (item.id && prev.find(p => p.id === item.id)) {
                // Update
                return prev.map(p => p.id === item.id ? item : p);
            } else {
                // Add
                return [...prev, item];
            }
        });
        setIsDialogOpen(false);
        setEditingItem(null);
    };

    const filteredList = equipmentList.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Box className="w-6 h-6 text-primary" /> 機材マスター管理
                    </h2>
                    <p className="text-muted-foreground">全てのプロジェクトで共有される機材リストを管理します</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportSeed} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                        <CloudUpload className="mr-2 h-4 w-4" /> Excelデータ取込
                    </Button>
                    <Button variant="outline" onClick={loadMasterList} disabled={isLoading}>
                        <Search className="mr-2 h-4 w-4" /> 再読み込み
                    </Button>
                    <Button onClick={handleSaveList} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        マスターを保存
                    </Button>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="機材名・メーカーで検索"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-muted p-1 rounded-lg gap-1 border">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleExportJSON}>
                            <Download className="mr-2 h-3 w-3" /> Export JSON
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleImportJSON}
                            />
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                                <Upload className="mr-2 h-3 w-3" /> Import JSON
                            </Button>
                        </div>
                    </div>
                    <Button onClick={() => {
                        setEditingItem({});
                        setIsDialogOpen(true);
                    }}>
                        <Plus className="mr-2 h-4 w-4" /> 新規登録
                    </Button>
                </div>
            </div>

            <div className="border rounded-md overflow-hidden bg-white dark:bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>機材名</TableHead>
                            <TableHead>メーカー</TableHead>
                            <TableHead>カテゴリー</TableHead>
                            <TableHead>保管場所</TableHead>
                            <TableHead className="text-center">I/O</TableHead>
                            <TableHead className="text-right">参考単価</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    {isLoading ? "読み込み中..." : "機材が登録されていません"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredList.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.manufacturer}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.majorCategory || 'other')}`}>
                                            {item.majorCategory}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground capitalize">
                                        {item.storageLocation || '-'}
                                    </TableCell>
                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        {item.inputPortCount} In / {item.outputPortCount} Out
                                    </TableCell>
                                    <TableCell className="text-right">¥{item.dayRate?.toLocaleString()}</TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsDialogOpen(true); }}>
                                            <Pencil className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            if (confirm(`${item.name} を削除しますか？`)) {
                                                setEquipmentList(prev => prev.filter(i => i.id !== item.id));
                                            }
                                        }}>
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
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem?.id ? '機材編集 (Master)' : '新規機材登録 (Master)'}</DialogTitle>
                    </DialogHeader>

                    <EquipmentForm
                        initialData={editingItem || {}}
                        onSave={handleSaveItem}
                        onCancel={() => setIsDialogOpen(false)}
                        isDialog={true}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
