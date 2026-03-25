"use client";

import React, { useRef, useState } from 'react';
import { useDocumentStore } from '@/store/documentStore';
import { useSettingsStore } from '@/store/settingsStore';
import { QuotationDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export function DocumentPreview() {
    const doc = useDocumentStore(s => s.getActiveDocument());
    const documents = useDocumentStore(s => s.documents);
    const { currency } = useSettingsStore();
    const contentRef = useRef<HTMLDivElement>(null);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Find source quotation for invoices
    const sourceQuotation = doc?.sourceQuotationId
        ? documents.find(d => d.id === doc.sourceQuotationId)
        : null;

    if (!doc) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 mx-auto opacity-20" />
                    <p className="text-sm">ドキュメントを選択してプレビューを表示</p>
                </div>
            </div>
        );
    }

    // Calculate totals (same logic as DocumentEditor)
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

    const themeColor = doc.type === 'invoice' ? 'text-emerald-600' : 'text-blue-600';

    const handleExportPDF = async () => {
        if (!contentRef.current || !doc) return;
        setIsExportingPdf(true);
        try {
            const el = contentRef.current;

            // --- 1. Temporarily expand element to full A4-friendly width ---
            // overflow:hidden + flex layout limits el.scrollWidth to visible width,
            // so we must directly set inline styles and wait for browser re-layout.
            const savedOverflow = el.style.overflow;
            const savedWidth = el.style.width;
            const savedMaxWidth = el.style.maxWidth;
            const savedPosition = el.style.position;
            const savedMinHeight = el.style.minHeight;

            el.style.overflow = 'visible';
            el.style.width = '900px';
            el.style.maxWidth = 'none';
            el.style.position = 'relative';
            el.style.minHeight = 'auto';

            // Wait two animation frames for browser to reflow
            await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));

            const captureW = el.offsetWidth;   // should now be 900
            const captureH = el.scrollHeight;  // full content height

            // --- 2. Capture at expanded dimensions ---
            const dataUrl = await toPng(el, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                width: captureW,
                height: captureH,
            });

            // --- 3. Restore original styles ---
            el.style.overflow = savedOverflow;
            el.style.width = savedWidth;
            el.style.maxWidth = savedMaxWidth;
            el.style.position = savedPosition;
            el.style.minHeight = savedMinHeight;

            // --- 4. Generate multi-page A4 PDF ---
            const A4_W = 210;  // mm
            const A4_H = 297;  // mm
            const MARGIN = 10; // mm
            const printW = A4_W - MARGIN * 2; // 190mm

            // 96dpi: 1px = 0.264583mm
            const PX_TO_MM = 0.264583;
            const imgWmm = captureW * PX_TO_MM;
            const imgHmm = captureH * PX_TO_MM;
            const scale = printW / imgWmm;
            const scaledHmm = imgHmm * scale;
            const pageContentH = A4_H - MARGIN * 2;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            let page = 0;
            let yDrawn = 0;
            while (yDrawn < scaledHmm) {
                if (page > 0) pdf.addPage();
                pdf.addImage(dataUrl, 'PNG', MARGIN, MARGIN - yDrawn, printW, scaledHmm);
                yDrawn += pageContentH;
                page++;
            }

            pdf.save(`${doc.documentNumber}.pdf`);
            toast.success('PDFを書き出しました');
        } catch (e) {
            console.error(e);
            // Restore styles even on error
            if (contentRef.current) {
                contentRef.current.style.overflow = '';
                contentRef.current.style.width = '';
                contentRef.current.style.maxWidth = '';
            }
            toast.error('PDF書き出しに失敗しました');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportCSV = () => {
        try {
            const rows: (string | number)[][] = [
                ['セクション', '品名', '数量', '単位', '日数', '単価', '金額'],
            ];

            doc.sections.forEach(section => {
                section.items.forEach(item => {
                    if (item.type === 'normal') {
                        rows.push([
                            section.title,
                            item.name,
                            item.quantity,
                            item.unit,
                            item.days || 1,
                            item.unitPrice,
                            item.quantity * (item.days || 1) * item.unitPrice,
                        ]);
                    } else {
                        rows.push([section.title, item.name, '', '', '', '', '']);
                    }
                });
            });

            rows.push([]);
            rows.push(['小計', '', '', '', '', '', subtotalGross]);
            if (doc.discountAmount > 0) {
                rows.push([
                    `割引 (${doc.discountType === 'percent' ? doc.discountAmount + '%' : '定額'})`,
                    '', '', '', '', '', -discountValue,
                ]);
            }
            rows.push(['税抜合計', '', '', '', '', '', totalBeforeTax]);
            rows.push([`消費税 (${doc.taxRate}%)`, '', '', '', '', '', tax]);
            rows.push(['合計額', '', '', '', '', '', grandTotal]);

            const csvContent = "data:text/csv;charset=utf-8,"
                + rows.map(e => e.join(",")).join("\n");

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${doc.documentNumber}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSVを書き出しました");
        } catch (e) {
            console.error(e);
            toast.error("CSV書き出しに失敗しました");
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-background">
            {/* Toolbar */}
            <div className="border-b bg-background shadow-sm py-3 px-6 shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">プレビュー</span>
                        <span className="text-xs text-muted-foreground font-mono">{doc.documentNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
                            <Download className="mr-1.5 h-3.5 w-3.5" /> CSV
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportPDF} disabled={isExportingPdf}>
                            {isExportingPdf ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
                            PDF保存
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.print()}>
                            <Printer className="mr-1.5 h-3.5 w-3.5" /> 印刷
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
                <div
                    ref={contentRef}
                    className="max-w-4xl mx-auto bg-white shadow-xl rounded-none border-none overflow-hidden min-h-[1000px] text-black print:shadow-none print:w-full"
                >
                    {/* Header */}
                    <div className="p-12 border-b bg-white">
                        <div className="flex justify-between items-start mb-12">
                            <div className="space-y-4">
                                <h1 className={`text-4xl font-bold tracking-wider ${themeColor}`}>
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
                                    {sourceQuotation && (
                                        <p className="text-blue-500">
                                            元見積書: {sourceQuotation.documentNumber}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Company Info */}
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

                        {/* Title */}
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-slate-800">{doc.title || '件名未設定'}</h2>
                        </div>

                        {/* Grand Total Banner */}
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
                                <div key={section.id} className="space-y-4">
                                    <div className="border-b-2 pb-1 border-slate-800">
                                        <h3 className="font-bold text-lg text-black">
                                            {idx + 1}. {section.title}
                                        </h3>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                <th className="text-left py-2 font-bold text-slate-800">品名</th>
                                                <th className="text-center py-2 font-bold text-slate-800 w-14">数量</th>
                                                <th className="text-center py-2 font-bold text-slate-800 w-14">単位</th>
                                                <th className="text-center py-2 font-bold text-slate-800 w-14">日数</th>
                                                <th className="text-right py-2 font-bold text-slate-800 w-22">単価</th>
                                                <th className="text-right py-2 font-bold text-slate-800 w-28">金額</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items
                                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                                .map(item => (
                                                    <tr key={item.id} className="border-b border-slate-100">
                                                        {item.type === 'text' ? (
                                                            <td colSpan={6} className="py-2 text-slate-500 italic">
                                                                {item.name}
                                                            </td>
                                                        ) : (
                                                            <>
                                                                <td className="py-2">
                                                                    <div className="font-medium text-black">{item.name}</div>
                                                                </td>
                                                                <td className="text-center py-2">{item.quantity}</td>
                                                                <td className="text-center py-2 text-slate-600">{item.unit}</td>
                                                                <td className="text-center py-2">{item.days || 1}</td>
                                                                <td className="text-right py-2">{currency}{item.unitPrice.toLocaleString()}</td>
                                                                <td className="text-right py-2 font-semibold">
                                                                    {currency}{(item.quantity * (item.days || 1) * item.unitPrice).toLocaleString()}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                                <td colSpan={5} className="text-right py-2 pr-4">
                                                    {section.title} 小計
                                                </td>
                                                <td className="text-right py-2">
                                                    {currency}{sectionTotals.find(st => st.id === section.id)?.subtotal.toLocaleString() ?? 0}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ))}

                        {/* Grand Total Area */}
                        <div className="flex justify-end pt-8 break-inside-avoid">
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
                        <div className="pt-12 text-sm text-slate-600">
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

                        {/* Bank Info for Invoices */}
                        {doc.type === 'invoice' && doc.companyInfo.bankInfo && (
                            <div className="pt-8 text-sm break-inside-avoid">
                                <h4 className="font-bold text-black border-b border-slate-800 mb-2 pb-1 inline-block">
                                    お振込先
                                </h4>
                                <div className="bg-slate-50 p-4 rounded border space-y-1">
                                    <div className="flex gap-8">
                                        <div>
                                            <span className="text-slate-500 text-xs">金融機関:</span>
                                            <span className="ml-2 font-medium text-black">{doc.companyInfo.bankInfo.bankName}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-xs">支店:</span>
                                            <span className="ml-2 font-medium text-black">{doc.companyInfo.bankInfo.branchName}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-8">
                                        <div>
                                            <span className="text-slate-500 text-xs">口座種別:</span>
                                            <span className="ml-2 font-medium text-black">{doc.companyInfo.bankInfo.accountType}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 text-xs">口座番号:</span>
                                            <span className="ml-2 font-medium text-black font-mono">{doc.companyInfo.bankInfo.accountNumber}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 text-xs">口座名義:</span>
                                        <span className="ml-2 font-medium text-black">{doc.companyInfo.bankInfo.accountHolder}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
