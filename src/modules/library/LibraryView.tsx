"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipmentStore } from "@/store/equipmentStore";
import { useProjectStore } from "@/store/projectStore"; // Added
import { Checkbox } from "@/components/ui/checkbox"; // Added
import { Plus, Trash2, RotateCcw, Save, ArrowLeft } from "lucide-react";
import { Equipment, EquipmentCategory, EquipmentSubCategory, Connector } from "@/types/equipment";
import { PortCounter } from './PortCounter';
import EquipmentNode from '../diagram/nodes/EquipmentNode';
import { ReactFlowProvider } from '@xyflow/react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const SUB_CATEGORIES: Record<string, { value: string; label: string }[]> = {
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

export function LibraryView() {
    const { equipment, addEquipment, updateEquipment, deleteEquipment, resetToDefault } = useEquipmentStore();
    const { selectedEquipmentIds, toggleEquipmentSelection } = useProjectStore(); // Use project store
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

    const handleSave = () => {
        if (!currentItem.name) return;

        const currentConnectors = (currentItem.connectors as Connector[]) || [];
        const inputs = currentConnectors.filter(c => c.direction === 'input').length || 0;
        const outputs = currentConnectors.filter(c => c.direction === 'output').length || 0;

        const finalItem = {
            ...currentItem,
            inputPortCount: inputs,
            outputPortCount: outputs,
            category: currentItem.majorCategory,
            connectors: currentConnectors,
            stockQuantity: currentItem.stockQuantity || 0,
            dayRate: currentItem.dayRate || 0,
        } as Equipment;

        const exists = equipment.find(e => e.id === finalItem.id);
        if (exists) {
            updateEquipment(finalItem.id, finalItem);
        } else {
            addEquipment(finalItem);
        }
        setMode('list');
    };

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
                                    <th className="h-12 px-4 text-center font-medium">在庫</th>
                                    <th className="h-12 px-4 text-right font-medium">単価</th>
                                    <th className="h-12 px-4 text-center font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map((item) => (
                                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleEdit(item)}>
                                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedEquipmentIds?.includes(item.id)}
                                                onCheckedChange={() => toggleEquipmentSelection(item.id)}
                                            />
                                        </td>
                                        <td className="p-4 font-medium">{item.name}</td>
                                        <td className="p-4 text-muted-foreground">{item.manufacturer}</td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="mr-2 capitalize">{item.majorCategory}</Badge>
                                            <span className="text-xs text-muted-foreground capitalize">{item.subCategory}</span>
                                        </td>
                                        <td className="p-4 text-center">{item.stockQuantity || 0}</td>
                                        <td className="p-4 text-right">¥{(item.dayRate || 0).toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e) => { e.stopPropagation(); deleteEquipment(item.id); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
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

            <div className="flex flex-col xl:flex-row gap-6 flex-1 overflow-hidden">
                {/* LEFT: Input Forms */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 min-w-[300px]">
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
                                <label className="text-sm font-medium">在庫数 (Stock)</label>
                                <Input type="number" min="0" value={currentItem.stockQuantity} onChange={e => setCurrentItem(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">日単価 (¥)</label>
                                <Input type="number" min="0" value={currentItem.dayRate} onChange={e => setCurrentItem(prev => ({ ...prev, dayRate: Number(e.target.value) }))} placeholder="0" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">備考</label>
                            <Textarea value={currentItem.description} onChange={e => setCurrentItem(prev => ({ ...prev, description: e.target.value }))} placeholder="特記事項..." className="h-24" />
                        </div>
                    </div>
                </div>

                {/* MIDDLE: Preview Section (Sticky) */}
                <div className="w-full xl:w-[400px] flex-col gap-4 hidden md:flex">
                    <div className="border rounded-lg bg-muted/20 p-8 flex items-center justify-center relative min-h-[300px] xl:sticky xl:top-0">
                        <div className="absolute top-4 left-4 text-sm text-muted-foreground flex items-center gap-2">
                            <span>プレビュー</span>
                            <Badge variant="secondary">Realtime</Badge>
                        </div>
                        <div className="scale-100 origin-center pointer-events-none select-none w-full h-full flex items-center justify-center">
                            <ReactFlowProvider>
                                <EquipmentNode
                                    id="preview"
                                    data={{
                                        ...currentItem,
                                        id: currentItem.id || 'preview',
                                        equipmentId: currentItem.id || 'preview',
                                        name: currentItem.name || 'New Item',
                                    } as any}
                                    type="equipment"
                                    selected={false}
                                    zIndex={1}
                                    isConnectable={false}
                                    positionAbsoluteX={0}
                                    positionAbsoluteY={0}
                                    dragging={false}
                                    draggable={false}
                                    selectable={false}
                                    deletable={false}
                                />
                            </ReactFlowProvider>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground p-2">
                        ※ プレビューは実際のダイアグラム表示とほぼ同じです。
                    </div>
                </div>

                {/* RIGHT: Port Configuration */}
                <div className="w-full xl:w-[400px] border-l pl-6 overflow-y-auto bg-muted/5 min-w-[350px]">
                    <div className="grid grid-cols-1 gap-8 pr-2">
                        <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100">
                            <p className="text-sm text-blue-600">
                                💡 Count buttons are split into <b>IN (Left)</b> and <b>OUT (Right)</b>.
                            </p>
                        </div>

                        {/* Video Ports */}
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h4 className="font-semibold text-blue-600">映像端子 (Video)</h4>
                                <div className="flex gap-10 text-xs text-muted-foreground mr-6">
                                    <span className="font-bold">IN</span>
                                    <span className="font-bold">OUT</span>
                                </div>
                            </div>
                            {['HDMI', 'SDI', 'DisplayPort', 'DVI', 'VGA', 'Composite'].map(type => (
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
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h4 className="font-semibold text-pink-600">音声端子 (Audio)</h4>
                                <div className="flex gap-10 text-xs text-muted-foreground mr-6">
                                    <span className="font-bold">IN</span>
                                    <span className="font-bold">OUT</span>
                                </div>
                            </div>
                            {['XLR', 'TRS', 'RCA', 'Mini Jack', 'Optical'].map(type => (
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

                        {/* Other Ports */}
                        <div className="bg-card border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-4 border-b pb-2">
                                <h4 className="font-semibold text-orange-600">その他端子 (Other)</h4>
                                <div className="flex gap-10 text-xs text-muted-foreground mr-6">
                                    <span className="font-bold">IN</span>
                                    <span className="font-bold">OUT</span>
                                </div>
                            </div>
                            {['USB-A', 'USB-C', 'Ethernet', 'AC Power', 'DC Power'].map(type => (
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
                        <div className="h-20"></div> {/* Spacer */}
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end gap-3 pt-4 border-t bg-background mt-4">
                <Button variant="outline" size="lg" onClick={() => setMode('list')}>キャンセル</Button>
                <Button size="lg" onClick={handleSave} className="min-w-[150px]">
                    <Save className="mr-2 h-5 w-5" /> 保存する
                </Button>
            </div>
        </div>
    );
}
