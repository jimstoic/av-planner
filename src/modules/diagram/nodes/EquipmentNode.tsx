'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Equipment, Connector } from '@/types/equipment';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type EquipmentNodeData = Equipment & {
    label?: string;
    equipmentId: string;
    [key: string]: unknown;
};

// NodeProps is generic: NodeProps<Data>
function EquipmentNode({ data }: NodeProps<Node<EquipmentNodeData>>) {
    const { name, manufacturer, connectors = [] } = data;

    // Separate inputs and outputs for layout
    const inputs = connectors.filter((c: Connector) => c.direction === 'input' || c.direction === 'bidirectional');
    const outputs = connectors.filter((c: Connector) => c.direction === 'output' || c.direction === 'bidirectional');

    return (
        <Card className="min-w-[150px] max-w-[200px] border shadow-sm bg-card">
            <CardHeader className="p-2 pb-1 bg-muted/30">
                <CardTitle className="text-xs font-bold flex items-center">
                    <span className="truncate">{name}</span>
                </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0 flex flex-row">
                {/* Inputs Column (Left) */}
                <div className="flex-1 py-1 flex flex-col gap-1.5 border-r relative min-w-[60px]">
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

                {/* Outputs Column (Right) */}
                <div className="flex-1 py-1 flex flex-col gap-1.5 relative min-w-[60px]">
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
    );
}

export default memo(EquipmentNode);
