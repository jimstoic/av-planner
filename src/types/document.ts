// ============================================================
// Document Types — Quotation / Invoice system
// ============================================================

// --- Line Items ---

export type LineItemType = 'normal' | 'text';
export type TaxCategory = 'taxable' | 'exempt';
export type SourceType = 'equipment' | 'staff' | 'manual';

export interface LineItem {
    id: string;
    type: LineItemType;
    name: string;
    description?: string;
    quantity: number;
    unit: string;              // '式', '日', '人日', '台', '本', 'セット' etc.
    unitPrice: number;
    taxCategory: TaxCategory;
    sortOrder: number;
    // Auto-fill source tracking
    sourceType?: SourceType;
    sourceId?: string;         // equipment.id or staff.id
}

// --- Sections ---

export interface DocumentSection {
    id: string;
    title: string;             // User-defined: "映像機材", "ネットワーク手配", "編集費" etc.
    items: LineItem[];
    sortOrder: number;
}

// --- Document ---

export type DocumentType = 'quotation' | 'invoice';

export type DocumentStatus =
    | 'draft'
    | 'issued'
    | 'accepted'
    | 'rejected'
    | 'paid'
    | 'overdue';

export interface CompanyInfo {
    name: string;
    zipCode: string;
    address: string;
    tel: string;
    email: string;
    registrationNumber?: string;  // インボイス制度の適格請求書発行事業者番号
}

export interface QuotationDocument {
    id: string;
    projectId: string;
    type: DocumentType;
    version: number;
    status: DocumentStatus;
    documentNumber: string;       // "Q-2026-0001-v1", "I-2026-0001"
    title: string;                // 件名

    sections: DocumentSection[];

    // Financials
    discountAmount: number;
    discountType: 'percent' | 'fixed';
    taxRate: number;

    // Text
    remarks: string;

    // Dates
    issueDate: Date;
    validUntil?: Date;            // 見積有効期限
    dueDate?: Date;               // 支払期限 (invoice only)

    // Company info snapshot
    companyInfo: CompanyInfo;

    // Metadata
    createdAt: Date;
    updatedAt: Date;

    // Link to the quotation this invoice was converted from
    sourceQuotationId?: string;
}

// --- Helpers ---

export const UNIT_OPTIONS = [
    { value: '式', label: '式' },
    { value: '日', label: '日' },
    { value: '人日', label: '人日' },
    { value: '台', label: '台' },
    { value: '本', label: '本' },
    { value: 'セット', label: 'セット' },
    { value: '個', label: '個' },
    { value: '回', label: '回' },
    { value: 'km', label: 'km' },
    { value: '時間', label: '時間' },
] as const;

export const STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
    draft: { label: '下書き', color: 'bg-slate-100 text-slate-700 border-slate-300' },
    issued: { label: '発行済', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    accepted: { label: '承認済', color: 'bg-green-100 text-green-700 border-green-300' },
    rejected: { label: '却下', color: 'bg-red-100 text-red-700 border-red-300' },
    paid: { label: '入金済', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    overdue: { label: '支払遅延', color: 'bg-orange-100 text-orange-700 border-orange-300' },
};

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
    name: '株式会社サンプル',
    zipCode: '〒100-0001',
    address: '東京都千代田区千代田1-1-1 サンプルビル3F',
    tel: '03-0000-0000',
    email: 'info@example.com',
    registrationNumber: 'T0000000000000',
};
