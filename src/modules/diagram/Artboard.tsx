'use client';

import React from 'react';

interface ArtboardProps {
    size: 'A4' | 'A3';
    orientation: 'portrait' | 'landscape';
}

// Convert MM to PX at 96 DPI (approximate)
// A4: 210 x 297 mm
// A3: 297 x 420 mm
const MM_TO_PX = 3.78;

const SIZES = {
    A4: { width: 210 * MM_TO_PX, height: 297 * MM_TO_PX },
    A3: { width: 297 * MM_TO_PX, height: 420 * MM_TO_PX },
};

export function Artboard({ size, orientation }: ArtboardProps) {
    const baseSize = SIZES[size];
    const width = orientation === 'landscape' ? baseSize.height : baseSize.width;
    const height = orientation === 'landscape' ? baseSize.width : baseSize.height;

    return (
        <div
            className="absolute pointer-events-none border-2 border-dashed border-slate-300 bg-white/50 shadow-inner dark:bg-slate-800/20"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: -1,
            }}
        >
            <div className="absolute top-2 right-2 flex flex-col items-end gap-1 opacity-40 select-none">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Artboard ({size})
                </span>
                <span className="text-[8px] text-slate-400">
                    {Math.round(width / MM_TO_PX)}mm x {Math.round(height / MM_TO_PX)}mm
                </span>
            </div>
        </div>
    );
}
