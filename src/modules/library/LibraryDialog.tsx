import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipmentStore } from "@/store/equipmentStore";
import { Plus, Trash2, Edit2, RotateCcw, Save, LayoutGrid, List, ArrowLeft } from "lucide-react";
import { Equipment, EquipmentCategory, EquipmentSubCategory, Connector } from "@/types/equipment";
import { PortCounter } from './PortCounter';
import EquipmentNode from '../diagram/nodes/EquipmentNode';
import { ReactFlowProvider } from '@xyflow/react';
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge"; // Assuming Badge component exists

// Sub Category Maps
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

export function LibraryDialog() {
    const { equipment, addEquipment, updateEquipment, deleteEquipment, resetToDefault } = useEquipmentStore();
    const [mode, setMode] = useState<'list' | 'edit'>('list');
    const [currentItem, setCurrentItem] = useState<Partial<Equipment>>({});

    // Initialize editing
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
            stockQuantity: 0, // Added
            dayRate: 0, // Added
        });
    };

    const handleEdit = (item: Equipment) => {
        setMode('edit');
        setCurrentItem({ ...item });
    };

    const handleSave = () => {
        if (!currentItem.name) return;

        // Recalculate totals
        // Use type assertion or default to empty array
        const currentConnectors = (currentItem.connectors as Connector[]) || [];
        const inputs = currentConnectors.filter(c => c.direction === 'input').length || 0;
        const outputs = currentConnectors.filter(c => c.direction === 'output').length || 0;

        const finalItem = {
            ...currentItem,
            inputPortCount: inputs,
            outputPortCount: outputs,
            category: currentItem.majorCategory, // legacy sync
            connectors: currentConnectors,
            stockQuantity: currentItem.stockQuantity || 0, // Ensure stockQuantity is saved
            dayRate: currentItem.dayRate || 0, // Ensure dayRate is saved
        } as Equipment;

        const exists = equipment.find(e => e.id === finalItem.id);
        if (exists) {
            updateEquipment(finalItem.id, finalItem);
        } else {
            addEquipment(finalItem);
        }
        setMode('list');
    };

    // Port Management Logic
    const updatePortCount = (type: string, direction: 'input' | 'output', count: number) => {
        let newConnectors = [...((currentItem.connectors as Connector[]) || [])];

        // Remove existing connectors of this type/direction
        newConnectors = newConnectors.filter(c => !(c.type === type && c.direction === direction));

        // Add new connectors
        for (let i = 0; i < count; i++) {
            newConnectors.push({
                id: `${type.toLowerCase()} -${direction} -${i + 1} -${Date.now()} `,
                name: `${type} ${direction === 'input' ? 'IN' : 'OUT'} ${i + 1} `,
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

    // Render List View (Table Mode)
    const renderList = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> 新規追加</Button>
                <div className="flex gap-2">
                    {/* Placeholder for Search */}
                    <Input placeholder="検索..." className="w-64 h-9" />
                    <Button variant="ghost" size="sm" onClick={resetToDefault} className="text-red-500">
                        <RotateCcw className="mr-2 h-4 w-4" /> 初期化
                    </Button>
                </div>
            </div>

            <div className="flex-1 border rounded-md overflow-hidden">
                <div className="overflow-y-auto h-full">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr className="border-b">
                                <th className="h-10 px-4 text-left font-medium">機材名</th>
                                <th className="h-10 px-4 text-left font-medium">メーカー</th>
                                <th className="h-10 px-4 text-left font-medium">カテゴリ</th>
                                <th className="h-10 px-4 text-center font-medium">在庫</th>
                                <th className="h-10 px-4 text-right font-medium">単価</th>
                                <th className="h-10 px-4 text-center font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((item) => (
                                <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleEdit(item)}>
                                    <td className="p-3 font-medium">{item.name}</td>
                                    <td className="p-3 text-muted-foreground">{item.manufacturer}</td>
                                    <td className="p-3">
                                        <Badge variant="outline" className="mr-2 capitalize">{item.majorCategory}</Badge>
                                        <span className="text-xs text-muted-foreground capitalize">{item.subCategory}</span>
                                    </td>
                                    <td className="p-3 text-center">{item.stockQuantity || 0}</td>
                                    <td className="p-3 text-right">¥{(item.dayRate || 0).toLocaleString()}</td>
                                    <td className="p-3 text-center">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e: React.MouseEvent) => { e.stopPropagation(); deleteEquipment(item.id); }}>
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

    // Render Edit View
    const renderEditor = () => (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header with Back Button */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                <Button variant="ghost" size="sm" onClick={() => setMode('list')}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> 一覧に戻る
                </Button>
                <div className="h-4 w-px bg-border mx-2" />
                <h3 className="font-semibold">{currentItem.id?.includes('eq-') && !equipment.find(e => e.id === currentItem.id) ? '新規機材登録' : '機材編集'}</h3>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
                {/* LEFT: Basic Info */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                    <div className="space-y-4 border p-4 rounded-lg bg-card shadow-sm">
                        <h3 className="font-semibold text-sm border-b pb-2 text-primary">基本情報</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">大カテゴリ <span className="text-red-500">*</span></label>
                                <Select value={currentItem.majorCategory} onValueChange={(v) => setCurrentItem(prev => ({
                                    ...prev,
                                    majorCategory: v as EquipmentCategory,
                                    subCategory: 'other' // Reset sub on major change
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
                                <label className="text-xs font-medium">小カテゴリ</label>
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
                                <label className="text-xs font-medium">メーカー</label>
                                <Input value={currentItem.manufacturer} onChange={e => setCurrentItem(prev => ({ ...prev, manufacturer: e.target.value }))} placeholder="例: Sony" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">機材名 <span className="text-red-500">*</span></label>
                                <Input value={currentItem.name} onChange={e => setCurrentItem(prev => ({ ...prev, name: e.target.value }))} placeholder="例: HXR-NX100" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">在庫数 (Stock)</label>
                                <Input type="number" min="0" value={currentItem.stockQuantity} onChange={e => setCurrentItem(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))} placeholder="0" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">日単価 (¥)</label>
                                <Input type="number" min="0" value={currentItem.dayRate} onChange={e => setCurrentItem(prev => ({ ...prev, dayRate: Number(e.target.value) }))} placeholder="0" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium">備考</label>
                            <Textarea value={currentItem.description} onChange={e => setCurrentItem(prev => ({ ...prev, description: e.target.value }))} placeholder="特記事項..." className="h-20" />
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="flex-1 border rounded-lg bg-muted/20 p-8 flex items-center justify-center relative min-h-[200px]">
                        <div className="absolute top-2 left-2 text-xs text-muted-foreground flex items-center gap-2">
                            <span>プレビュー</span>
                            <Badge variant="secondary" className="text-[10px]">Realtime</Badge>
                        </div>
                        <div className="scale-125 origin-center pointer-events-none select-none">
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
                </div>

                {/* RIGHT: Port Configuration */}
                {/* Widen the container to ensure PortCounter fits */}
                <div className="w-[400px] border-l pl-4 overflow-y-auto bg-muted/5">
                    <div className="grid grid-cols-1 gap-6 pr-2">
                        <div className="p-2 bg-blue-50/50 rounded-md border border-blue-100 mb-2">
                            <p className="text-xs text-blue-600">
                                💡 Count buttons are split into IN (Left) and OUT (Right).
                            </p>
                        </div>

                        {/* Video Ports */}
                        <div className="bg-card border rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2 border-b pb-1">
                                <h4 className="text-sm font-semibold text-blue-600">映像端子 (Video)</h4>
                                <div className="flex gap-8 text-[10px] text-muted-foreground mr-4">
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
                        <div className="bg-card border rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2 border-b pb-1">
                                <h4 className="text-sm font-semibold text-pink-600">音声端子 (Audio)</h4>
                                <div className="flex gap-8 text-[10px] text-muted-foreground mr-4">
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
                        <div className="bg-card border rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between items-center mb-2 border-b pb-1">
                                <h4 className="text-sm font-semibold text-orange-600">その他端子 (Other)</h4>
                                <div className="flex gap-8 text-[10px] text-muted-foreground mr-4">
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
                        <div className="h-12"></div> {/* Spacer */}
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end gap-2 pt-4 border-t bg-background">
                <Button variant="outline" onClick={() => setMode('list')}>キャンセル</Button>
                <Button onClick={handleSave} className="min-w-[120px]">
                    <Save className="mr-2 h-4 w-4" />保存する
                </Button>
            </div>
        </div>
    );

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mb-2">
                    <LayoutGrid className="w-3 h-3 mr-2" /> 機材リスト管理
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-6" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="mb-2">
                    <DialogTitle className="flex items-center gap-2">
                        {mode === 'list' ? <><List className="w-5 h-5" /> 機材リスト一覧</> : <><Edit2 className="w-5 h-5" /> 機材編集 / 詳細設定</>}
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    {mode === 'list' ? renderList() : renderEditor()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
