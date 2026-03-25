"use client";

import React from 'react';
import { DocumentSection, LineItem, UNIT_OPTIONS } from '@/types/document';
import { useDocumentStore } from '@/store/documentStore';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Type, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionEditorProps {
    docId: string;
    section: DocumentSection;
    sectionIndex: number;
    readOnly?: boolean;
    currency?: string;
}

export function SectionEditor({
    docId,
    section,
    sectionIndex,
    readOnly = false,
    currency = '¥',
}: SectionEditorProps) {
    const {
        updateSectionTitle,
        removeSection,
        addLineItem,
        removeLineItem,
        updateLineItem,
    } = useDocumentStore();

    const sectionSubtotal = section.items
        .filter(i => i.type === 'normal')
        .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    return (
        <div className="space-y-2">
            {/* Section Header */}
            <div className="flex justify-between items-end border-b-2 pb-1 border-slate-800">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-400 tabular-nums">
                        {sectionIndex + 1}.
                    </span>
                    {readOnly ? (
                        <h3 className="font-bold text-lg text-black">{section.title}</h3>
                    ) : (
                        <input
                            className="font-bold text-lg text-black bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 outline-none"
                            value={section.title}
                            onChange={(e) =>
                                updateSectionTitle(docId, section.id, e.target.value)
                            }
                        />
                    )}
                </div>
                {!readOnly && (
                    <div className="flex gap-1 print:hidden items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addLineItem(docId, section.id, 'normal')}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            通常行
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addLineItem(docId, section.id, 'text')}
                        >
                            <Type className="w-3 h-3 mr-1" />
                            テキスト行
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-300 hover:text-destructive"
                            onClick={() => removeSection(docId, section.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Line Items Table */}
            {section.items.length > 0 ? (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="text-slate-800 font-bold w-[40%]">内容</TableHead>
                            <TableHead className="text-center text-slate-800 font-bold w-20">数量</TableHead>
                            <TableHead className="text-center text-slate-800 font-bold w-20">単位</TableHead>
                            <TableHead className="text-right text-slate-800 font-bold w-28">単価</TableHead>
                            <TableHead className="text-right text-slate-800 font-bold w-28">金額</TableHead>
                            {!readOnly && (
                                <TableHead className="w-10 print:hidden"></TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {section.items
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((item) => (
                                <React.Fragment key={item.id}>
                                    {item.type === 'text' ? (
                                        // Text-only row
                                        <TableRow className="border-slate-100 hover:bg-slate-50 group">
                                            <TableCell colSpan={readOnly ? 5 : 5} className="p-2">
                                                <div className="flex items-center gap-2">
                                                    <AlignLeft className="h-3 w-3 text-slate-300 shrink-0" />
                                                    {readOnly ? (
                                                        <span className="text-sm text-slate-500 italic">{item.name}</span>
                                                    ) : (
                                                        <input
                                                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-sm text-slate-500 italic outline-none"
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                updateLineItem(docId, section.id, item.id, { name: e.target.value })
                                                            }
                                                            placeholder="メモ・備考を入力..."
                                                        />
                                                    )}
                                                </div>
                                            </TableCell>
                                            {!readOnly && (
                                                <TableCell className="p-2 print:hidden text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100"
                                                        onClick={() => removeLineItem(docId, section.id, item.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ) : (
                                        // Normal row
                                        <TableRow className="border-slate-100 hover:bg-slate-50 group">
                                            {/* Name */}
                                            <TableCell className="p-2">
                                                {readOnly ? (
                                                    <div>
                                                        <div className="font-medium text-black text-sm">{item.name}</div>
                                                        {item.description && (
                                                            <div className="text-[10px] text-slate-400 mt-0.5">{item.description}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <input
                                                            className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 text-black font-medium text-sm outline-none"
                                                            value={item.name}
                                                            onChange={(e) =>
                                                                updateLineItem(docId, section.id, item.id, { name: e.target.value })
                                                            }
                                                            placeholder="品名を入力..."
                                                        />
                                                        <input
                                                            className="w-full bg-transparent border-none focus:ring-0 text-[10px] text-slate-400 px-1 -ml-1 outline-none"
                                                            value={item.description || ''}
                                                            onChange={(e) =>
                                                                updateLineItem(docId, section.id, item.id, { description: e.target.value })
                                                            }
                                                            placeholder="備考..."
                                                        />
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Quantity */}
                                            <TableCell className="text-center p-2">
                                                {readOnly ? (
                                                    <span>{item.quantity}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="w-16 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-center rounded px-1 text-black outline-none"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateLineItem(docId, section.id, item.id, { quantity: Number(e.target.value) })
                                                        }
                                                    />
                                                )}
                                            </TableCell>

                                            {/* Unit */}
                                            <TableCell className="text-center p-2">
                                                {readOnly ? (
                                                    <span className="text-sm">{item.unit}</span>
                                                ) : (
                                                    <Select
                                                        value={item.unit}
                                                        onValueChange={(val) =>
                                                            updateLineItem(docId, section.id, item.id, { unit: val })
                                                        }
                                                    >
                                                        <SelectTrigger className="h-7 w-16 text-xs border-none shadow-none">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {UNIT_OPTIONS.map(opt => (
                                                                <SelectItem key={opt.value} value={opt.value}>
                                                                    {opt.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </TableCell>

                                            {/* Unit Price */}
                                            <TableCell className="text-right p-2">
                                                {readOnly ? (
                                                    <span>{currency}{item.unitPrice.toLocaleString()}</span>
                                                ) : (
                                                    <div className="flex items-center justify-end">
                                                        <span className="mr-1 text-slate-400 text-xs">{currency}</span>
                                                        <input
                                                            type="number"
                                                            className="w-24 bg-transparent border-none focus:ring-1 focus:ring-blue-500 text-right rounded px-1 text-black outline-none"
                                                            value={item.unitPrice}
                                                            onChange={(e) =>
                                                                updateLineItem(docId, section.id, item.id, { unitPrice: Number(e.target.value) })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </TableCell>

                                            {/* Amount */}
                                            <TableCell className="text-right font-semibold p-2 text-black">
                                                {currency}{(item.quantity * item.unitPrice).toLocaleString()}
                                            </TableCell>

                                            {/* Delete */}
                                            {!readOnly && (
                                                <TableCell className="p-2 print:hidden text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-slate-300 hover:text-destructive opacity-0 group-hover:opacity-100"
                                                        onClick={() => removeLineItem(docId, section.id, item.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}

                        {/* Subtotal */}
                        <TableRow className="bg-slate-50 font-bold border-t-2 border-slate-200">
                            <TableCell colSpan={4} className="text-right p-2 text-sm">
                                {section.title} 小計
                            </TableCell>
                            <TableCell className="text-right p-2 text-sm">
                                {currency}{sectionSubtotal.toLocaleString()}
                            </TableCell>
                            {!readOnly && <TableCell className="print:hidden"></TableCell>}
                        </TableRow>
                    </TableBody>
                </Table>
            ) : (
                !readOnly && (
                    <div className="py-4 text-center text-muted-foreground text-xs border border-dashed rounded-md">
                        <p>明細行がありません</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs h-7"
                            onClick={() => addLineItem(docId, section.id, 'normal')}
                        >
                            <Plus className="w-3 h-3 mr-1" />
                            行を追加
                        </Button>
                    </div>
                )
            )}
        </div>
    );
}
