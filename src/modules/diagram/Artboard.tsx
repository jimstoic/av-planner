'use client';

import React from 'react';

interface ArtboardProps {
    size: 'A4' | 'A3';
    orientation: 'portrait' | 'landscape';
    enabled: boolean;
}

// Convert MM to PX at 96 DPI (approximate)
// A4: 210 x 297 mm
// A3: 297 x 420 mm
const MM_TO_PX = 3.78;

const SIZES = {
    A4: { width: 210 * MM_TO_PX, height: 297 * MM_TO_PX },
    A3: { width: 297 * MM_TO_PX, height: 420 * MM_TO_PX },
};

export function Artboard({ size, orientation, enabled }: ArtboardProps) {
    if (!enabled) return null;

    const baseSize = SIZES[size];
    const width = orientation === 'landscape' ? baseSize.height : baseSize.width;
    const height = orientation === 'landscape' ? baseSize.width : baseSize.height;

    return (
        <div
            className="absolute pointer-events-none border-2 border-dashed border-primary/30 bg-white/40 shadow-inner dark:bg-slate-800/10"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 0, // Above background, below nodes if nodes have higher z
            }}
        >
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 opacity-40 select-none">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                    Artboard ({size})
                </span>
                <span className="text-[8px] text-primary/60">
                    {Math.round(width / MM_TO_PX)}mm x {Math.round(height / MM_TO_PX)}mm
                </span>
            </div>
        </div>
    );
}
