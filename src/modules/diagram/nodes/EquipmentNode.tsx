'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node, NodeResizer, NodeToolbar, useReactFlow } from '@xyflow/react';
import { Equipment, Connector } from '@/types/equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useProjectStore } from '@/store/projectStore';
import { EyeOff, Eye } from 'lucide-react';

type EquipmentNodeData = Equipment & {
    label?: string;
    equipmentId: string;
    hideUnusedPorts?: boolean;
    [key: string]: unknown;
};

function EquipmentNode({ id, data, selected }: NodeProps<Node<EquipmentNodeData>>) {
    const { name, connectors = [], hideUnusedPorts = false } = data;
    const { updateNodeData } = useProjectStore();
    const { getEdges } = useReactFlow();

    // Collect connected handle IDs for this node
    const connectedHandleIds = new Set<string>();
    if (hideUnusedPorts) {
        for (const edge of getEdges()) {
            if (edge.source === id && edge.sourceHandle) connectedHandleIds.add(edge.sourceHandle);
            if (edge.target === id && edge.targetHandle) connectedHandleIds.add(edge.targetHandle);
        }
    }

    const visibleConnectors = hideUnusedPorts
        ? connectors.filter((c: Connector) => connectedHandleIds.has(c.id))
        : connectors;

    const inputs = visibleConnectors.filter((c: Connector) => c.direction === 'input' || c.direction === 'bidirectional');
    const outputs = visibleConnectors.filter((c: Connector) => c.direction === 'output' || c.direction === 'bidirectional');

    const isCompact = (inputs.length + outputs.length) <= 2;

    const toggleHideUnused = () => {
        updateNodeData(id, { hideUnusedPorts: !hideUnusedPorts });
    };

    const toolbar = (
        <NodeToolbar isVisible={selected} position={Position.Top} align="end">
            <button
                onClick={toggleHideUnused}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-white border shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
                title={hideUnusedPorts ? '未使用ポートを表示' : '未使用ポートを非表示'}
            >
                {hideUnusedPorts
                    ? <><Eye className="w-3 h-3" /> 全ポート表示</>
                    : <><EyeOff className="w-3 h-3" /> 未使用を隠す</>
                }
            </button>
        </NodeToolbar>
    );

    if (isCompact) {
        return (
            <>
                {toolbar}
                <NodeResizer
                    isVisible={selected}
                    minWidth={60}
                    minHeight={24}
                    lineStyle={{ borderColor: 'hsl(var(--primary))', borderWidth: 1.5 }}
                    handleStyle={{ backgroundColor: 'hsl(var(--primary))', border: 'none', borderRadius: 2, width: 8, height: 8 }}
                />
                <Card className="w-full h-full min-w-[70px] border shadow-sm bg-card">
                    <div className="p-1.5 flex items-center justify-between gap-2 h-full">
                        <div className="flex flex-col gap-1 -ml-2.5">
                            {inputs.map((conn: Connector) => (
                                <Handle
                                    key={conn.id}
                                    type="target"
                                    position={Position.Left}
                                    id={conn.id}
                                    className="!w-2 !h-2 !bg-blue-500 border border-background"
                                    title={conn.name}
                                />
                            ))}
                        </div>

                        <div className="flex-1 text-center truncate min-w-0">
                            <span className="text-[10px] font-semibold block leading-tight truncate" title={name}>{name}</span>
                        </div>

                        <div className="flex flex-col gap-1 -mr-2.5">
                            {outputs.map((conn: Connector) => (
                                <Handle
                                    key={conn.id}
                                    type="source"
                                    position={Position.Right}
                                    id={conn.id}
                                    className="!w-2 !h-2 !bg-green-500 border border-background"
                                    title={conn.name}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            </>
        );
    }

    return (
        <>
            {toolbar}
            <NodeResizer
                isVisible={selected}
                minWidth={90}
                minHeight={48}
                lineStyle={{ borderColor: 'hsl(var(--primary))', borderWidth: 1.5 }}
                handleStyle={{ backgroundColor: 'hsl(var(--primary))', border: 'none', borderRadius: 2, width: 8, height: 8 }}
            />
            <Card className="w-full h-full min-w-[110px] border shadow-sm bg-card flex flex-col">
                <CardHeader className="p-2 pb-1 bg-muted/30 shrink-0">
                    <CardTitle className="text-xs font-bold flex items-center">
                        <span className="truncate">{name}</span>
                    </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-0 flex flex-row flex-1 min-h-0">
                    <div className="flex-1 py-1 flex flex-col gap-1.5 border-r relative min-w-0">
                        {inputs.map((conn: Connector) => (
                            <div key={conn.id} className="relative px-2 h-3 flex items-center">
                                <Handle
                                    type="target"
                                    position={Position.Left}
                                    id={conn.id}
                                    className="!w-2.5 !h-2.5 !bg-blue-500 !-left-1 border-2 border-background"
                                />
                                <span className="text-[9px] leading-none ml-1.5 text-muted-foreground truncate">{conn.name}</span>
                            </div>
                        ))}
                        {inputs.length === 0 && <div className="text-[9px] text-muted-foreground py-1 text-center">-</div>}
                    </div>

                    <div className="flex-1 py-1 flex flex-col gap-1.5 relative min-w-0">
                        {outputs.map((conn: Connector) => (
                            <div key={conn.id} className="relative px-2 h-3 flex items-center justify-end">
                                <span className="text-[9px] leading-none mr-1.5 text-muted-foreground text-right truncate">{conn.name}</span>
                                <Handle
                                    type="source"
                                    position={Position.Right}
                                    id={conn.id}
                                    className="!w-2.5 !h-2.5 !bg-green-500 !-right-1 border-2 border-background"
                                />
                            </div>
                        ))}
                        {outputs.length === 0 && <div className="text-[9px] text-muted-foreground py-1 text-center">-</div>}
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

export default memo(EquipmentNode);
