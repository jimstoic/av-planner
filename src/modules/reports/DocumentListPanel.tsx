"use client";

import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useProjectStore } from '@/store/projectStore';
import { QuotationDocument, STATUS_CONFIG, DocumentType } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Plus,
    FileText,
    Receipt,
    Copy,
    ArrowRightLeft,
    Trash2,
    ChevronRight,
    Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DocumentListPanel() {
    const projectId = useProjectStore(s => s.id);
    const {
        documents,
        activeDocumentId,
        setActiveDocument,
        createDocument,
        duplicateAsNewVersion,
        convertToInvoice,
        deleteDocument,
        getDocumentsForProject,
    } = useDocumentStore();

    const projectDocs = getDocumentsForProject(projectId);

    const quotations = projectDocs.filter(d => d.type === 'quotation');
    const invoices = projectDocs.filter(d => d.type === 'invoice');

    const handleCreate = (type: DocumentType) => {
        createDocument(projectId, type);
    };

    // Find source quotation document number for an invoice
    const getSourceQuotationNumber = (doc: QuotationDocument): string | null => {
        if (!doc.sourceQuotationId) return null;
        const source = documents.find(d => d.id === doc.sourceQuotationId);
        return source?.documentNumber || null;
    };

    const renderDocItem = (doc: QuotationDocument) => {
        const isActive = doc.id === activeDocumentId;
        const statusCfg = STATUS_CONFIG[doc.status];
        const isLocked = doc.status !== 'draft';
        const sourceNumber = getSourceQuotationNumber(doc);

        return (
            <div
                key={doc.id}
                className={cn(
                    "group p-3 rounded-lg cursor-pointer transition-all border",
                    isActive
                        ? "bg-primary/5 border-primary/30 shadow-sm"
                        : "bg-card hover:bg-accent/50 border-transparent hover:border-border"
                )}
                onClick={() => setActiveDocument(doc.id)}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-muted-foreground">
                                {doc.documentNumber}
                            </span>
                            {doc.version > 1 && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                    v{doc.version}
                                </Badge>
                            )}
                        </div>
                        <div className="text-sm font-medium truncate">{doc.title}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                                variant="outline"
                                className={cn("text-[10px] h-5 px-1.5 border", statusCfg.color)}
                            >
                                {statusCfg.label}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                                {format(new Date(doc.updatedAt), 'yyyy/MM/dd')}
                            </span>
                        </div>
                        {/* Source quotation reference for invoices */}
                        {sourceNumber && (
                            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-blue-500">
                                <Link2 className="h-2.5 w-2.5" />
                                <span>元見積: {sourceNumber}</span>
                            </div>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => duplicateAsNewVersion(doc.id)}>
                                <Copy className="h-3.5 w-3.5 mr-2" />
                                新バージョン作成
                            </DropdownMenuItem>
                            {doc.type === 'quotation' && (
                                <DropdownMenuItem onClick={() => convertToInvoice(doc.id)}>
                                    <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                                    請求書に変換
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {/* Delete with confirmation for non-draft docs */}
                            {isLocked ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                            削除
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                発行済ドキュメントの削除
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                「{doc.documentNumber}」は「{statusCfg.label}」状態です。
                                                削除すると復元できません。本当に削除しますか？
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                onClick={() => deleteDocument(doc.id)}
                                            >
                                                削除する
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteDocument(doc.id)}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    削除
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    };

    return (
        <div className="w-72 border-r bg-background flex flex-col h-full shrink-0">
            {/* Header */}
            <div className="p-4 border-b space-y-3">
                <h3 className="font-semibold text-sm">書類一覧</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => handleCreate('quotation')}
                    >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        見積書
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8"
                        onClick={() => handleCreate('invoice')}
                    >
                        <Receipt className="h-3.5 w-3.5 mr-1.5" />
                        請求書
                    </Button>
                </div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-4">
                    {/* Quotations */}
                    {quotations.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                                <FileText className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    見積書
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-auto">
                                    {quotations.length}
                                </Badge>
                            </div>
                            {quotations.map(renderDocItem)}
                        </div>
                    )}

                    {quotations.length > 0 && invoices.length > 0 && (
                        <Separator />
                    )}

                    {/* Invoices */}
                    {invoices.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                                <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    請求書
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-auto">
                                    {invoices.length}
                                </Badge>
                            </div>
                            {invoices.map(renderDocItem)}
                        </div>
                    )}

                    {/* Empty state */}
                    {projectDocs.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-medium mb-1">書類がありません</p>
                            <p className="text-xs opacity-70">
                                上のボタンから見積書または請求書を作成してください
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
