'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
    NodeChange,
    Connection,
    Edge,
    useReactFlow,
    NodeTypes,
    Panel,
    getNodesBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { FileImage, FileText } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';

import EquipmentNode from './nodes/EquipmentNode';
import { ArtboardNode } from './nodes/ArtboardNode';
import CableEdge from './edges/CableEdge';
import { useProjectStore } from '@/store/projectStore';
import { Equipment } from '@/types/equipment';

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

const ARTBOARD_NODE_ID = '__artboard__';

const nodeTypes: NodeTypes = {
    equipment: EquipmentNode,
    artboard: ArtboardNode,
};

const edgeTypes = {
    cable: CableEdge,
};

function DiagramEditorContent() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition, getNodes } = useReactFlow();

    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        updateEdgeData,
        editingEdgeId,
        setEditingEdgeId,
        artboard,
        updateMetadata
    } = useProjectStore();

    const [currentEdgeLength, setCurrentEdgeLength] = useState("1m");
    const [currentEdgeType, setCurrentEdgeType] = useState("HDMI");
    const [isEdgeDialogOpen, setIsEdgeDialogOpen] = useState(false);

    // Artboard node: managed separately, not persisted in store
    const artboardNode: Node | null = useMemo(() => {
        if (!artboard?.enabled) return null;
        return {
            id: ARTBOARD_NODE_ID,
            type: 'artboard',
            position: { x: 0, y: 0 },
            data: { size: artboard.size, orientation: artboard.orientation },
            draggable: false,
            selectable: false,
            deletable: false,
            zIndex: -1,
        };
    }, [artboard?.enabled, artboard?.size, artboard?.orientation]);

    const displayNodes = useMemo(
        () => artboardNode ? [artboardNode, ...nodes] : nodes,
        [artboardNode, nodes]
    );

    // Filter out artboard node changes to prevent store corruption
    const handleNodesChange = useCallback((changes: NodeChange[]) => {
        onNodesChange(changes.filter((c) => (c as any).id !== ARTBOARD_NODE_ID));
    }, [onNodesChange]);

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
            setEditingEdgeId(null);
            toast.success(`ケーブル設定を更新しました`);
        }
    };

    const handleExport = async (format: 'png' | 'pdf') => {
        if (!reactFlowWrapper.current) return;
        if (getNodes().filter(n => n.id !== ARTBOARD_NODE_ID).length === 0) {
            toast.error("エクスポートするノードがありません");
            return;
        }

        const toastId = toast.loading(`${format.toUpperCase()} を作成中...`);

        try {
            const dataUrl = await toPng(reactFlowWrapper.current, {
                backgroundColor: '#eee',
                width: reactFlowWrapper.current.offsetWidth,
                height: reactFlowWrapper.current.offsetHeight,
            });

            if (format === 'png') {
                const a = document.createElement('a');
                a.setAttribute('download', 'diagram.png');
                a.setAttribute('href', dataUrl);
                a.click();
            } else {
                const pdf = new jsPDF('l', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
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
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const targetNode = nodes.find((n) => n.id === params.target);
            if (!sourceNode || !targetNode) return;

            const sourceData = sourceNode.data as any;
            const targetData = targetNode.data as any;
            const sourceConnector = sourceData.connectors?.find((c: any) => c.id === params.sourceHandle);
            const targetConnector = targetData.connectors?.find((c: any) => c.id === params.targetHandle);

            if (!sourceConnector || !targetConnector) return;

            if (sourceConnector.type !== targetConnector.type) {
                toast.error(`接続エラー: ${sourceConnector.type} を ${targetConnector.type} に接続することはできません。`);
                return;
            }

            onConnect({
                ...params,
                type: 'cable',
                data: {
                    length: '1m',
                    type: sourceConnector.type,
                }
            } as any);
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
            let equipmentData: Equipment | null = null;
            try {
                const jsonData = event.dataTransfer.getData('application/json');
                if (jsonData) equipmentData = JSON.parse(jsonData);
            } catch (e) {
                console.error("Failed to parse drop data", e);
            }

            if (!equipmentData) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

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

            addNode({
                id: `node-${Date.now()}`,
                type: 'equipment',
                position,
                data: {
                    ...equipmentData,
                    label: equipmentData.name,
                    equipmentId: equipmentData.id,
                    connectors: nodeConnectors
                },
            });
        },
        [screenToFlowPosition, addNode],
    );

    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        event.stopPropagation();
        setEditingEdgeId(edge.id);
    }, [setEditingEdgeId]);

    return (
        <div ref={reactFlowWrapper} className="h-full w-full">
            <ReactFlow
                nodes={displayNodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnectWrapper}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onDragOver={onDragOver}
                onDrop={onDrop}
                fitView
                snapToGrid
                colorMode="light"
            >
                <Background color="#eee" gap={16} />
                <Controls />
                <MiniMap />
                <Panel position="top-right" className="bg-white/80 p-2 rounded-lg border shadow-sm backdrop-blur flex flex-col gap-2">
                    <div className="flex gap-2 border-b pb-2">
                        <Button variant="outline" size="sm" onClick={() => handleExport('png')}>
                            <FileImage className="mr-2 h-4 w-4" /> PNG
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                            <FileText className="mr-2 h-4 w-4" /> PDF
                        </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label className="text-[10px] uppercase text-muted-foreground font-bold">Artboard Settings</Label>
                        <div className="flex items-center justify-between gap-4">
                            <span className="text-xs">Show</span>
                            <Switch
                                checked={artboard?.enabled}
                                onCheckedChange={(val) => updateMetadata({ artboard: { ...artboard, enabled: val } })}
                            />
                        </div>
                        {artboard?.enabled && (
                            <>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs">Size</span>
                                    <Select
                                        value={artboard.size}
                                        onValueChange={(val: any) => updateMetadata({ artboard: { ...artboard, size: val } })}
                                    >
                                        <SelectTrigger className="h-7 w-20 text-xs text-right">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A4">A4</SelectItem>
                                            <SelectItem value="A3">A3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-xs">Orientation</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[10px]"
                                        onClick={() => updateMetadata({ artboard: { ...artboard, orientation: artboard.orientation === 'portrait' ? 'landscape' : 'portrait' } })}
                                    >
                                        {artboard.orientation === 'portrait' ? 'Landscape' : 'Portrait'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </Panel>
            </ReactFlow>

            <Dialog open={isEdgeDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>ケーブル設定</DialogTitle>
                        <DialogDescription>
                            ケーブルの種類と長さを選択してください。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right text-xs">種類</Label>
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
                            <Label htmlFor="length" className="text-right text-xs">長さ</Label>
                            <Select value={currentEdgeLength} onValueChange={setCurrentEdgeLength}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="長さを選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    {['1m', '2m', '3m', '5m', '10m', '20m', '30m', '50m', '100m'].map(l => (
                                        <SelectItem key={l} value={l}>{l}</SelectItem>
                                    ))}
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
