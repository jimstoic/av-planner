'use client';

import { NodeProps } from '@xyflow/react';

const MM_TO_PX = 3.78;

const SIZES = {
    A4: { width: 210 * MM_TO_PX, height: 297 * MM_TO_PX },
    A3: { width: 297 * MM_TO_PX, height: 420 * MM_TO_PX },
};

type ArtboardData = {
    size: 'A4' | 'A3';
    orientation: 'portrait' | 'landscape';
};

export function ArtboardNode({ data }: NodeProps) {
    const { size, orientation } = data as ArtboardData;
    const base = SIZES[size] ?? SIZES.A4;
    const width = orientation === 'landscape' ? base.height : base.width;
    const height = orientation === 'landscape' ? base.width : base.height;

    return (
        <div
            style={{
                width,
                height,
                border: '2px dashed rgba(99, 102, 241, 0.4)',
                backgroundColor: 'rgba(255,255,255,0.5)',
                borderRadius: 4,
                pointerEvents: 'none',
                boxShadow: '0 0 0 1px rgba(99,102,241,0.1)',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 10,
                    opacity: 0.45,
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 2,
                }}
            >
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#6366f1' }}>
                    Artboard ({size})
                </span>
                <span style={{ fontSize: 8, color: '#6366f1' }}>
                    {Math.round(width / MM_TO_PX)}mm × {Math.round(height / MM_TO_PX)}mm
                </span>
            </div>
        </div>
    );
}
