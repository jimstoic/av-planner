"use client";

import React, { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import { differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer, Check, Download, Settings2, Percent, Calculator, Info, FileText } from 'lucide-react';
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
        updateQuotationSettings
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

    // 1. Staff Costs
    const staffItems = useMemo(() => {
        return staff.map(s => ({
            ...s,
            quantity: 1, // Staff usually 1 person
            days: s.daysAssigned || duration,
            total: s.dayRate * (s.daysAssigned || duration)
        }));
    }, [staff, duration]);
    const staffSubtotal = staffItems.reduce((acc, item) => acc + item.total, 0);

    // 2. Equipment Costs (From Diagram Count)
    const equipmentItems = useMemo(() => {
        return selectedEquipmentIds.map(id => {
            const item = equipment.find(e => e.id === id);
            if (!item) return null;

            // Count nodes using this equipment
            const nodeCount = nodes.filter(n => n.data?.equipmentId === id).length;
            // Quantity is at least 1 (if in list), or count from nodes
            const quantity = Math.max(1, nodeCount);

            return {
                ...item,
                quantity: quantity,
                days: duration,
                total: (item.dayRate || 0) * quantity * duration
            };
        }).filter(Boolean) as (typeof equipment[0] & { quantity: number, days: number, total: number })[];
    }, [selectedEquipmentIds, equipment, duration, nodes]);
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
                ...equipmentItems.map(e => ['Equipment', e.name, e.manufacturer, e.dayRate, e.quantity, e.days, e.total]),
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

    const themeColor = isInvoiceMode ? "text-emerald-600 border-emerald-500" : "text-blue-600 border-blue-500";
    const highlightColor = isInvoiceMode ? "bg-emerald-600" : "bg-blue-600";

    return (
        <div className="flex flex-col h-full w-full bg-slate-50/50 dark:bg-background overflow-hidden print:bg-white print:overflow-visible print:h-auto">
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 font-sans print:p-0 print:overflow-visible">
                <div ref={contentRef} className="max-w-4xl mx-auto bg-white dark:bg-card shadow-lg rounded-none border overflow-hidden min-h-[1000px] print:shadow-none print:border-none print:w-full print:max-w-none print:min-h-0">
                    {/* Document Header */}
                    <div className="p-12 border-b bg-white">
                        <div className="flex justify-between items-start mb-12">
                            <div className="space-y-4">
                                <h1 className={`text-4xl font-bold tracking-wider ${themeColor.split(' ')[0]}`}>
                                    {isInvoiceMode ? '御 請 求 書' : '御 見 積 書'}
                                </h1>
                                <div className="text-sm space-y-1 text-muted-foreground">
                                    <p>No. {new Date().getTime().toString().slice(-6)}</p>
                                    <p>発行日: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right space-y-2">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{clientName || '顧客名未設定'} 御中</h2>
                                <div className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg text-left w-64">
                                    <p className="font-semibold mb-1">件名: {projectName}</p>
                                    <p>会場: {venue}</p>
                                    <p>期間: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mb-8">
                            <div className="w-1/2 border-b-2 border-slate-200 pb-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        {isInvoiceMode ? 'ご請求金額 (税込)' : '御見積金額 (税込)'}
                                    </span>
                                    <span className="text-3xl font-bold tracking-tight">{currency}{grandTotal.toLocaleString()}-</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-12 space-y-12">
                        {/* 1. Staff */}
                        {/* 1. Staff */}
                        <div>
                            <div className="flex justify-between items-end mb-4 border-b-2 pb-1 border-blue-500">
                                <h3 className={`font-bold text-lg ${themeColor} border-none mb-0 pb-0`}>
                                    1. 人件費 (Personnel Expenses)
                                </h3>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-primary print:hidden">
                                            <Users className="w-3 h-3 mr-1" />
                                            スタッフ管理
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl print:hidden">
                                        <StaffManager />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[40%] text-slate-600">内容</TableHead>
                                        <TableHead className="text-right text-slate-600">単価</TableHead>
                                        <TableHead className="text-center text-slate-600">人・日</TableHead>
                                        <TableHead className="text-right text-slate-600">金額</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {staffItems.map((item) => (
                                        <TableRow key={item.id} className="border-b-slate-100">
                                            <TableCell className="font-medium">{item.name} <span className="text-xs text-muted-foreground ml-2">({item.role})</span></TableCell>
                                            <TableCell className="text-right">¥{item.dayRate.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">{item.days}</TableCell>
                                            <TableCell className="text-right">¥{item.total.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/5 font-semibold">
                                        <TableCell colSpan={3} className="text-right">小計</TableCell>
                                        <TableCell className="text-right">¥{staffSubtotal.toLocaleString()}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* 2. Equipment */}
                        <div className="break-before-auto">
                            <h3 className={`font-bold text-lg mb-4 border-b-2 pb-1 ${themeColor}`}>
                                2. 機材費 (Equipment Expenses)
                            </h3>
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-[40%] text-slate-600">内容</TableHead>
                                        <TableHead className="text-right text-slate-600">単価</TableHead>
                                        <TableHead className="text-center text-slate-600">数量 × 日数</TableHead>
                                        <TableHead className="text-right text-slate-600">金額</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {equipmentItems.map((item) => (
                                        <TableRow key={item.id} className="border-b-slate-100">
                                            <TableCell className="font-medium">
                                                {item.name}
                                                <div className="text-[10px] text-muted-foreground">{item.manufacturer}</div>
                                            </TableCell>
                                            <TableCell className="text-right">¥{item.dayRate?.toLocaleString()}</TableCell>
                                            <TableCell className="text-center">
                                                <span className="mx-1">{item.quantity}</span>
                                                <span className="text-muted-foreground mx-1">×</span>
                                                <span className="mx-1">{item.days}</span>
                                            </TableCell>
                                            <TableCell className="text-right">¥{item.total.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/5 font-semibold">
                                        <TableCell colSpan={3} className="text-right">小計</TableCell>
                                        <TableCell className="text-right">¥{equipmentSubtotal.toLocaleString()}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {(productionItems.length > 0 || otherItems.length > 0) && (
                            <>
                                {/* 3. Production */}
                                {productionItems.length > 0 && (
                                    <div className="break-before-auto">
                                        <h3 className={`font-bold text-lg mb-4 border-b-2 pb-1 ${themeColor}`}>
                                            3. 制作費 (Production Expenses)
                                        </h3>
                                        <Table>
                                            <TableBody>
                                                {productionItems.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="w-[40%] font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">¥{item.total.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-muted/5 font-semibold">
                                                    <TableCell colSpan={3} className="text-right">小計</TableCell>
                                                    <TableCell className="text-right">¥{productionSubtotal.toLocaleString()}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* 4. Other */}
                                {otherItems.length > 0 && (
                                    <div className="break-before-auto">
                                        <h3 className={`font-bold text-lg mb-4 border-b-2 pb-1 ${themeColor}`}>
                                            4. その他 (Other Expenses)
                                        </h3>
                                        <Table>
                                            <TableBody>
                                                {otherItems.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="w-[40%] font-medium">{item.name}</TableCell>
                                                        <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                                        <TableCell className="text-right">¥{item.total.toLocaleString()}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-muted/5 font-semibold">
                                                    <TableCell colSpan={3} className="text-right">小計</TableCell>
                                                    <TableCell className="text-right">¥{otherSubtotal.toLocaleString()}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Grand Total Area */}
                        <div className="flex justify-end pt-8 break-inside-avoid">
                            <div className="w-[320px] bg-slate-50 dark:bg-muted/10 p-6 rounded-lg space-y-3 print:bg-transparent print:border print:border-slate-200">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">割引対象小計 (Basis)</span>
                                    <span>¥{primarySubtotal.toLocaleString()}</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-red-600 font-medium">
                                        <span>割引 ({discountType === 'percent' ? `${discountAmount}%` : '定額'})</span>
                                        <span>-¥{discountValue.toLocaleString()}</span>
                                    </div>
                                )}

                                {nonDiscountedBasis > 0 && (
                                    <div className="flex justify-between text-sm pt-1">
                                        <span className="font-medium text-muted-foreground text-[10px]">非対象コスト合計</span>
                                        <span className="text-[10px]">¥{nonDiscountedBasis.toLocaleString()}</span>
                                    </div>
                                )}

                                <Separator className="my-1 bg-slate-200" />

                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">税抜合計</span>
                                    <span>¥{totalBeforeTax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground text-[10px] flex items-center gap-1">
                                        消費税 ({activeTaxRate}%)
                                        {taxRateOverride !== undefined && <Info className="w-2 h-2" />}
                                    </span>
                                    <span>¥{tax.toLocaleString()}</span>
                                </div>
                                <Separator className="my-2 bg-slate-300" />
                                <div className={`flex justify-between font-bold text-xl ${isInvoiceMode ? "text-emerald-700" : "text-blue-700"}`}>
                                    <span>合計</span>
                                    <span>¥{grandTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="pt-8 text-sm text-muted-foreground">
                            <h4 className="font-bold text-slate-700 mb-2">備考</h4>
                            <div className="whitespace-pre-wrap min-h-[60px] border-l-4 border-slate-200 pl-4 py-1 italic">
                                {remarks || (
                                    <ul className="list-disc list-inside space-y-1 not-italic">
                                        <li>本見積もりの有効期限は発行日より1ヶ月とさせていただきます。</li>
                                        <li>振込手数料は貴社負担にてお願いいたします。</li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
