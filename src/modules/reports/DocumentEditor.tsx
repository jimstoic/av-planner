"use client";

import React, { useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useSettingsStore } from '@/store/settingsStore';
import { QuotationDocument, STATUS_CONFIG, DocumentStatus } from '@/types/document';
import { SectionEditor } from './SectionEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Plus,
    Percent,
    Lock,
    FileText,
    Settings2,
    Calendar,
    Link2,
    Undo2,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DocumentEditor() {
    const doc = useDocumentStore(s => s.getActiveDocument());
    const documents = useDocumentStore(s => s.documents);
    const { updateDocumentField, addSection, updateStatus } = useDocumentStore();
    const { currency } = useSettingsStore();

    // Status change confirmation dialog state
    const [pendingStatus, setPendingStatus] = useState<DocumentStatus | null>(null);
    const [showStatusDialog, setShowStatusDialog] = useState(false);

    if (!doc) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 mx-auto opacity-20" />
                    <p className="text-sm">左のパネルからドキュメントを選択してください</p>
                </div>
            </div>
        );
    }

    const isReadOnly = doc.status !== 'draft';

    // Find source quotation info for invoices
    const sourceQuotation = doc.sourceQuotationId
        ? documents.find(d => d.id === doc.sourceQuotationId)
        : null;

    // Calculate totals
    const sectionTotals = doc.sections.map(s => ({
        id: s.id,
        title: s.title,
        subtotal: s.items
            .filter(i => i.type === 'normal')
            .reduce((sum, i) => sum + i.quantity * (i.days || 1) * i.unitPrice, 0),
    }));

    const subtotalGross = sectionTotals.reduce((sum, s) => sum + s.subtotal, 0);

    const discountValue = doc.discountType === 'percent'
        ? Math.floor(subtotalGross * (doc.discountAmount / 100))
        : doc.discountAmount;

    const totalBeforeTax = subtotalGross - discountValue;
    const tax = Math.floor(totalBeforeTax * (doc.taxRate / 100));
    const grandTotal = totalBeforeTax + tax;

    const statusOptions: { value: DocumentStatus; label: string }[] = doc.type === 'quotation'
        ? [
            { value: 'draft', label: '下書き' },
            { value: 'issued', label: '発行済' },
            { value: 'accepted', label: '承認済' },
            { value: 'rejected', label: '却下' },
        ]
        : [
            { value: 'draft', label: '下書き' },
            { value: 'issued', label: '発行済' },
            { value: 'paid', label: '入金済' },
            { value: 'overdue', label: '支払遅延' },
        ];

    // Status change with confirmation
    const handleStatusChange = (newStatus: DocumentStatus) => {
        const isLocking = doc.status === 'draft' && newStatus !== 'draft';
        const isUnlocking = doc.status !== 'draft' && newStatus === 'draft';

        if (isLocking || isUnlocking) {
            setPendingStatus(newStatus);
            setShowStatusDialog(true);
        } else {
            updateStatus(doc.id, newStatus);
        }
    };

    const confirmStatusChange = () => {
        if (pendingStatus) {
            updateStatus(doc.id, pendingStatus);
        }
        setPendingStatus(null);
        setShowStatusDialog(false);
    };

    const getStatusDialogContent = () => {
        if (!pendingStatus) return { title: '', description: '' };

        const isUnlocking = pendingStatus === 'draft';
        if (isUnlocking) {
            return {
                title: 'ステータスを下書きに戻す',
                description: `「${doc.documentNumber}」を下書き状態に戻すと、再度編集可能になります。発行済の書類を変更すると取引先との整合性に影響する可能性があります。続行しますか？`,
            };
        }

        const targetLabel = statusOptions.find(o => o.value === pendingStatus)?.label || pendingStatus;
        return {
            title: `ステータスを「${targetLabel}」に変更`,
            description: `「${doc.documentNumber}」を「${targetLabel}」に変更すると、ドキュメントの編集がロックされます。内容を変更するには、下書き状態に戻すか、新しいバージョンを作成してください。`,
        };
    };

    const dialogContent = getStatusDialogContent();

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-background">
            {/* Toolbar */}
            <div className="border-b bg-background shadow-sm py-3 px-6 shrink-0 print:hidden">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-muted-foreground">
                            {doc.documentNumber}
                        </span>
                        <Select
                            value={doc.status}
                            onValueChange={(val) => handleStatusChange(val as DocumentStatus)}
                        >
                            <SelectTrigger className={cn("h-7 w-28 text-xs border", STATUS_CONFIG[doc.status].color)}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {statusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {isReadOnly && (
                            <Badge variant="outline" className="text-xs gap-1">
                                <Lock className="h-3 w-3" />
                                編集ロック中
                            </Badge>
                        )}
                        {/* Source quotation reference */}
                        {sourceQuotation && (
                            <Badge variant="secondary" className="text-xs gap-1">
                                <Link2 className="h-3 w-3" />
                                元見積: {sourceQuotation.documentNumber}
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Document Settings Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="space-y-4 text-sm">
                                    <h4 className="font-bold flex items-center gap-2">
                                        <Settings2 className="w-4 h-4" /> ドキュメント設定
                                    </h4>

                                    <div className="space-y-2">
                                        <Label className="text-xs">消費税率 (%)</Label>
                                        <Input
                                            type="number"
                                            value={doc.taxRate}
                                            onChange={(e) =>
                                                updateDocumentField(doc.id, { taxRate: Number(e.target.value) })
                                            }
                                            className="h-8"
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs">割引</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={doc.discountAmount}
                                                onChange={(e) =>
                                                    updateDocumentField(doc.id, { discountAmount: Number(e.target.value) })
                                                }
                                                className="h-8"
                                                disabled={isReadOnly}
                                            />
                                            <Button
                                                variant={doc.discountType === 'percent' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => updateDocumentField(doc.id, { discountType: 'percent' })}
                                                disabled={isReadOnly}
                                            >
                                                <Percent className="w-3 h-3" />
                                            </Button>
                                            <Button
                                                variant={doc.discountType === 'fixed' ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 px-2"
                                                onClick={() => updateDocumentField(doc.id, { discountType: 'fixed' })}
                                                disabled={isReadOnly}
                                            >
                                                <span className="text-[10px]">{currency}</span>
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-xs">発行日</Label>
                                        <Input
                                            type="date"
                                            value={format(new Date(doc.issueDate), 'yyyy-MM-dd')}
                                            onChange={(e) =>
                                                updateDocumentField(doc.id, { issueDate: new Date(e.target.value) })
                                            }
                                            className="h-8"
                                            disabled={isReadOnly}
                                        />
                                    </div>

                                    {doc.type === 'quotation' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">有効期限</Label>
                                            <Input
                                                type="date"
                                                value={doc.validUntil ? format(new Date(doc.validUntil), 'yyyy-MM-dd') : ''}
                                                onChange={(e) =>
                                                    updateDocumentField(doc.id, {
                                                        validUntil: e.target.value ? new Date(e.target.value) : undefined,
                                                    })
                                                }
                                                className="h-8"
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    )}

                                    {doc.type === 'invoice' && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">支払期限</Label>
                                            <Input
                                                type="date"
                                                value={doc.dueDate ? format(new Date(doc.dueDate), 'yyyy-MM-dd') : ''}
                                                onChange={(e) =>
                                                    updateDocumentField(doc.id, {
                                                        dueDate: e.target.value ? new Date(e.target.value) : undefined,
                                                    })
                                                }
                                                className="h-8"
                                                disabled={isReadOnly}
                                            />
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label className="text-xs">備考</Label>
                                        <Textarea
                                            value={doc.remarks}
                                            onChange={(e) =>
                                                updateDocumentField(doc.id, { remarks: e.target.value })
                                            }
                                            className="text-xs min-h-[80px]"
                                            placeholder="備考を入力してください..."
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {!isReadOnly && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => addSection(doc.id)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                セクション追加
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="max-w-4xl mx-auto p-8">
                    <div className="bg-white shadow-xl rounded-none border-none overflow-hidden min-h-[800px] text-black">
                        {/* Document Header */}
                        <div className="p-12 border-b bg-white">
                            <div className="flex justify-between items-start mb-10">
                                <div className="space-y-3">
                                    <h1
                                        className={cn(
                                            "text-4xl font-bold tracking-wider",
                                            doc.type === 'invoice' ? "text-emerald-600" : "text-blue-600"
                                        )}
                                    >
                                        {doc.type === 'invoice' ? '御 請 求 書' : '御 見 積 書'}
                                    </h1>
                                    <div className="text-sm space-y-1 text-slate-500">
                                        <p>No. {doc.documentNumber}</p>
                                        <p>発行日: {format(new Date(doc.issueDate), 'yyyy年MM月dd日')}</p>
                                        {doc.type === 'quotation' && doc.validUntil && (
                                            <p>有効期限: {format(new Date(doc.validUntil), 'yyyy年MM月dd日')}</p>
                                        )}
                                        {doc.type === 'invoice' && doc.dueDate && (
                                            <p>お支払期限: {format(new Date(doc.dueDate), 'yyyy年MM月dd日')}</p>
                                        )}
                                        {/* Source quotation reference in document header */}
                                        {sourceQuotation && (
                                            <p className="text-blue-500">
                                                元見積書: {sourceQuotation.documentNumber}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Company info */}
                                <div className="text-right text-sm text-slate-600 space-y-0.5">
                                    <p className="font-bold text-black text-base">{doc.companyInfo.name}</p>
                                    <p>{doc.companyInfo.zipCode}</p>
                                    <p>{doc.companyInfo.address}</p>
                                    <p>TEL: {doc.companyInfo.tel}</p>
                                    <p>Email: {doc.companyInfo.email}</p>
                                    {doc.companyInfo.registrationNumber && (
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            登録番号: {doc.companyInfo.registrationNumber}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Title & Project Info */}
                            <div className="mb-8 space-y-3">
                                {isReadOnly ? (
                                    <h2 className="text-xl font-bold text-slate-800">{doc.title}</h2>
                                ) : (
                                    <input
                                        className="text-xl font-bold text-slate-800 bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 w-full outline-none"
                                        value={doc.title}
                                        onChange={(e) => updateDocumentField(doc.id, { title: e.target.value })}
                                        placeholder="件名を入力..."
                                    />
                                )}
                                {(doc.clientName || doc.venue || doc.eventStartDate) && (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-600 border-t pt-3">
                                        {doc.clientName && (
                                            <div className="flex gap-2">
                                                <span className="text-slate-400 shrink-0">クライアント</span>
                                                <span className="font-medium text-slate-800">{doc.clientName}</span>
                                            </div>
                                        )}
                                        {doc.venue && (
                                            <div className="flex gap-2">
                                                <span className="text-slate-400 shrink-0">会場</span>
                                                <span className="font-medium text-slate-800">{doc.venue}</span>
                                            </div>
                                        )}
                                        {doc.eventStartDate && (
                                            <div className="flex gap-2">
                                                <span className="text-slate-400 shrink-0">実施日</span>
                                                <span className="font-medium text-slate-800">
                                                    {format(new Date(doc.eventStartDate), 'yyyy年MM月dd日')}
                                                    {doc.eventEndDate && ` 〜 ${format(new Date(doc.eventEndDate), 'yyyy年MM月dd日')}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Grand total banner */}
                            <div className="flex justify-end">
                                <div className="w-1/2 border-b-2 border-slate-800 pb-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-semibold text-slate-500">
                                            {doc.type === 'invoice' ? 'ご請求金額 (税込)' : '御見積金額 (税込)'}
                                        </span>
                                        <span className="text-3xl font-bold tracking-tight text-black">
                                            {currency}{grandTotal.toLocaleString()}-
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="p-12 space-y-10 bg-white">
                            {doc.sections
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((section, idx) => (
                                    <SectionEditor
                                        key={section.id}
                                        docId={doc.id}
                                        section={section}
                                        sectionIndex={idx}
                                        readOnly={isReadOnly}
                                        currency={currency}
                                    />
                                ))}

                            {doc.sections.length === 0 && !isReadOnly && (
                                <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p className="mb-3 text-sm">セクションがありません</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addSection(doc.id)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        最初のセクションを追加
                                    </Button>
                                </div>
                            )}

                            {/* Grand Total Area */}
                            <div className="flex justify-end pt-6 break-inside-avoid">
                                <div className="w-[320px] bg-slate-50 p-6 space-y-3 border-2 border-slate-800">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-500">小計</span>
                                        <span className="text-black font-semibold">
                                            {currency}{subtotalGross.toLocaleString()}
                                        </span>
                                    </div>

                                    {doc.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-red-600 font-bold">
                                            <span>
                                                割引 ({doc.discountType === 'percent' ? `${doc.discountAmount}%` : '定額'})
                                            </span>
                                            <span>-{currency}{discountValue.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <Separator className="my-1 bg-slate-300" />

                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-slate-600">税抜合計</span>
                                        <span className="text-black font-bold">
                                            {currency}{totalBeforeTax.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-500 text-[10px]">
                                            消費税 ({doc.taxRate}%)
                                        </span>
                                        <span className="text-slate-700">
                                            {currency}{tax.toLocaleString()}
                                        </span>
                                    </div>

                                    <Separator className="my-2 bg-slate-800 h-0.5" />

                                    <div className="flex justify-between font-bold text-2xl text-black">
                                        <span>合計額</span>
                                        <span>{currency}{grandTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Remarks */}
                            <div className="pt-8 text-sm text-slate-600">
                                <h4 className="font-bold text-black border-b border-slate-800 mb-2 pb-1 inline-block">
                                    備考 (Remarks)
                                </h4>
                                <div className="whitespace-pre-wrap min-h-[60px] py-2">
                                    {doc.remarks || (
                                        <ul className="list-disc list-inside space-y-1 text-xs">
                                            <li>本{doc.type === 'invoice' ? '請求書' : '見積もり'}の有効期限は発行日より1ヶ月とさせていただきます。</li>
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

            {/* Status Change Confirmation Dialog */}
            <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogContent.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingStatus(null)}>
                            キャンセル
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={confirmStatusChange}>
                            {pendingStatus === 'draft' ? (
                                <><Undo2 className="h-3.5 w-3.5 mr-1.5" />下書きに戻す</>
                            ) : (
                                '変更する'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
