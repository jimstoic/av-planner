"use client";

import React, { useMemo, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import { differenceInDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { StaffManager } from '@/modules/project/StaffManager';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Users } from 'lucide-react';

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
        additionalCosts
    } = useProjectStore();

    const { equipment } = useEquipmentStore();
    const [isInvoiceMode, setIsInvoiceMode] = useState(false);

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


    const totalEstimatedCost = staffSubtotal + equipmentSubtotal + productionSubtotal + otherSubtotal;
    const tax = Math.floor(totalEstimatedCost * 0.1);
    const grandTotal = totalEstimatedCost + tax;

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
                                {isInvoiceMode ? '請求モード (Invoice)' : '見積モード (Quote)'}
                            </Label>
                        </div>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> 印刷 / PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 font-sans print:p-0 print:overflow-visible">
                <div className="max-w-4xl mx-auto bg-white dark:bg-card shadow-lg rounded-none border overflow-hidden min-h-[1000px] print:shadow-none print:border-none print:w-full print:max-w-none print:min-h-0">
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
                                    <span className="text-3xl font-bold tracking-tight">¥{grandTotal.toLocaleString()}-</span>
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
                            <div className="w-[300px] bg-slate-50 dark:bg-muted/10 p-6 rounded-lg space-y-3 print:bg-transparent print:border print:border-slate-200">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">小計</span>
                                    <span>¥{totalEstimatedCost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-muted-foreground">消費税 (10%)</span>
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
                            <ul className="list-disc list-inside space-y-1">
                                <li>本見積もりの有効期限は発行日より1ヶ月とさせていただきます。</li>
                                <li>振込手数料は貴社負担にてお願いいたします。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
