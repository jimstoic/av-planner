import React, { useState } from 'react';
import { useProjectStore } from "@/store/projectStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Equipment } from '@/types/equipment';

export function QuotationView() {
    const {
        nodes,
        edges,
        additionalCosts,
        setAdditionalCosts
    } = useProjectStore();
    const [rate, setRate] = useState(1.0);

    // New Cost State
    const [newCost, setNewCost] = useState({ name: '', category: 'Labor', unitPrice: 0, quantity: 1 });

    // Calculate Equipment Costs from Nodes
    const equipmentItems = React.useMemo(() => {
        const map = new Map<string, { count: number; data: Equipment }>();
        nodes.forEach((node) => {
            if ((node.type === 'equipment' || node.type === 'equipmentNode') && node.data) {
                const equipmentData = node.data as unknown as Equipment;
                const originalId = node.data.equipmentId as string || equipmentData.id;
                if (originalId) {
                    if (map.has(originalId)) {
                        map.get(originalId)!.count++;
                    } else {
                        map.set(originalId, { data: equipmentData, count: 1 });
                    }
                }
            }
        });

        return Array.from(map.values()).map(item => ({
            ...item,
            unitPrice: item.data.dayRate || 0,
            lineTotal: (item.data.dayRate || 0) * item.count * rate
        }));
    }, [nodes, rate]);

    // Pricing Factors
    const CABLE_PRICE_PER_METER = 100; // JPY

    // Aggregate Cables
    const cableItems = React.useMemo(() => {
        const map = new Map<string, { count: number; lengthStr: string; type: string; totalLengthM: number }>();
        edges.forEach((edge) => {
            const type = (edge.data?.type as string) || 'Signal';
            // Safely handle length, ensuring it is treated as a string
            const rawLength = edge.data?.length ?? '1m';
            const lengthStr = String(rawLength);
            const lengthM = parseInt(lengthStr.replace('m', '')) || 1;
            const key = `${type}-${lengthStr}`;
            if (map.has(key)) {
                const item = map.get(key)!;
                item.count++;
                item.totalLengthM += lengthM;
            } else {
                map.set(key, { count: 1, type, lengthStr, totalLengthM: lengthM });
            }
        });

        return Array.from(map.values()).map(item => ({
            ...item,
            unitPrice: Math.round(item.totalLengthM * CABLE_PRICE_PER_METER / item.count),
            calculatedUnitPrice: (parseInt(item.lengthStr) || 1) * CABLE_PRICE_PER_METER,
            lineTotal: ((parseInt(item.lengthStr) || 1) * CABLE_PRICE_PER_METER) * item.count
        }));
    }, [edges]);

    const additionalItems = (additionalCosts || []).map(item => ({
        ...item,
        lineTotal: item.unitPrice * item.quantity
    }));

    const subTotalEquipment = equipmentItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const subTotalCables = cableItems.reduce((acc, item) => acc + item.lineTotal, 0);
    const subTotalAdditional = additionalItems.reduce((acc, item) => acc + item.lineTotal, 0);

    const subTotal = subTotalEquipment + subTotalCables + subTotalAdditional;
    const taxRate = 0.1;
    const taxAmount = subTotal * taxRate;
    const grandTotal = subTotal + taxAmount;

    // Handlers
    const handleAddCost = () => {
        if (!newCost.name) return;
        const newItem = {
            id: `cost-${Date.now()}`,
            ...newCost
        };
        setAdditionalCosts([...(additionalCosts || []), newItem]);
        setNewCost({ name: '', category: 'Labor', unitPrice: 0, quantity: 1 });
    };

    const handleRemoveCost = (id: string) => {
        setAdditionalCosts(additionalCosts.filter(c => c.id !== id));
    };

    // Export Logic
    const handleExportCSV = () => {
        const headers = ["Category", "Item", "Unit Price", "Qty", "Total"];
        const eqRows = equipmentItems.map(item => [
            "Equipment", item.data.name, item.unitPrice, item.count, item.lineTotal
        ]);
        const cabRows = cableItems.map(item => [
            "Cable", `${item.type} Cable ${item.lengthStr}`, item.calculatedUnitPrice, item.count, item.lineTotal
        ]);
        const addRows = additionalItems.map(item => [
            item.category, item.name, item.unitPrice, item.quantity, item.lineTotal
        ]);

        const csvContent = [
            headers.join(","),
            ...eqRows.map(row => row.join(",")),
            ...cabRows.map(row => row.join(",")),
            ...addRows.map(row => row.join(",")),
            `,,,Subtotal,${subTotal}`,
            `,,,Tax,${taxAmount}`,
            `,,,Grand Total,${grandTotal}`
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "quotation_av_planner.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    .quotation-print-container, .quotation-print-container * { visibility: visible; }
                    .quotation-print-container {
                        position: fixed; left: 0; top: 0; width: 100%; height: 100%;
                        margin: 0; padding: 40px; background: white; z-index: 9999;
                        border: none; box-shadow: none;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>
            <Card className="m-4 shadow-md bg-card w-full min-h-[300px] border quotation-print-container">
                <CardHeader className="bg-muted/10 pb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant="outline" className="mb-2">お見積もり</Badge>
                            <CardTitle className="text-xl">御見積書</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Generated by AV Planner</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 justify-end no-print">
                                <Label htmlFor="rate" className="text-sm">掛率:</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={rate}
                                    onChange={(e) => setRate(Math.max(0.1, parseFloat(e.target.value) || 1))}
                                    className="w-20 h-8 text-right bg-background"
                                />
                            </div>
                            <div className="flex gap-2 no-print">
                                <Button variant="outline" size="sm" onClick={handleExportCSV} title="CSV出力">
                                    <Download className="w-4 h-4 mr-1" /> CSV
                                </Button>
                                <Button variant="outline" size="sm" onClick={handlePrint} title="PDF保存 / 印刷">
                                    <Printer className="w-4 h-4 mr-1" /> PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="w-full">
                        <div className="w-full h-[calc(100vh-350px)] overflow-y-auto">
                            <div className="grid grid-cols-[1fr_100px_60px_100px_40px] gap-4 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground sticky top-0 backdrop-blur-sm z-10">
                                <div>項目</div>
                                <div className="text-right">単価</div>
                                <div className="text-right">数量</div>
                                <div className="text-right">金額</div>
                                <div className="no-print"></div>
                            </div>

                            <div className="text-sm pb-20">
                                {/* Equipment Section */}
                                {equipmentItems.length > 0 && (
                                    <div className="bg-muted/5 font-semibold text-xs text-muted-foreground uppercase tracking-wider py-2 px-4">
                                        機材費
                                    </div>
                                )}
                                {equipmentItems.map((item) => (
                                    <div key={item.data.id} className="grid grid-cols-[1fr_100px_60px_100px_40px] gap-4 p-4 border-b last:border-0 hover:bg-muted/5 items-center">
                                        <div>
                                            <div className="font-medium">{item.data.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.data.category}</div>
                                        </div>
                                        <div className="text-right">¥{item.unitPrice.toLocaleString()}</div>
                                        <div className="text-right">{item.count}</div>
                                        <div className="text-right font-medium">¥{Math.round(item.lineTotal).toLocaleString()}</div>
                                        <div></div>
                                    </div>
                                ))}

                                {/* Cables Section */}
                                {cableItems.length > 0 && (
                                    <div className="bg-muted/5 font-semibold text-xs text-muted-foreground uppercase tracking-wider py-2 px-4 border-t">
                                        ケーブル類
                                    </div>
                                )}
                                {cableItems.map((item) => (
                                    <div key={`cable-${item.type}-${item.lengthStr}`} className="grid grid-cols-[1fr_100px_60px_100px_40px] gap-4 p-4 border-b last:border-0 hover:bg-muted/5 items-center">
                                        <div>
                                            <div className="font-medium">{item.type} ケーブル</div>
                                            <div className="text-xs text-muted-foreground">{item.lengthStr}</div>
                                        </div>
                                        <div className="text-right">¥{item.calculatedUnitPrice.toLocaleString()}</div>
                                        <div className="text-right">{item.count}</div>
                                        <div className="text-right font-medium">¥{item.lineTotal.toLocaleString()}</div>
                                        <div></div>
                                    </div>
                                ))}

                                {/* Additional Costs Section */}
                                <div className="bg-muted/5 font-semibold text-xs text-muted-foreground uppercase tracking-wider py-2 px-4 border-t flex justify-between items-center group">
                                    <span>諸経費 (人件費・運搬費など)</span>
                                </div>

                                {additionalItems.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-[1fr_100px_60px_100px_40px] gap-4 p-4 border-b last:border-0 hover:bg-muted/5 items-center group">
                                        <div className="flex gap-2">
                                            <Input
                                                value={item.name}
                                                onChange={(e) => {
                                                    const newCosts = [...additionalCosts];
                                                    newCosts[index].name = e.target.value;
                                                    setAdditionalCosts(newCosts);
                                                }}
                                                className="h-8 text-sm border-transparent hover:border-input focus:border-input"
                                                placeholder="項目名"
                                            />
                                            <select
                                                className="h-8 text-sm border-transparent hover:border-input focus:border-input rounded bg-transparent px-2 w-24"
                                                value={item.category}
                                                onChange={(e) => {
                                                    const newCosts = [...additionalCosts];
                                                    newCosts[index].category = e.target.value;
                                                    setAdditionalCosts(newCosts);
                                                }}
                                            >
                                                <option value="Labor">人件費</option>
                                                <option value="Transport">運搬費</option>
                                                <option value="Misc">諸経費</option>
                                            </select>
                                        </div>
                                        <Input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => {
                                                const newCosts = [...additionalCosts];
                                                newCosts[index].unitPrice = Number(e.target.value);
                                                setAdditionalCosts(newCosts);
                                            }}
                                            className="h-8 text-sm text-right border-transparent hover:border-input focus:border-input"
                                        />
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const newCosts = [...additionalCosts];
                                                newCosts[index].quantity = Number(e.target.value);
                                                setAdditionalCosts(newCosts);
                                            }}
                                            className="h-8 text-sm text-right border-transparent hover:border-input focus:border-input"
                                        />
                                        <div className="text-right font-medium">¥{item.lineTotal.toLocaleString()}</div>
                                        <div className="text-center no-print">
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveCost(item.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500">
                                                <span className="sr-only">Delete</span>×
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Auto-Add Row (Always empty at bottom) */}
                                <div className="grid grid-cols-[1fr_100px_60px_100px_40px] gap-4 p-4 border-b bg-slate-50 dark:bg-slate-900/20 items-center no-print opacity-70 hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="入力して追加..."
                                            className="h-8 text-sm"
                                            value={newCost.name}
                                            onChange={(e) => {
                                                // Auto-create on type
                                                const name = e.target.value;
                                                if (name) {
                                                    const newItem = {
                                                        id: `cost-${Date.now()}`,
                                                        name: name,
                                                        category: newCost.category,
                                                        unitPrice: newCost.unitPrice || 0,
                                                        quantity: newCost.quantity || 1
                                                    };
                                                    setAdditionalCosts([...(additionalCosts || []), newItem]);
                                                    setNewCost({ name: '', category: 'Labor', unitPrice: 0, quantity: 1 });
                                                }
                                            }}
                                        />
                                        <select
                                            className="h-8 text-sm border rounded bg-background px-2 disabled:opacity-50"
                                            value={newCost.category}
                                            onChange={(e) => setNewCost({ ...newCost, category: e.target.value })}
                                            disabled={true} // Disable for the 'adder' row, logic moves to main row once created
                                        >
                                            <option value="Labor">人件費</option>
                                            <option value="Transport">運搬費</option>
                                            <option value="Misc">諸経費</option>
                                        </select>
                                    </div>
                                    <Input disabled placeholder="-" className="h-8 text-sm text-right border-transparent" />
                                    <Input disabled placeholder="-" className="h-8 text-sm text-right border-transparent" />
                                    <div className="text-right text-muted-foreground text-xs"></div>
                                    <div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                <Separator />

                <CardFooter className="flex flex-col gap-2 p-6 bg-muted/5">
                    <div className="flex justify-between w-full text-sm">
                        <span className="text-muted-foreground">小計</span>
                        <span>¥{Math.round(subTotal).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between w-full text-sm">
                        <span className="text-muted-foreground">消費税 (10%)</span>
                        <span>¥{Math.round(taxAmount).toLocaleString()}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between w-full text-lg font-bold">
                        <span>合計金額</span>
                        <span>¥{Math.round(grandTotal).toLocaleString()}</span>
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}
