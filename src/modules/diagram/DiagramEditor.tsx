'use client';

import { useState, useCallback, useRef } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    Node,
    Connection,
    Edge,
    useReactFlow,
    NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';

import EquipmentNode from './nodes/EquipmentNode';
import CableEdge from './edges/CableEdge';
import { useProjectStore } from '@/store/projectStore';
import { Equipment } from '@/types/equipment';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // Just in case custom length is needed

const nodeTypes: NodeTypes = {
    equipment: EquipmentNode,
};

const edgeTypes = {
    cable: CableEdge,
};

function DiagramEditorContent() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    // Use Zustand Global Store instead of local state
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        updateEdgeData // Need this to update length
    } = useProjectStore();

    // Edge Interaction State
    const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [currentEdgeLength, setCurrentEdgeLength] = useState("1m");

    const onConnectWrapper = useCallback(
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const targetNode = nodes.find((n) => n.id === params.target);

            if (!sourceNode || !targetNode) return;

            const sourceData = sourceNode.data as any;
            const targetData = targetNode.data as any;

            const sourceConnector = sourceData.connectors?.find((c: any) => c.id === params.sourceHandle);
            const targetConnector = targetData.connectors?.find((c: any) => c.id === params.targetHandle);

            if (!sourceConnector || !targetConnector) return;

            // VALIDATION: Check if connector types match
            if (sourceConnector.type !== targetConnector.type) {
                toast.error(`接続エラー: ${sourceConnector.type} を ${targetConnector.type} に接続することはできません。`);
                return;
            }

            // Pass connection with metadata to store
            const connection = {
                ...params,
                type: 'cable', // ensure Custom Edge is used
                data: {
                    length: '1m',
                    type: sourceConnector.type, // e.g. "HDMI", "SDI", "XLR"
                }
            };

            onConnect(connection);
        },
        [nodes, onConnect]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            // Try to get equipment data from JSON
            let equipmentData: Equipment | null = null;
            try {
                const jsonData = event.dataTransfer.getData('application/json');
                if (jsonData) {
                    equipmentData = JSON.parse(jsonData);
                }
            } catch (e) {
                console.error("Failed to parse drop data", e);
            }

            if (!equipmentData) return;

            // project from screen coordinates to flow coordinates
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Generate Connectors if missing (Layout fix)
            let nodeConnectors = equipmentData?.connectors || [];
            if (nodeConnectors.length === 0 && (equipmentData.inputPortCount > 0 || equipmentData.outputPortCount > 0)) {
                const inputs = Array.from({ length: equipmentData.inputPortCount || 0 }, (_, i) => ({
                    id: `in-${i + 1}`,
                    name: `In ${i + 1}`,
                    type: 'Generic',
                    direction: 'input'
                }));
                const outputs = Array.from({ length: equipmentData.outputPortCount || 0 }, (_, i) => ({
                    id: `out-${i + 1}`,
                    name: `Out ${i + 1}`,
                    type: 'Generic',
                    direction: 'output'
                }));
                nodeConnectors = [...inputs, ...outputs] as any[];
            }

            const newNode = {
                id: `node-${Date.now()}`,
                type: 'equipment',
                position,
                data: {
                    ...equipmentData,
                    label: equipmentData.name,
                    equipmentId: equipmentData.id,
                    connectors: nodeConnectors
                },
            };

            addNode(newNode); // Use store action
        },
        [screenToFlowPosition, addNode],
    );

    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        event.stopPropagation();
        setSelectedEdgeId(edge.id);
        setCurrentEdgeLength((edge.data?.length as string) || "1m");
        setIsEdgeDialogOpen(true);
    }, []);

    const handleEdgeSave = () => {
        if (selectedEdgeId) {
            updateEdgeData(selectedEdgeId, { length: currentEdgeLength });
            setIsEdgeDialogOpen(false);
            toast.success(`ケーブル長さを変更しました: ${currentEdgeLength}`);
        }
    };

    return (
        <div ref={reactFlowWrapper} className="h-full w-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnectWrapper}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onDragOver={onDragOver}
                onDrop={onDrop}
                fitView
                snapToGrid
                colorMode="light" // Force light mode as requested
            >
                <Background color="#eee" gap={16} /> {/* Lighter background */}
                <Controls />
                <MiniMap />
            </ReactFlow>

            <Dialog open={isEdgeDialogOpen} onOpenChange={setIsEdgeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ケーブル設定</DialogTitle>
                        <DialogDescription>
                            ケーブルの長さを選択してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="length" className="text-right">
                                長さ
                            </Label>
                            <Select value={currentEdgeLength} onValueChange={setCurrentEdgeLength}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="長さを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1m">1m</SelectItem>
                                    <SelectItem value="2m">2m</SelectItem>
                                    <SelectItem value="3m">3m</SelectItem>
                                    <SelectItem value="5m">5m</SelectItem>
                                    <SelectItem value="10m">10m</SelectItem>
                                    <SelectItem value="20m">20m</SelectItem>
                                    <SelectItem value="30m">30m</SelectItem>
                                    <SelectItem value="50m">50m</SelectItem>
                                    <SelectItem value="100m">100m</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleEdgeSave}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function DiagramEditor() {
    return (
        <ReactFlowProvider>
            <DiagramEditorContent />
        </ReactFlowProvider>
    );
}
