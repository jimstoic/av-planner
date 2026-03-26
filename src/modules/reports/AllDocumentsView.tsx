"use client";

import React from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { QuotationDocument, STATUS_CONFIG } from '@/types/document';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Receipt, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AllDocumentsView() {
    const documents = useDocumentStore(s => s.documents);

    if (documents.length === 0) {
        return (
            <div className="py-20 text-center border-2 border-dashed rounded-xl bg-muted/5">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">まだ書類がありません</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                    プロジェクトを開いて見積書・請求書を作成してください
                </p>
            </div>
        );
    }

    // Group by projectId, use doc.title as project name
    const groups = new Map<string, { projectTitle: string; docs: QuotationDocument[] }>();
    for (const doc of [...documents].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )) {
        if (!groups.has(doc.projectId)) {
            groups.set(doc.projectId, { projectTitle: doc.title, docs: [] });
        }
        groups.get(doc.projectId)!.docs.push(doc);
    }

    return (
        <div className="space-y-6">
            {[...groups.entries()].map(([projectId, { projectTitle, docs }]) => {
                const quotations = docs.filter(d => d.type === 'quotation');
                const invoices = docs.filter(d => d.type === 'invoice');

                return (
                    <Card key={projectId} className="border-muted/60">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                {projectTitle || '（無題プロジェクト）'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="divide-y">
                                {[...quotations, ...invoices].map(doc => {
                                    const statusCfg = STATUS_CONFIG[doc.status];
                                    const sourceDoc = doc.sourceQuotationId
                                        ? documents.find(d => d.id === doc.sourceQuotationId)
                                        : null;

                                    return (
                                        <div key={doc.id} className="py-2.5 flex items-center gap-3">
                                            {doc.type === 'quotation'
                                                ? <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                : <Receipt className="h-4 w-4 text-emerald-500 shrink-0" />
                                            }
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">{doc.documentNumber}</span>
                                                    {doc.version > 1 && (
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1">v{doc.version}</Badge>
                                                    )}
                                                    <Badge
                                                        variant="outline"
                                                        className={cn("text-[10px] h-4 px-1.5 border", statusCfg.color)}
                                                    >
                                                        {statusCfg.label}
                                                    </Badge>
                                                </div>
                                                {sourceDoc && (
                                                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-blue-500">
                                                        <Link2 className="h-2.5 w-2.5" />
                                                        元見積: {sourceDoc.documentNumber}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {format(new Date(doc.updatedAt), 'yyyy/MM/dd')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
