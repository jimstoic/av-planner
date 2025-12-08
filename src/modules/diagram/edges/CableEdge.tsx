'use client';

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps, useReactFlow } from '@xyflow/react';
import { useProjectStore } from '@/store/projectStore';
import { Badge } from '@/components/ui/badge';

export default function CableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: EdgeProps) {
    const { updateEdgeData } = useProjectStore();

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const length = (data?.length as string) || '1m';

    const onEdgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        // Cycle lengths
        const lengths = ['1m', '3m', '5m', '10m', '20m'];
        const currentIndex = lengths.indexOf(length);
        const nextLength = lengths[(currentIndex + 1) % lengths.length];

        updateEdgeData(id, { length: nextLength });
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nopan"
                >
                    <Badge
                        variant="secondary"
                        className="bg-background/90 hover:bg-background text-xs px-2 py-0.5 h-6 cursor-pointer border border-border shadow-sm rounded-full select-none"
                        onClick={onEdgeClick}
                        title="Click to change cable length"
                    >
                        {length}
                    </Badge>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
