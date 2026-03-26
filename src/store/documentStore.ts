import { create } from 'zustand';
import {
    QuotationDocument,
    DocumentSection,
    LineItem,
    DocumentType,
    DocumentStatus,
    DEFAULT_COMPANY_INFO,
} from '@/types/document';
import { useProjectStore } from './projectStore';
import { useEquipmentStore } from './equipmentStore';
import { useSettingsStore } from './settingsStore';
import { differenceInDays } from 'date-fns';

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateDocumentNumber(type: DocumentType, existingDocs: QuotationDocument[]): string {
    const prefix = type === 'quotation' ? 'Q' : 'I';
    const year = new Date().getFullYear();
    const pattern = new RegExp(`^${prefix}-${year}-(\\d+)`);
    let maxSeq = 0;
    existingDocs.forEach(doc => {
        const match = doc.documentNumber.match(pattern);
        if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
    });
    return `${prefix}-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
}

function createLineItem(overrides: Partial<LineItem> = {}): LineItem {
    return {
        id: generateId(),
        type: 'normal',
        name: '',
        quantity: 1,
        unit: '式',
        days: 1,
        unitPrice: 0,
        taxCategory: 'taxable',
        sortOrder: 0,
        ...overrides,
    };
}

function createSection(overrides: Partial<DocumentSection> = {}): DocumentSection {
    return {
        id: generateId(),
        title: '新規セクション',
        items: [],
        sortOrder: 0,
        ...overrides,
    };
}

// ドキュメントIDごとのデバウンスタイマー
const saveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleSyncDocument(docId: string, getDoc: () => QuotationDocument | undefined) {
    if (saveTimers[docId]) clearTimeout(saveTimers[docId]);
    saveTimers[docId] = setTimeout(() => {
        const doc = getDoc();
        if (!doc) return;
        fetch(`/api/db/documents/${docId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc),
        }).catch(e => console.error('[DocumentStore] Sync failed', e));
    }, 1500);
}

// ============================================================
// Store Interface
// ============================================================

interface DocumentStoreState {
    documents: QuotationDocument[];
    activeDocumentId: string | null;
}

interface DocumentStoreActions {
    loadFromServer: (projectId?: string) => Promise<void>;
    createDocument: (projectId: string, type: DocumentType) => string;
    migrateProjectId: (oldId: string, newId: string, projectTitle: string) => void;
    deleteDocument: (docId: string) => void;
    updateDocumentField: (docId: string, fields: Partial<QuotationDocument>) => void;
    setActiveDocument: (docId: string | null) => void;
    duplicateAsNewVersion: (docId: string) => string;
    convertToInvoice: (docId: string) => string;
    updateStatus: (docId: string, status: DocumentStatus) => void;
    addSection: (docId: string, title?: string) => void;
    removeSection: (docId: string, sectionId: string) => void;
    updateSectionTitle: (docId: string, sectionId: string, title: string) => void;
    reorderSections: (docId: string, sectionIds: string[]) => void;
    addLineItem: (docId: string, sectionId: string, type?: 'normal' | 'text') => void;
    removeLineItem: (docId: string, sectionId: string, itemId: string) => void;
    updateLineItem: (docId: string, sectionId: string, itemId: string, fields: Partial<LineItem>) => void;
    reorderLineItems: (docId: string, sectionId: string, itemIds: string[]) => void;
    getDocumentsForProject: (projectId: string, projectTitle?: string) => QuotationDocument[];
    getActiveDocument: () => QuotationDocument | null;
    populateFromProject: (docId: string) => void;
}

// ============================================================
// Store
// ============================================================

function reviveDates(d: any): QuotationDocument {
    return {
        ...d,
        issueDate: new Date(d.issueDate),
        validUntil: d.validUntil ? new Date(d.validUntil) : undefined,
        dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
        eventStartDate: d.eventStartDate ? new Date(d.eventStartDate) : undefined,
        eventEndDate: d.eventEndDate ? new Date(d.eventEndDate) : undefined,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
    };
}

export const useDocumentStore = create<DocumentStoreState & DocumentStoreActions>()(
    (set, get) => ({
        documents: [],
        activeDocumentId: null,

        // ------- Server Sync -------

        loadFromServer: async (projectId?) => {
            const url = projectId
                ? `/api/db/documents?projectId=${projectId}`
                : '/api/db/documents';
            const res = await fetch(url);
            if (!res.ok) return;
            const data: any[] = await res.json();
            const loaded = data.map(reviveDates);

            set(state => {
                // 既存のドキュメントとマージ（重複は上書き）
                const existing = state.documents.filter(
                    d => !loaded.some(l => l.id === d.id)
                );
                return { documents: [...existing, ...loaded] };
            });
        },

        // ------- Document CRUD -------

        createDocument: (projectId, type) => {
            const { documents } = get();
            const { taxRate } = useSettingsStore.getState();
            const docNumber = generateDocumentNumber(type, documents);
            const project = useProjectStore.getState();

            const newDoc: QuotationDocument = {
                id: generateId(),
                projectId,
                type,
                version: 1,
                status: 'draft',
                documentNumber: docNumber,
                title: project.projectName || 'Untitled',
                sections: [],
                discountAmount: 0,
                discountType: 'percent',
                taxRate,
                remarks: '',
                issueDate: new Date(),
                validUntil: type === 'quotation'
                    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    : undefined,
                companyInfo: DEFAULT_COMPANY_INFO,
                clientName: project.clientName || undefined,
                venue: project.venue || undefined,
                eventStartDate: project.startDate,
                eventEndDate: project.endDate,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            set(state => ({
                documents: [...state.documents, newDoc],
                activeDocumentId: newDoc.id,
            }));

            // auto-populate後に非同期でサーバー保存
            setTimeout(() => {
                get().populateFromProject(newDoc.id);
                const doc = get().documents.find(d => d.id === newDoc.id);
                fetch('/api/db/documents', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(doc ?? newDoc),
                }).catch(e => console.error('[DocumentStore] Create failed', e));
            }, 0);

            return newDoc.id;
        },

        deleteDocument: (docId) => {
            set(state => ({
                documents: state.documents.filter(d => d.id !== docId),
                activeDocumentId: state.activeDocumentId === docId ? null : state.activeDocumentId,
            }));
            fetch(`/api/db/documents/${docId}`, { method: 'DELETE' })
                .catch(e => console.error('[DocumentStore] Delete failed', e));
        },

        updateDocumentField: (docId, fields) => {
            set(state => ({
                documents: state.documents.map(d =>
                    d.id === docId ? { ...d, ...fields, updatedAt: new Date() } : d
                ),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        setActiveDocument: (docId) => set({ activeDocumentId: docId }),

        // ------- Version Management -------

        duplicateAsNewVersion: (docId) => {
            const { documents } = get();
            const source = documents.find(d => d.id === docId);
            if (!source) return '';

            const siblings = documents.filter(
                d => d.projectId === source.projectId && d.type === source.type
            );
            const maxVersion = Math.max(...siblings.map(d => d.version), 0);
            const nextVersion = maxVersion + 1;
            const baseNumber = source.documentNumber.replace(/-v\d+$/, '');

            const newDoc: QuotationDocument = {
                ...structuredClone(source),
                id: generateId(),
                version: nextVersion,
                status: 'draft',
                documentNumber: `${baseNumber}-v${nextVersion}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            set(state => ({
                documents: [...state.documents, newDoc],
                activeDocumentId: newDoc.id,
            }));

            fetch('/api/db/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDoc),
            }).catch(e => console.error('[DocumentStore] Duplicate failed', e));

            return newDoc.id;
        },

        convertToInvoice: (docId) => {
            const { documents } = get();
            const source = documents.find(d => d.id === docId);
            if (!source) return '';

            const invoiceNumber = generateDocumentNumber('invoice', documents);
            const invoice: QuotationDocument = {
                ...structuredClone(source),
                id: generateId(),
                type: 'invoice',
                version: 1,
                status: 'draft',
                documentNumber: invoiceNumber,
                issueDate: new Date(),
                validUntil: undefined,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                sourceQuotationId: source.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            set(state => ({
                documents: [...state.documents, invoice],
                activeDocumentId: invoice.id,
            }));

            fetch('/api/db/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoice),
            }).catch(e => console.error('[DocumentStore] ConvertToInvoice failed', e));

            return invoice.id;
        },

        updateStatus: (docId, status) => {
            set(state => ({
                documents: state.documents.map(d =>
                    d.id === docId ? { ...d, status, updatedAt: new Date() } : d
                ),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        // ------- Section CRUD -------

        addSection: (docId, title) => {
            set(state => ({
                documents: state.documents.map(d => {
                    if (d.id !== docId) return d;
                    const maxOrder = d.sections.length > 0
                        ? Math.max(...d.sections.map(s => s.sortOrder))
                        : -1;
                    return {
                        ...d,
                        sections: [...d.sections, createSection({ title: title || '新規セクション', sortOrder: maxOrder + 1 })],
                        updatedAt: new Date(),
                    };
                }),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        removeSection: (docId, sectionId) => {
            set(state => ({
                documents: state.documents.map(d =>
                    d.id !== docId ? d : {
                        ...d,
                        sections: d.sections.filter(s => s.id !== sectionId),
                        updatedAt: new Date(),
                    }
                ),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        updateSectionTitle: (docId, sectionId, title) => {
            set(state => ({
                documents: state.documents.map(d =>
                    d.id !== docId ? d : {
                        ...d,
                        sections: d.sections.map(s =>
                            s.id !== sectionId ? s : { ...s, title }
                        ),
                        updatedAt: new Date(),
                    }
                ),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        reorderSections: (docId, sectionIds) => {
            set(state => ({
                documents: state.documents.map(d => {
                    if (d.id !== docId) return d;
                    const reordered = sectionIds
                        .map((id, idx) => {
                            const section = d.sections.find(s => s.id === id);
                            return section ? { ...section, sortOrder: idx } : null;
                        })
                        .filter((s): s is DocumentSection => s !== null);
                    return { ...d, sections: reordered, updatedAt: new Date() };
                }),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        // ------- LineItem CRUD -------

        addLineItem: (docId, sectionId, type = 'normal') => {
            set(state => ({
                documents: state.documents.map(d => {
                    if (d.id !== docId) return d;
                    return {
                        ...d,
                        sections: d.sections.map(s => {
                            if (s.id !== sectionId) return s;
                            const maxOrder = s.items.length > 0
                                ? Math.max(...s.items.map(i => i.sortOrder))
                                : -1;
                            return {
                                ...s,
                                items: [...s.items, createLineItem({
                                    type,
                                    sortOrder: maxOrder + 1,
                                    quantity: type === 'text' ? 0 : 1,
                                    unitPrice: 0,
                                })],
                            };
                        }),
                        updatedAt: new Date(),
                    };
                }),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        removeLineItem: (docId, sectionId, itemId) => {
            set(state => ({
                documents: state.documents.map(d =>
                    d.id !== docId ? d : {
                        ...d,
                        sections: d.sections.map(s =>
                            s.id !== sectionId ? s : {
                                ...s,
                                items: s.items.filter(i => i.id !== itemId),
                            }
                        ),
                        updatedAt: new Date(),
                    }
                ),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        updateLineItem: (docId, sectionId, itemId, fields) => {
            set(state => ({
                documents: state.documents.map(d =>
                    d.id !== docId ? d : {
                        ...d,
                        sections: d.sections.map(s =>
                            s.id !== sectionId ? s : {
                                ...s,
                                items: s.items.map(i =>
                                    i.id !== itemId ? i : { ...i, ...fields }
                                ),
                            }
                        ),
                        updatedAt: new Date(),
                    }
                ),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        reorderLineItems: (docId, sectionId, itemIds) => {
            set(state => ({
                documents: state.documents.map(d => {
                    if (d.id !== docId) return d;
                    return {
                        ...d,
                        sections: d.sections.map(s => {
                            if (s.id !== sectionId) return s;
                            const reordered = itemIds
                                .map((id, idx) => {
                                    const item = s.items.find(i => i.id === id);
                                    return item ? { ...item, sortOrder: idx } : null;
                                })
                                .filter((i): i is LineItem => i !== null);
                            return { ...s, items: reordered };
                        }),
                        updatedAt: new Date(),
                    };
                }),
            }));
            scheduleSyncDocument(docId, () => get().documents.find(d => d.id === docId));
        },

        migrateProjectId: (oldId, newId, projectTitle) => {
            set(state => ({
                documents: state.documents.map(d => {
                    if (d.projectId === oldId && d.title === projectTitle) {
                        return { ...d, projectId: newId };
                    }
                    return d;
                }),
            }));
        },

        // ------- Queries -------

        getDocumentsForProject: (projectId, projectTitle?) => {
            return get().documents
                .filter(d => {
                    if (d.projectId === projectId) return true;
                    if (projectTitle && d.projectId === '1' && d.title === projectTitle) return true;
                    return false;
                })
                .sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'quotation' ? -1 : 1;
                    return b.version - a.version;
                });
        },

        getActiveDocument: () => {
            const { documents, activeDocumentId } = get();
            if (!activeDocumentId) return null;
            return documents.find(d => d.id === activeDocumentId) || null;
        },

        // ------- Auto-populate -------

        populateFromProject: (docId) => {
            const project = useProjectStore.getState();
            const { equipment } = useEquipmentStore.getState();
            const duration = Math.max(1, differenceInDays(project.endDate, project.startDate) + 1);

            const staffItems: LineItem[] = (project.staff || []).map((s, idx) =>
                createLineItem({
                    name: s.role || 'スタッフ',
                    quantity: 1,
                    unit: '人',
                    days: s.daysAssigned || duration,
                    unitPrice: 0,
                    sourceType: 'staff',
                    sourceId: s.id,
                    sortOrder: idx,
                })
            );

            const selectedEquipment = (project.selectedEquipmentIds || [])
                .map(id => equipment.find(e => e.id === id))
                .filter((e): e is NonNullable<typeof e> => e !== null);

            const equipmentItems: LineItem[] = selectedEquipment.map((item, idx) => {
                const nodeCount = project.nodes.filter(n => n.data?.equipmentId === item.id).length;
                return createLineItem({
                    name: item.name,
                    description: item.manufacturer,
                    quantity: Math.max(1, nodeCount),
                    unit: '台',
                    days: duration,
                    unitPrice: item.dayRate || 0,
                    sourceType: 'equipment',
                    sourceId: item.id,
                    sortOrder: idx,
                });
            });

            const sections: DocumentSection[] = [];
            let sortIdx = 0;

            if (staffItems.length > 0) {
                sections.push(createSection({ title: '人件費', items: staffItems, sortOrder: sortIdx++ }));
            }
            if (equipmentItems.length > 0) {
                sections.push(createSection({ title: '機材費', items: equipmentItems, sortOrder: sortIdx++ }));
            }
            sections.push(createSection({ title: '制作費', sortOrder: sortIdx++ }));
            sections.push(createSection({ title: 'その他経費', sortOrder: sortIdx++ }));

            set(state => ({
                documents: state.documents.map(d =>
                    d.id !== docId ? d : { ...d, sections, updatedAt: new Date() }
                ),
            }));
        },
    })
);
