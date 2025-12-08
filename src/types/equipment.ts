export type EquipmentCategory = 'video' | 'audio' | 'lighting' | 'power' | 'control' | 'other';
export type EquipmentSubCategory =
    | 'camera' | 'switcher' | 'display' | 'converter' | 'cable' // Video
    | 'microphone' | 'mixer' | 'speaker' | 'processor' | 'amplifier' // Audio
    | 'fixture' | 'dimmer' | 'console' // Lighting
    | 'generator' | 'distro' | 'ups' // Power
    | 'pc' | 'network' // Control
    | 'accessory' | 'other';

export interface Connector {
    id: string;
    name: string; // e.g., "HDMI In 1", "XLR Out L"
    type: string; // e.g., "HDMI", "SDI", "XLR", "RJ45"
    direction: 'input' | 'output' | 'bidirectional';
    // Optional: Physical location on device for visualization?
}

export interface Equipment {
    id: string; // Unique ID in the database/library
    name: string;
    majorCategory: EquipmentCategory;
    subCategory: EquipmentSubCategory;
    manufacturer: string;
    model?: string;
    description?: string;
    imageUrl?: string;

    // Specs
    powerConsumption?: number; // Watts
    stockQuantity: number; // Inventory count
    connectors?: Connector[]; // kg
    dimensions?: { w: number, h: number, d: number };

    // Connections
    inputPortCount: number;
    outputPortCount: number;
    // We could make this more complex (type specific) later

    // Pricing/Rental Info
    dayRate?: number;
    costPrice?: number;

    // Legacy support (optional)
    category?: string;
    inputs?: any[]; // Keep for backward compatibility if needed
    outputs?: any[];
}

export interface DiagramNodeData extends Equipment {
    // Instance specific data when placed on the diagram
    label?: string; // Custom label, e.g., "Main Switcher"
    instanceId: string; // Unique ID on the canvas
}

export interface Connection {
    id: string;
    sourceId: string; // Node ID
    sourceHandle: string; // Handle/Connector ID
    targetId: string; // Node ID
    targetHandle: string; // Handle/Connector ID
    cableType?: string; // e.g., "HDMI 2.0"
    length?: number; // meters
}

export interface Project {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    nodes: DiagramNodeData[]; // Or ReactFlow nodes format
    edges: Connection[]; // Or ReactFlow edges format
    equipmentList?: { equipmentId: string; quantity: number }[];
}
