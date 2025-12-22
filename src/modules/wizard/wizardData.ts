import { ProjectState } from "@/store/projectStore";
import { Edge, Node } from "@xyflow/react";

export interface WizardQuestion {
    id: 'type' | 'scale' | 'streaming';
    text: string;
    options: {
        value: string;
        label: string;
        description?: string;
    }[];
}

export const WIZARD_QUESTIONS: WizardQuestion[] = [
    {
        id: 'type',
        text: 'イベントの種類は何ですか？',
        options: [
            { value: 'webinar', label: 'Zoom ウェビナー', description: '登壇者と資料共有を中心としたオンラインセミナー' },
            { value: 'hybrid', label: 'ハイブリッドイベント', description: '会場のスクリーンへの投影と、オンライン配信を同時に行います' },
            { value: 'recording', label: '収録 / アーカイブ', description: '後日編集用の高品質な映像収録を行います' },
        ]
    },
    {
        id: 'scale',
        text: '規模感 (Pine/Bamboo/Plum) は？',
        options: [
            { value: 'plum', label: '梅 Plan (Small)', description: 'ワンオペ可・カメラ1台・PC画面共有のみ' },
            { value: 'bamboo', label: '竹 Plan (Medium)', description: 'カメラ2~3台・スイッチャーあり・スタッフ2名~' },
            { value: 'pine', label: '松 Plan (Large)', description: 'カメラ4台~・リタン確認・プロンプター等フルセット' },
        ]
    }
];

// Helper to generate IDs
const id = () => Math.random().toString(36).substr(2, 9);

interface TemplateData {
    nodes: Node[];
    edges: Edge[];
    equipmentIds: string[];
    description: string;
}

// Minimal Templates
export const TEMPLATES: Record<string, Record<string, TemplateData>> = {
    webinar: {
        plum: {
            description: "Zoom Webinar (Simple): PC Camera + Screen Share",
            equipmentIds: ['eq-webcam', 'eq-laptop'], // Assuming these IDs exist in DB or mapped later
            nodes: [
                { id: 'n1', type: 'equipment', position: { x: 100, y: 100 }, data: { equipmentId: 'eq-laptop', label: 'Zoom PC' } },
                { id: 'n2', type: 'equipment', position: { x: 400, y: 100 }, data: { equipmentId: 'eq-webcam', label: 'Webcam' } },
            ],
            edges: [
                { id: 'e1', source: 'n2', target: 'n1', sourceHandle: 'out-usb', targetHandle: 'in-usb' }
            ]
        },
        bamboo: {
            description: "Zoom Webinar (Std): Switcher + 2 Cameras",
            equipmentIds: [],
            nodes: [
                { id: 'n1', type: 'equipment', position: { x: 600, y: 200 }, data: { equipmentId: 'eq-vr4hd', label: 'Switcher (VR-4HD)' } }, // Placeholder IDs
                { id: 'n2', type: 'equipment', position: { x: 100, y: 100 }, data: { equipmentId: 'eq-cam1', label: 'Camera Main' } },
                { id: 'n3', type: 'equipment', position: { x: 100, y: 300 }, data: { equipmentId: 'eq-cam2', label: 'Camera Sub' } },
                { id: 'n4', type: 'equipment', position: { x: 900, y: 200 }, data: { equipmentId: 'eq-zoom-pc', label: 'Zoom PC' } },
            ],
            edges: [
                { id: 'e1', source: 'n2', target: 'n1', sourceHandle: 'out-hdmi', targetHandle: 'in-1' },
                { id: 'e2', source: 'n3', target: 'n1', sourceHandle: 'out-hdmi', targetHandle: 'in-2' },
                { id: 'e3', source: 'n1', target: 'n4', sourceHandle: 'out-usb', targetHandle: 'in-usb' },
            ]
        }
    },
    // ... Add more combinations as needed
};

// Fallback for missing combinations
export const DEFAULT_TEMPLATE: TemplateData = {
    nodes: [],
    edges: [],
    equipmentIds: [],
    description: "Empty Template"
};
