"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipmentStore } from "@/store/equipmentStore";
import { useProjectStore } from "@/store/projectStore"; // Added
import { useProjectRegistryStore } from "@/store/projectRegistryStore"; // Added
import { Checkbox } from "@/components/ui/checkbox"; // Added
import { Plus, Trash2, RotateCcw, Save, ArrowLeft, AlertTriangle } from "lucide-react";
import { Equipment, EquipmentCategory, EquipmentSubCategory, Connector } from "@/types/equipment";
// PortCounter removed (inside EquipmentForm)
import { EquipmentForm } from '@/components/library/EquipmentForm';
import { getCategoryColor } from '@/constants/colors';
import { ReactFlowProvider } from '@xyflow/react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";



export function LibraryView() {
    const { equipment, addEquipment, updateEquipment, deleteEquipment, resetToDefault } = useEquipmentStore();
    const { selectedEquipmentIds, toggleEquipmentSelection, ...project } = useProjectStore(); // Get full project for dates
    const { checkAvailability } = useProjectRegistryStore();

    const [mode, setMode] = useState<'list' | 'edit'>('list');
    const [currentItem, setCurrentItem] = useState<Partial<Equipment>>({});

    const handleAddNew = () => {
        setMode('edit');
        setCurrentItem({
            id: `eq-${Date.now()}`,
            name: '',
            majorCategory: 'video',
            subCategory: 'camera',
            manufacturer: '',
            description: '',
            connectors: [],
            stockQuantity: 0,
            dayRate: 0,
        });
    };

    const handleEdit = (item: Equipment) => {
        setMode('edit');
        setCurrentItem({ ...item });
    };

    const handleSave = (finalItem: Equipment) => {
        const exists = equipment.find(e => e.id === finalItem.id);
        if (exists) {
            updateEquipment(finalItem.id, finalItem);
        } else {
            addEquipment(finalItem);
        }
        setMode('list');
    };

    if (mode === 'list') {
        return (
            <div className="p-6 h-full flex flex-col max-w-7xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">機材リスト</h2>
                    <div className="flex gap-2">
                        <Input placeholder="検索..." className="w-64" />
                        <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> 新規追加</Button>
                        <Button variant="ghost" onClick={resetToDefault} className="text-red-500">
                            <RotateCcw className="mr-2 h-4 w-4" /> 初期化
                        </Button>
                    </div>
                </div>

                <div className="flex-1 border rounded-md overflow-hidden bg-card shadow-sm">
                    <div className="overflow-y-auto h-full">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0 z-10">
                                <tr className="border-b">
                                    <th className="h-12 w-12 px-4 text-center">
                                        {/* Optional: Select All */}
                                    </th>
                                    <th className="h-12 px-4 text-left font-medium">機材名</th>
                                    <th className="h-12 px-4 text-left font-medium">メーカー</th>
                                    <th className="h-12 px-4 text-left font-medium">カテゴリ</th>
                                    <th className="h-12 px-4 text-left font-medium">保管場所</th>
                                    <th className="h-12 px-4 text-center font-medium">在庫</th>
                                    <th className="h-12 px-4 text-right font-medium">単価</th>
                                    <th className="h-12 px-4 text-center font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map((item) => {
                                    // Conflict Check
                                    const { available, remainingStock, conflictProjectNames } = checkAvailability(
                                        item.id,
                                        item.stockQuantity || 0,
                                        project.startDate,
                                        project.endDate,
                                        project.id
                                    );
                                    const isConflict = !available;

                                    return (
                                        <tr key={item.id} className={cn("border-b hover:bg-muted/50 transition-colors cursor-pointer", isConflict && "bg-red-50 dark:bg-red-900/10")} onClick={() => handleEdit(item)}>
                                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <Checkbox
                                                    checked={selectedEquipmentIds?.includes(item.id)}
                                                    onCheckedChange={() => toggleEquipmentSelection(item.id)}
                                                    disabled={isConflict && !selectedEquipmentIds?.includes(item.id)}
                                                />
                                            </td>
                                            <td className="p-4 font-medium">
                                                {item.name}
                                                {isConflict && (
                                                    <div className="text-xs text-red-600 font-bold flex items-center mt-1">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        在庫不足 (他: {conflictProjectNames.join(', ')})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-muted-foreground">{item.manufacturer}</td>
                                            <td className="p-4">
                                                <Badge variant="outline" className={`mr-2 capitalize border ${getCategoryColor(item.majorCategory || 'other')}`}>{item.majorCategory}</Badge>
                                                <span className="text-xs text-muted-foreground capitalize">{item.subCategory}</span>
                                            </td>
                                            <td className="p-4 text-xs text-muted-foreground capitalize">{item.storageLocation || '-'}</td>
                                            <td className="p-4 text-center">
                                                <span className={cn(isConflict ? "text-red-600 font-bold" : "")}>
                                                    {remainingStock} / {item.stockQuantity || 0}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">¥{(item.dayRate || 0).toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); deleteEquipment(item.id); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 h-full flex flex-col max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4 mb-6 pb-2 border-b">
                <Button variant="ghost" onClick={() => setMode('list')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> 一覧に戻る
                </Button>
                <div className="h-6 w-px bg-border" />
                <h2 className="text-xl font-bold">{currentItem.id?.includes('eq-') && !equipment.find(e => e.id === currentItem.id) ? '新規機材登録' : '機材編集'}</h2>
            </div>

            <EquipmentForm
                initialData={currentItem}
                onSave={handleSave}
                onCancel={() => setMode('list')}
            />
        </div>
    );
}
