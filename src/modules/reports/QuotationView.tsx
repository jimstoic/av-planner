"use client";

import React, { useState } from 'react';
import { DocumentListPanel } from './DocumentListPanel';
import { DocumentEditor } from './DocumentEditor';
import { DocumentPreview } from './DocumentPreview';
import { useDocumentStore } from '@/store/documentStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenLine, Eye } from 'lucide-react';

export function QuotationView() {
    const activeDocumentId = useDocumentStore(s => s.activeDocumentId);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    return (
        <div className="flex h-full w-full bg-background overflow-hidden">
            {/* Left: Document List Panel */}
            <DocumentListPanel />

            {/* Right: Editor or Preview */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* View Mode Tabs (only when a document is selected) */}
                {activeDocumentId && (
                    <div className="border-b bg-muted/30 px-6 py-1 shrink-0">
                        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'edit' | 'preview')}>
                            <TabsList className="h-8 bg-transparent p-0 gap-4">
                                <TabsTrigger
                                    value="edit"
                                    className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <PenLine className="h-3.5 w-3.5 mr-1.5" />
                                    編集
                                </TabsTrigger>
                                <TabsTrigger
                                    value="preview"
                                    className="h-7 px-3 text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                    プレビュー
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                )}

                {viewMode === 'edit' ? <DocumentEditor /> : <DocumentPreview />}
            </div>
        </div>
    );
}
