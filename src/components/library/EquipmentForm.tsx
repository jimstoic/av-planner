"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";
import { Equipment, EquipmentCategory, EquipmentSubCategory, Connector, StorageLocation } from "@/types/equipment";
import { PortCounter } from '@/modules/library/PortCounter'; // Assuming PortCounter is exported from here or needs move

// Sub-categories definition (Moved from LibraryView to share)
export const SUB_CATEGORIES: Record<string, { value: string; label: string }[]> = {
    video: [
        { value: 'camera', label: 'カメラ' },
        { value: 'switcher', label: 'スイッチャー' },
        { value: 'display', label: 'ディスプレイ' },
        { value: 'converter', label: 'コンバーター' },
        { value: 'cable', label: '映像ケーブル' },
    ],
    audio: [
        { value: 'microphone', label: 'マイク' },
        { value: 'mixer', label: 'ミキサー' },
        { value: 'speaker', label: 'スピーカー' },
        { value: 'processor', label: 'プロセッサー' },
        { value: 'amplifier', label: 'アンプ' },
        { value: 'cable', label: '音声ケーブル' },
    ],
    lighting: [
        { value: 'fixture', label: '灯体' },
        { value: 'dimmer', label: 'ディマー' },
        { value: 'console', label: '調光卓' },
    ],
    power: [
        { value: 'generator', label: '発電機' },
        { value: 'distro', label: '分電盤' },
        { value: 'ups', label: 'UPS' },
    ],
    control: [
        { value: 'pc', label: 'PC' },
        { value: 'network', label: 'ネットワーク' },
    ],
    other: [
        { value: 'accessory', label: 'アクセサリー' },
        { value: 'other', label: 'その他' },
    ]
};

interface EquipmentFormProps {
    initialData?: Partial<Equipment>;
    onSave: (data: Equipment) => void;
    onCancel: () => void;
    isDialog?: boolean; // Layout adjustment
}

export function EquipmentForm({ initialData, onSave, onCancel, isDialog = false }: EquipmentFormProps) {
    const [currentItem, setCurrentItem] = useState<Partial<Equipment>>({
        id: `eq-${Date.now()}`,
        name: '',
        majorCategory: 'video',
        subCategory: 'camera',
        manufacturer: '',
        description: '',
        connectors: [],
        stockQuantity: 0,
        dayRate: 0,
        inputPortCount: 0,
        outputPortCount: 0,
        powerConsumption: 0,
        weight: 0,
        storageLocation: 'other',
        ...initialData
    });

    // Populate counts from connectors if editing an existing item that has them
    // If simplistic item (from Master) doesn't have connectors array but has counts, we might need to sync.
    // Ideally we prefer the connectors array if available.

    const updatePortCount = (type: string, direction: 'input' | 'output', count: number) => {
        let newConnectors = [...((currentItem.connectors as Connector[]) || [])];
        newConnectors = newConnectors.filter(c => !(c.type === type && c.direction === direction));
        for (let i = 0; i < count; i++) {
            newConnectors.push({
                id: `${type.toLowerCase()}-${direction}-${i + 1}-${Date.now()}`,
                name: `${type} ${direction === 'input' ? 'IN' : 'OUT'} ${i + 1}`,
                type: type,
                direction: direction
            });
        }
        setCurrentItem(prev => ({ ...prev, connectors: newConnectors }));
    };

    const getCount = (type: string, direction: 'input' | 'output') => {
        const conns = (currentItem.connectors as Connector[]) || [];
        return conns.filter(c => c.type === type && c.direction === direction).length || 0;
    };

    const handleSaveLocal = () => {
        if (!currentItem.name) return;

        const currentConnectors = (currentItem.connectors as Connector[]) || [];
        const inputs = currentConnectors.filter(c => c.direction === 'input').length || 0;
        const outputs = currentConnectors.filter(c => c.direction === 'output').length || 0;

        // If user manually edited inputPortCount/outputPortCount in Master view without detailed connectors,
        // we might want to respect that. BUT the detailed form emphasizes Connectors.
        // Let's rely on connectors if present, otherwise fall back to manual counts.
        // Actually, if we use this form, we enforce Connector usage for accurate diagrams.

        const finalItem = {
            ...currentItem,
            inputPortCount: inputs > 0 ? inputs : (currentItem.inputPortCount || 0),
            outputPortCount: outputs > 0 ? outputs : (currentItem.outputPortCount || 0),
            category: currentItem.majorCategory,
            connectors: currentConnectors,
            stockQuantity: Number(currentItem.stockQuantity) || 0,
            dayRate: Number(currentItem.dayRate) || 0,
        } as Equipment;

        onSave(finalItem);
    };

    return (
        <div className={`flex flex-col gap-6 ${isDialog ? '' : 'h-full'}`}>
            <div className="flex flex-col xl:flex-row gap-6 ">
                {/* Inputs */}
                <div className="flex-1 flex flex-col gap-6 min-w-[300px]">
                    <div className="space-y-6 border p-6 rounded-lg bg-card shadow-sm">
                        <h3 className="font-semibold text-lg border-b pb-2 text-primary">基本情報</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">大カテゴリ <span className="text-red-500">*</span></label>
                                <Select value={currentItem.majorCategory} onValueChange={(v) => setCurrentItem(prev => ({
                                    ...prev,
                                    majorCategory: v as EquipmentCategory,
                                    subCategory: 'other'
                                }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="video">映像 (Video)</SelectItem>
                                        <SelectItem value="audio">音響 (Audio)</SelectItem>
                                        <SelectItem value="lighting">照明 (Lighting)</SelectItem>
                                        <SelectItem value="power">電源 (Power)</SelectItem>
                                        <SelectItem value="control">制御 (Control)</SelectItem>
                                        <SelectItem value="other">その他 (Other)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">小カテゴリ</label>
                                <Select value={currentItem.subCategory} onValueChange={(v) => setCurrentItem(prev => ({ ...prev, subCategory: v as EquipmentSubCategory }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(SUB_CATEGORIES[currentItem.majorCategory || 'other'] || SUB_CATEGORIES['other']).map(sub => (
                                            <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">メーカー</label>
                                <Input value={currentItem.manufacturer} onChange={e => setCurrentItem(prev => ({ ...prev, manufacturer: e.target.value }))} placeholder="例: Sony" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">機材名 <span className="text-red-500">*</span></label>
                                <Input value={currentItem.name} onChange={e => setCurrentItem(prev => ({ ...prev, name: e.target.value }))} placeholder="例: HXR-NX100" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">在庫数</label>
                                <Input type="number" min="0" value={currentItem.stockQuantity} onChange={e => setCurrentItem(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">日単価 (¥)</label>
                                <Input type="number" min="0" value={currentItem.dayRate} onChange={e => setCurrentItem(prev => ({ ...prev, dayRate: Number(e.target.value) }))} placeholder="0" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">保管場所 (Location)</label>
                            <Select value={currentItem.storageLocation} onValueChange={(v) => setCurrentItem(prev => ({ ...prev, storageLocation: v as StorageLocation }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="nakano">中野 (Nakano)</SelectItem>
                                    <SelectItem value="sendagaya">千駄ヶ谷 (Sendagaya)</SelectItem>
                                    <SelectItem value="osaka">大阪 (Osaka)</SelectItem>
                                    <SelectItem value="chiba">千葉 (Chiba)</SelectItem>
                                    <SelectItem value="other">その他 (Other)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">備考</label>
                            <Textarea value={currentItem.description} onChange={e => setCurrentItem(prev => ({ ...prev, description: e.target.value }))} placeholder="特記事項..." className="h-24" />
                        </div>
                    </div>
                </div>

                {/* Ports (Collapsible or Scrollable) */}
                <div className="w-full xl:w-[350px] border-l pl-6 overflow-y-auto bg-muted/5 min-w-[300px] max-h-[600px]">
                    <div className="grid grid-cols-1 gap-8 pr-2">
                        <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
                            <p className="text-xs text-blue-600">
                                💡 詳細なポート構成を設定できます
                            </p>
                        </div>

                        {/* Video Ports */}
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-blue-600 mb-2 border-b pb-1 text-sm">映像端子</h4>
                            {['HDMI', 'SDI', 'DisplayPort', 'DVI', 'VGA'].map(type => (
                                <PortCounter
                                    key={type}
                                    label={type}
                                    type={type}
                                    countIn={getCount(type, 'input')}
                                    countOut={getCount(type, 'output')}
                                    onChange={updatePortCount}
                                />
                            ))}
                        </div>

                        {/* Audio Ports */}
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold text-pink-600 mb-2 border-b pb-1 text-sm">音声端子</h4>
                            {['XLR', 'TRS', 'RCA', 'Mini Jack'].map(type => (
                                <PortCounter
                                    key={type}
                                    label={type}
                                    type={type}
                                    countIn={getCount(type, 'input')}
                                    countOut={getCount(type, 'output')}
                                    onChange={updatePortCount}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t bg-background mt-auto">
                <Button variant="outline" onClick={onCancel}>キャンセル</Button>
                <Button onClick={handleSaveLocal}>
                    <Save className="mr-2 h-4 w-4" /> 保存
                </Button>
            </div>
        </div>
    );
}
