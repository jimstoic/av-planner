'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
    Panel,
    getNodesBounds,
    getViewportForBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Download, FileImage, FileText } from 'lucide-react';
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
    const { screenToFlowPosition, getNodes, getEdges } = useReactFlow();

    // Use Zustand Global Store instead of local state
    // Use Zustand Global Store instead of local state
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        updateEdgeData,
        editingEdgeId,
        setEditingEdgeId
    } = useProjectStore();

    // Edge Interaction State
    const [currentEdgeLength, setCurrentEdgeLength] = useState("1m");
    const [currentEdgeType, setCurrentEdgeType] = useState("HDMI");

    // Sync Dialog with Global State
    const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);

    useEffect(() => {
        if (editingEdgeId) {
            const edge = edges.find(e => e.id === editingEdgeId);
            if (edge) {
                setCurrentEdgeLength((edge.data?.length as string) || "1m");
                setCurrentEdgeType((edge.data?.type as string) || "Signal");
                setIsEdgeDialogOpen(true);
            }
        } else {
            setIsEdgeDialogOpen(false);
        }
    }, [editingEdgeId, edges]);

    const handleDialogClose = (open: boolean) => {
        setIsEdgeDialogOpen(open);
        if (!open) setEditingEdgeId(null);
    };

    const handleEdgeSave = () => {
        if (editingEdgeId) {
            updateEdgeData(editingEdgeId, {
                length: currentEdgeLength,
                type: currentEdgeType
            });
            setEditingEdgeId(null); // Close via effect
            toast.success(`ケーブル設定を更新しました`);
        }
    };

    const downloadImage = (dataUrl: string) => {
        const a = document.createElement('a');
        a.setAttribute('download', 'diagram.png');
        a.setAttribute('href', dataUrl);
        a.click();
    };

    const handleExport = async (format: 'png' | 'pdf') => {
        // Validation: Check if there are nodes
        if (getNodes().length === 0) {
            toast.error("エクスポートするノードがありません");
            return;
        }

        const nodesBounds = getNodesBounds(getNodes());
        // Calculate dimensions with some padding
        const width = nodesBounds.width + 100;
        const height = nodesBounds.height + 100;

        // Transform to fit the view for capture
        // We use toPng logic but we might need to adjust viewport momentarily or just use the whole canvas
        // html-to-image captures the DOM element. 
        // Ideally we want to capture the whole flow, not just the viewport.
        // But for simplicity/robustness, we stick to what react flow recommends:
        // https://reactflow.dev/learn/advanced-use/exporting-images

        if (!reactFlowWrapper.current) return;

        const toastId = toast.loading(`${format.toUpperCase()} を作成中...`);

        try {
            const dataUrl = await toPng(reactFlowWrapper.current, {
                backgroundColor: '#eee',
                width: reactFlowWrapper.current.offsetWidth, // Or full scroll width if we want
                height: reactFlowWrapper.current.offsetHeight,
                style: {
                    // Force transform or specific styles if needed
                }
            });

            if (format === 'png') {
                downloadImage(dataUrl);
            } else {
                const pdf = new jsPDF('l', 'mm', 'a4'); // A4 Landscape
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                // Scale image to fit A4
                const imgProps = pdf.getImageProperties(dataUrl);
                const pdfWidth = pageWidth;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save('diagram.pdf');
            }
            toast.success("エクスポート完了", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("エクスポートに失敗しました", { id: toastId });
        }
    };

    const onConnectWrapper = useCallback(
        // ... no change to onConnectWrapper logic 
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
        setEditingEdgeId(edge.id); // Just set global state
    }, [setEditingEdgeId]);


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
                <Panel position="top-right" className="bg-white/80 p-2 rounded-lg border shadow-sm backdrop-blur flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport('png')}>
                        <FileImage className="mr-2 h-4 w-4" /> PNG
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                        <FileText className="mr-2 h-4 w-4" /> PDF
                    </Button>
                </Panel>
            </ReactFlow>

            <Dialog open={isEdgeDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ケーブル設定</DialogTitle>
                        <DialogDescription>
                            ケーブルの種類と長さを選択してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                種類
                            </Label>
                            <Select value={currentEdgeType} onValueChange={setCurrentEdgeType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="種類を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="HDMI">HDMI</SelectItem>
                                    <SelectItem value="SDI">SDI</SelectItem>
                                    <SelectItem value="XLR">XLR</SelectItem>
                                    <SelectItem value="LAN">LAN</SelectItem>
                                    <SelectItem value="Power">Power</SelectItem>
                                    <SelectItem value="Optical">Optical</SelectItem>
                                    <SelectItem value="Signal">Signal</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
