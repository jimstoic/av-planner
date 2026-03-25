'use client';

import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, type EdgeProps } from '@xyflow/react';
import { useProjectStore } from '@/store/projectStore';

// Cable type → color mapping (matching standard AV industry color conventions)
const CABLE_COLORS: Record<string, string> = {
    HDMI:    '#3b82f6', // blue
    SDI:     '#22c55e', // green
    XLR:     '#ef4444', // red
    LAN:     '#f97316', // orange
    Power:   '#eab308', // yellow
    Optical: '#a855f7', // purple
    TRS:     '#ec4899', // pink
    RCA:     '#06b6d4', // cyan
    Signal:  '#94a3b8', // slate
};

const DEFAULT_COLOR = '#94a3b8';

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
    selected,
}: EdgeProps) {
    const { setEditingEdgeId } = useProjectStore();

    const length = (data?.length as string) || '1m';
    const type = (data?.type as string) || 'Signal';
    const parallelOffset = (data?._parallelOffset as number) || 0;
    const cableColor = CABLE_COLORS[type] ?? DEFAULT_COLOR;

    // Determine if edge is horizontal (left/right handles) to pick which axis to offset
    const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
        centerX: isHorizontal ? midX : midX + parallelOffset,
        centerY: isHorizontal ? midY + parallelOffset : midY,
    });

    const edgeStyle = {
        ...style,
        stroke: cableColor,
        strokeWidth: selected ? 3 : 2,
        opacity: selected ? 1 : 0.85,
    };

    const onBadgeClick = (evt: React.MouseEvent) => {
        evt.stopPropagation();
        setEditingEdgeId(id);
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    className="nopan"
                >
                    <button
                        onClick={onBadgeClick}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border shadow-sm select-none whitespace-nowrap leading-none bg-white/95 hover:bg-white transition-colors"
                        style={{ borderColor: cableColor, color: cableColor }}
                        title="クリックでケーブル設定を変更"
                    >
                        <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: cableColor }}
                        />
                        {length} {type}
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
