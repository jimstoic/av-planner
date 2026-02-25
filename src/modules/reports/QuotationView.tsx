"use client";

import React, { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import { differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Check, Download, Settings2, Percent, Calculator, Info, FileText, Plus, Trash2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { StaffManager } from '@/modules/project/StaffManager';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Users } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

export function QuotationView() {
    const {
        startDate,
        endDate,
        selectedEquipmentIds,
        nodes, // Get nodes for counting
        staff,
        projectName,
        clientName,
        venue,
        additionalCosts,
        taxRateOverride,
        discountAmount,
        discountType,
        discountIncludedCategories,
        remarks,
        equipmentOverrides,
        updateQuotationSettings,
        updateEquipmentOverride,
        updateStaff,
        removeStaff,
        addAdditionalCost,
        removeAdditionalCost,
        updateAdditionalCost
    } = useProjectStore();

    const { equipment } = useEquipmentStore();
    const { taxRate, currency } = useSettingsStore();
    const [isInvoiceMode, setIsInvoiceMode] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Calculate duration
    const duration = useMemo(() => {
        const days = differenceInDays(endDate, startDate) + 1;
        return Math.max(1, days);
    }, [startDate, endDate]);

    // 1. Staff Costs (Base Staff + Additional Staff Items)
    const staffItems = useMemo(() => {
        const baseStaff = staff.map(s => ({
            ...s,
            quantity: 1,
            days: s.daysAssigned || duration,
            total: s.dayRate * (s.daysAssigned || duration),
            isAdditional: false
        }));

        const extraStaff = additionalCosts.filter(c => c.category === 'staff').map(c => ({
            id: c.id,
            name: c.name,
            role: '追加項目',
            dayRate: c.unitPrice,
            days: c.quantity, // Using quantity as days for additional staff
            total: c.unitPrice * c.quantity,
            isAdditional: true
        }));

        return [...baseStaff, ...extraStaff];
    }, [staff, duration, additionalCosts]);
    const staffSubtotal = staffItems.reduce((acc, item) => acc + item.total, 0);

    // 2. Equipment Costs (From Diagram Count + Overrides + Additional Items)
    const equipmentItems = useMemo(() => {
        const baseEquipment = selectedEquipmentIds.map(id => {
            const item = equipment.find(e => e.id === id);
            if (!item) return null;

            const override = equipmentOverrides[id] || {};

            // Count nodes using this equipment
            const nodeCount = nodes.filter(n => n.data?.equipmentId === id).length;

            const quantity = override.quantity !== undefined ? override.quantity : Math.max(1, nodeCount);
            const unitPrice = override.unitPrice !== undefined ? override.unitPrice : (item.dayRate || 0);
            const name = override.name || item.name;

            return {
                id, // Use the same ID for keying/overrides
                name,
                manufacturer: item.manufacturer,
                quantity,
                unitPrice,
                days: duration,
                total: unitPrice * quantity * duration,
                isAdditional: false as const
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        const extraEquipment = additionalCosts.filter(c => c.category === 'equipment').map(c => ({
            id: c.id,
            name: c.name,
            manufacturer: '自由項目',
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            days: duration,
            total: c.unitPrice * c.quantity * duration,
            isAdditional: true as const
        }));

        return [...baseEquipment, ...extraEquipment];
    }, [selectedEquipmentIds, equipment, duration, nodes, equipmentOverrides, additionalCosts]);
    const equipmentSubtotal = equipmentItems.reduce((acc, item) => acc + item.total, 0);

    // 3. Production Costs (Additional Costs Filtered)
    // Assuming category 'production' vs 'other'
    const productionItems = additionalCosts.filter(c => c.category === 'production' || !c.category).map(c => ({
        ...c,
        total: c.unitPrice * c.quantity
    }));
    const productionSubtotal = productionItems.reduce((acc, item) => acc + item.total, 0);

    // 4. Other Costs
    const otherItems = additionalCosts.filter(c => c.category === 'other').map(c => ({
        ...c,
        total: c.unitPrice * c.quantity
    }));
    const otherSubtotal = otherItems.reduce((acc, item) => acc + item.total, 0);

    // --- Advanced Calculations ---
    const primarySubtotal = useMemo(() => {
        let sum = 0;
        if (discountIncludedCategories.includes('staff')) sum += staffSubtotal;
        if (discountIncludedCategories.includes('equipment')) sum += equipmentSubtotal;
        if (discountIncludedCategories.includes('production')) sum += productionSubtotal;
        if (discountIncludedCategories.includes('other')) sum += otherSubtotal;
        return sum;
    }, [discountIncludedCategories, staffSubtotal, equipmentSubtotal, productionSubtotal, otherSubtotal]);

    const nonDiscountedBasis = useMemo(() => {
        let sum = 0;
        if (!discountIncludedCategories.includes('staff')) sum += staffSubtotal;
        if (!discountIncludedCategories.includes('equipment')) sum += equipmentSubtotal;
        if (!discountIncludedCategories.includes('production')) sum += productionSubtotal;
        if (!discountIncludedCategories.includes('other')) sum += otherSubtotal;
        return sum;
    }, [discountIncludedCategories, staffSubtotal, equipmentSubtotal, productionSubtotal, otherSubtotal]);

    const discountValue = useMemo(() => {
        if (discountType === 'percent') {
            return Math.floor(primarySubtotal * (discountAmount / 100));
        }
        return discountAmount;
    }, [primarySubtotal, discountAmount, discountType]);

    const discountedSubtotal = primarySubtotal - discountValue;
    const totalBeforeTax = discountedSubtotal + nonDiscountedBasis;

    // Use override or global setting
    const activeTaxRate = taxRateOverride !== undefined ? taxRateOverride : taxRate;
    const tax = Math.floor(totalBeforeTax * (activeTaxRate / 100));
    const grandTotal = totalBeforeTax + tax;

    const handleExportCSV = () => {
        try {
            const rows = [
                ['Category', 'Name', 'Manufacturer/Role', 'Unit Price', 'Quantity', 'Days', 'Total'],
                ...staffItems.map(s => ['Personnel', s.name, s.role, s.dayRate, 1, s.days, s.total]),
                ...equipmentItems.map(e => ['Equipment', e.name, e.manufacturer, e.unitPrice, e.quantity, e.days, e.total]),
                ...productionItems.map(p => ['Production', p.name, '-', p.unitPrice, p.quantity, 1, p.total]),
                ...otherItems.map(o => ['Other', o.name, '-', o.unitPrice, o.quantity, 1, o.total]),
                [],
                ['Subtotal (Gross Basis)', '', '', '', '', '', primarySubtotal],
                [`Discount (${discountType === 'percent' ? discountAmount + '%' : 'Flat'})`, '', '', '', '', '', -discountValue],
                ['Other (Non-Discounted)', '', '', '', '', '', nonDiscountedBasis],
                ['Total (Net)', '', '', '', '', '', totalBeforeTax],
                [`Tax (${activeTaxRate}%)`, '', '', '', '', '', tax],
                ['Grand Total', '', '', '', '', '', grandTotal]
            ];

            const csvContent = "data:text/csv;charset=utf-8,"
                + rows.map(e => e.join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${projectName}_quotation.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSVを書き出しました");
        } catch (e) {
            console.error(e);
            toast.error("CSV書き出しに失敗しました");
        }
    };

    const handleExportPDF = async () => {
        if (!contentRef.current) return;
        const toastId = toast.loading("高品質PDFを生成中...");

        try {
            // High-resolution capture with fixed width to prevent layout shifts
            const dataUrl = await toPng(contentRef.current, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                canvasWidth: 1100, // Force a consistent width for the capture
                canvasHeight: (contentRef.current.scrollHeight * (1100 / contentRef.current.offsetWidth)),
                style: {
                    margin: '0',
                    padding: '0',
                    boxShadow: 'none',
                    borderRadius: '0',
                }
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const margin = 10;
            const pdfWidth = pageWidth - (margin * 2);

            // Calculate height in PDF units keeping aspect ratio
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Single page scale-to-fit or natural height
            pdf.addImage(dataUrl, 'PNG', margin, margin, pdfWidth, Math.min(pdfHeight, pageHeight - (margin * 2)));
            pdf.save(`${projectName}_${isInvoiceMode ? '請求書' : '見積書'}.pdf`);

            toast.success("PDFを保存しました", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("PDFの生成に失敗しました", { id: toastId });
        }
    };

    const themeColor = isInvoiceMode ? "text-emerald-600" : "text-blue-600";

    return (
        <div className="flex flex-col h-full w-full bg-slate-100 dark:bg-background overflow-hidden print:bg-white print:overflow-visible print:h-auto font-sans">
            {/* Header */}
            <div className="border-b bg-background shadow-sm py-4 shrink-0 print:hidden">
                <div className="max-w-5xl mx-auto px-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">
                            {isInvoiceMode ? '請求書発行' : '見積もり作成'}
                        </h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            {isInvoiceMode ? 'プロジェクト完了後の請求書を作成します' : '顧客提示用の概算見積書を作成します'}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg">
                            <Switch id="mode-toggle" checked={isInvoiceMode} onCheckedChange={setIsInvoiceMode} />
                            <Label htmlFor="mode-toggle" className="cursor-pointer font-medium">
                                {isInvoiceMode ? '請求モード' : '見積モード'}
                            </Label>
                        </div>

                        {/* Advanced Settings Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" title="Document Settings">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4">
                                <div className="space-y-4 text-sm">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <Settings2 className="w-4 h-4" /> 個別設定 (Project Specific)
                                    </h4>

                                    <div className="space-y-2">
                                        <Label className="text-xs">消費税率上書き (%)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder={taxRate.toString()}
                                                value={taxRateOverride ?? ''}
                                                onChange={(e) => updateQuotationSettings({
                                                    taxRateOverride: e.target.value === '' ? undefined : Number(e.target.value)
                                                })}
                                                className="h-8"
                                            />
                                            {taxRateOverride !== undefined && (
                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => updateQuotationSettings({ taxRateOverride: undefined })}>
                                                    リセット
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-xs">割引対象の項目を選択</Label>
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            {[
                                                { id: 'staff', label: '人件費' },
                                                { id: 'equipment', label: '機材費' },
                                                { id: 'production', label: '制作費' },
                                                { id: 'other', label: 'その他' }
                                            ].map((cat) => (
                                                <div key={cat.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`cat-${cat.id}`}
                                                        checked={discountIncludedCategories.includes(cat.id)}
                                                        onCheckedChange={(checked) => {
                                                            const newCats = checked
                                                                ? [...discountIncludedCategories, cat.id]
                                                                : discountIncludedCategories.filter(c => c !== cat.id);
                                                            updateQuotationSettings({ discountIncludedCategories: newCats });
                                                        }}
                                                    />
                                                    <Label htmlFor={`cat-${cat.id}`} className="text-[10px] cursor-pointer">{cat.label}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">割引額/率</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={discountAmount}
                                                onChange={(e) => updateQuotationSettings({ discountAmount: Number(e.target.value) })}
                                                className="h-8"
                                            />
                                            <Button
                                                variant={discountType === 'percent' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => updateQuotationSettings({ discountType: 'percent' })}
                                            >
                                                <Percent className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant={discountType === 'flat' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => updateQuotationSettings({ discountType: 'flat' })}
                                            >
                                                <span className="text-[10px]">¥</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">備考 (Remarks)</Label>
                                        <Textarea
                                            value={remarks || ''}
                                            onChange={(e) => updateQuotationSettings({ remarks: e.target.value })}
                                            className="text-xs min-h-[80px]"
                                            placeholder="備考を入力してください..."
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Button variant="outline" onClick={handleExportCSV}>
                            <Download className="mr-2 h-4 w-4" /> CSV
                        </Button>
                        <Button variant="outline" onClick={handleExportPDF}>
                            <FileText className="mr-2 h-4 w-4" /> PDF保存
                        </Button>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> 印刷
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 font-sans print:p-0 print:overflow-visible">
                <div ref={contentRef} className="max-w-4xl mx-auto bg-white shadow-xl rounded-none border-none overflow-hidden min-h-[1000px] text-black print:shadow-none print:w-full">
                    {/* Document Header */}
                    <div className="p-12 border-b bg-white">
                        <div className="flex justify-between items-start mb-12">
                            <div className="space-y-4">
                                <h1 className={`text-4xl font-bold tracking-wider ${themeColor}`}>
                                    {isInvoiceMode ? '御 請 求 書' : '御 見 積 書'}
                                </h1>
                                <div className="text-sm space-y-1 text-slate-500">
                                    <p>No. {new Date().getTime().toString().slice(-6)}</p>
                                    <p>発行日: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <h2 className="text-xl font-bold text-slate-800">{clientName || '顧客名未設定'} 御中</h2>
                                <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg text-left w-64 border border-slate-100">
                                    <p className="font-semibold mb-1 text-slate-700">件名: {projectName}</p>
                                    <p>会場: {venue}</p>
                                    <p>期間: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mb-8">
                            <div className="w-1/2 border-b-2 border-slate-800 pb-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold text-slate-500">
                                        {isInvoiceMode ? 'ご請求金額 (税込)' : '御見積金額 (税込)'}
                                    </span>
                                    <span className="text-3xl font-bold tracking-tight text-black">{currency}{grandTotal.toLocaleString()}-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 space-y-12 bg-white">
                        {/* 1. Staff */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b-2 pb-1 border-slate-800">
                                <h3 className={`font-bold text-lg text-black mb-0 pb-0`}>
                                    1. 人件費 (Personnel Expenses)
                                </h3>
                                <div className="flex gap-2 print:hidden items-center">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addAdditionalCost({ name: '新規人件費', unitPrice: 0, quantity: 1, category: 'staff' })}>
                                        <Plus className="w-3 h-3 mr-1" /> 追加
                                    </Button>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-primary">
                                                <Users className="w-3 h-3 mr-1" /> スタッフ管理
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                            <StaffManager />
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-200">
                                        <TableHead className="text-slate-800 font-bold">内容</TableHead>
                                        <TableHead className="text-right text-slate-800 font-bold">単価 (日単価)</TableHead>
                                        <TableHead className="text-center text-slate-800 font-bold">人・日</TableHead>
                                        <TableHead className="text-right text-slate-800 font-bold">金額</TableHead>
                                        <TableHead className="w-10 print:hidden"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffItems.map((item) => (
                                        <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50 group">
                                            <TableCell className="p-2">
                                                <input
                                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 text-black font-medium"
                                                    value={item.name}
                                                    onChange={(e) => item.isAdditional
                                                        ? updateAdditionalCost(item.id, { name: e.target.value })
                                                        : updateStaff(item.id, { name: e.target.value })}
                                                />
                                                <input
                                                    className="w-full bg-transparent border-none focus:ring-0 text-[10px] text-slate-400 px-1 -ml-1 mt-[-4px]"
                                                    value={item.role}
                                                    onChange={(e) => !item.isAdditional && updateStaff(item.id, { role: e.target.value })}
                                                    readOnly={item.isAdditional}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right p-2">
                                                <div className="flex items-center justify-end">
                                                    <span className="mr-1 text-slate-400 text-xs">¥</span>
                                                    <input
                                                        type="number"
                                                        className="w-24 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-right rounded px-1 text-black"
                                                        value={item.dayRate}
                                                        onChange={(e) => item.isAdditional
                                                            ? updateAdditionalCost(item.id, { unitPrice: Number(e.target.value) })
                                                            : updateStaff(item.id, { dayRate: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center p-2">
                                                <input
                                                    type="number"
                                                    className="w-12 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-center rounded px-1 text-black"
                                                    value={item.days}
                                                    onChange={(e) => item.isAdditional
                                                        ? updateAdditionalCost(item.id, { quantity: Number(e.target.value) })
                                                        : updateStaff(item.id, { daysAssigned: Number(e.target.value) })}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-semibold p-2">¥{item.total.toLocaleString()}</TableCell>
                                            <TableCell className="p-2 print:hidden text-right">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100"
                                                    onClick={() => item.isAdditional
                                                        ? removeAdditionalCost(item.id)
                                                        : removeStaff(item.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                        <TableCell colSpan={3} className="text-right p-2">人件費 小計</TableCell>
                                        <TableCell className="text-right p-2">¥{staffSubtotal.toLocaleString()}</TableCell>
                                        <TableCell className="print:hidden"></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* 2. Equipment */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b-2 pb-1 border-slate-800">
                                <h3 className={`font-bold text-lg text-black mb-0 pb-0`}>
                                    2. 機材費 (Equipment Rental)
                                </h3>
                                <div className="flex gap-2 print:hidden items-center">
                                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addAdditionalCost({ name: '追加機材', unitPrice: 0, quantity: 1, category: 'equipment' })}>
                                        <Plus className="w-3 h-3 mr-1" /> 自由項目追加
                                    </Button>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-slate-200">
                                        <TableHead className="text-slate-800 font-bold">内容</TableHead>
                                        <TableHead className="text-right text-slate-800 font-bold">単価</TableHead>
                                        <TableHead className="text-center text-slate-800 font-bold">数量 × 日数</TableHead>
                                        <TableHead className="text-right text-slate-800 font-bold">金額</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {equipmentItems.map((item) => (
                                        <TableRow key={item.id} className="border-slate-100 hover:bg-slate-50 group">
                                            <TableCell className="p-2">
                                                <input
                                                    className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 text-black font-medium"
                                                    value={item.name}
                                                    onChange={(e) => item.isAdditional
                                                        ? updateAdditionalCost(item.id, { name: e.target.value })
                                                        : updateEquipmentOverride(item.id, { name: e.target.value })}
                                                />
                                                <div className="text-[10px] text-slate-400 px-1 -ml-1 mt-[-2px]">{item.manufacturer}</div>
                                            </TableCell>
                                            <TableCell className="text-right p-2">
                                                <div className="flex items-center justify-end">
                                                    <span className="mr-1 text-slate-400 text-xs">¥</span>
                                                    <input
                                                        type="number"
                                                        className="w-24 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-right rounded px-1 text-black"
                                                        value={item.unitPrice}
                                                        onChange={(e) => item.isAdditional
                                                            ? updateAdditionalCost(item.id, { unitPrice: Number(e.target.value) })
                                                            : updateEquipmentOverride(item.id, { unitPrice: Number(e.target.value) })}
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center p-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="w-10 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-center rounded px-0 text-black px-1"
                                                        value={item.quantity}
                                                        onChange={(e) => item.isAdditional
                                                            ? updateAdditionalCost(item.id, { quantity: Number(e.target.value) })
                                                            : updateEquipmentOverride(item.id, { quantity: Number(e.target.value) })}
                                                    />
                                                    <span className="text-slate-400 text-[10px]">×</span>
                                                    <span className="w-8 text-center">{item.days}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold p-2 flex items-center justify-end gap-2">
                                                ¥{item.total.toLocaleString()}
                                                {item.isAdditional && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100 print:hidden"
                                                        onClick={() => removeAdditionalCost(item.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                        <TableCell colSpan={3} className="text-right p-2">機材費 小計</TableCell>
                                        <TableCell className="text-right p-2">¥{equipmentSubtotal.toLocaleString()}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* 3. Production & 4. Other */}
                        {(productionItems.length > 0 || otherItems.length > 0) && (
                            <div className="space-y-12">
                                {productionItems.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b-2 pb-1 border-slate-800">
                                            <h3 className="font-bold text-lg text-black mb-0 pb-0">3. 制作費 (Production Expenses)</h3>
                                            <div className="print:hidden">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addAdditionalCost({ name: '新規制作費', unitPrice: 0, quantity: 1, category: 'production' })}>
                                                    <Plus className="w-3 h-3 mr-1" /> 追加
                                                </Button>
                                            </div>
                                        </div>
                                        <Table>
                                            <TableBody>
                                                {productionItems.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50 group border-slate-100">
                                                        <TableCell className="w-[40%] p-2">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 text-black font-medium"
                                                                value={item.name}
                                                                onChange={(e) => updateAdditionalCost(item.id, { name: e.target.value })}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right p-2">
                                                            <div className="flex items-center justify-end">
                                                                <span className="mr-1 text-slate-400 text-xs">¥</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-24 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-right rounded px-1 text-black"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateAdditionalCost(item.id, { unitPrice: Number(e.target.value) })}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            <input
                                                                type="number"
                                                                className="w-12 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-center rounded px-1 text-black"
                                                                value={item.quantity}
                                                                onChange={(e) => updateAdditionalCost(item.id, { quantity: Number(e.target.value) })}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold p-2">¥{item.total.toLocaleString()}</TableCell>
                                                        <TableCell className="p-1 print:hidden w-8">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeAdditionalCost(item.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                                    <TableCell colSpan={3} className="text-right p-2">制作費 小計</TableCell>
                                                    <TableCell className="text-right p-2">¥{productionSubtotal.toLocaleString()}</TableCell>
                                                    <TableCell className="print:hidden"></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {otherItems.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b-2 pb-1 border-slate-800">
                                            <h3 className="font-bold text-lg text-black mb-0 pb-0">4. その他 (Other Expenses)</h3>
                                            <div className="print:hidden">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addAdditionalCost({ name: '新規その他費用', unitPrice: 0, quantity: 1, category: 'other' })}>
                                                    <Plus className="w-3 h-3 mr-1" /> 追加
                                                </Button>
                                            </div>
                                        </div>
                                        <Table>
                                            <TableBody>
                                                {otherItems.map((item) => (
                                                    <TableRow key={item.id} className="hover:bg-slate-50 group border-slate-100">
                                                        <TableCell className="w-[40%] p-2">
                                                            <input
                                                                className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 text-black font-medium"
                                                                value={item.name}
                                                                onChange={(e) => updateAdditionalCost(item.id, { name: e.target.value })}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right p-2">
                                                            <div className="flex items-center justify-end">
                                                                <span className="mr-1 text-slate-400 text-xs">¥</span>
                                                                <input
                                                                    type="number"
                                                                    className="w-24 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-right rounded px-1 text-black"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => updateAdditionalCost(item.id, { unitPrice: Number(e.target.value) })}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            <input
                                                                type="number"
                                                                className="w-12 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-center rounded px-1 text-black"
                                                                value={item.quantity}
                                                                onChange={(e) => updateAdditionalCost(item.id, { quantity: Number(e.target.value) })}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold p-2">¥{item.total.toLocaleString()}</TableCell>
                                                        <TableCell className="p-1 print:hidden w-8">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeAdditionalCost(item.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                                    <TableCell colSpan={3} className="text-right p-2">その他 小計</TableCell>
                                                    <TableCell className="text-right p-2">¥{otherSubtotal.toLocaleString()}</TableCell>
                                                    <TableCell className="print:hidden"></TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Grand Total Area */}
                        <div className="flex justify-end pt-8 break-inside-avoid shadow-none">
                            <div className="w-[320px] bg-slate-50 p-6 space-y-3 border-2 border-slate-800">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-500">割引対象小計 (Basis)</span>
                                    <span className="text-black font-semibold">¥{primarySubtotal.toLocaleString()}</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600 font-bold">
                                        <span>割引 ({discountType === 'percent' ? `${discountAmount}%` : '定額'})</span>
                                        <span>-¥{discountValue.toLocaleString()}</span>
                                    </div>
                                )}

                                {nonDiscountedBasis > 0 && (
                                    <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                                        <span className="font-medium text-slate-400 text-[10px]">非対象コスト合計</span>
                                        <span className="text-[10px] text-slate-600">¥{nonDiscountedBasis.toLocaleString()}</span>
                                    </div>
                                )}

                                <Separator className="my-1 bg-slate-300" />

                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-slate-600">税抜合計</span>
                                    <span className="text-black font-bold">¥{totalBeforeTax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-slate-500 text-[10px] flex items-center gap-1">
                                        消費税 ({activeTaxRate}%)
                                    </span>
                                    <span className="text-slate-700">¥{tax.toLocaleString()}</span>
                                </div>
                                <Separator className="my-2 bg-slate-800 h-0.5" />
                                <div className={`flex justify-between font-bold text-2xl text-black`}>
                                    <span>合計額</span>
                                    <span>¥{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="pt-12 text-sm text-slate-600">
                            <h4 className="font-bold text-black border-b border-slate-800 mb-2 pb-1 inline-block">備考 (Remarks)</h4>
                            <div className="whitespace-pre-wrap min-h-[80px] py-2">
                                {remarks || (
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>本見積もりの有効期限は発行日より1ヶ月とさせていただきます。</li>
                                        <li>振込手数料は貴社負担にてお願いいたします。</li>
                                        <li>仕様により、実費分（運搬費、宿泊費等）が変動する可能性がございます。</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
