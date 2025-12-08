import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";

interface PortCounterProps {
    label: string;
    countIn: number;
    countOut: number;
    onChange: (type: string, direction: 'input' | 'output', value: number) => void;
    type: string; // e.g., 'HDMI', 'XLR'
}

export function PortCounter({ label, countIn, countOut, onChange, type }: PortCounterProps) {
    return (
        <div className="flex items-center justify-between py-1 border-b last:border-0">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getTypeColor(type)}`} />
                <Label className="text-xs font-medium w-24 truncate" title={label}>{label}</Label>
            </div>

            <div className="flex gap-4">
                {/* IN Counter */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onChange(type, 'input', Math.max(0, countIn - 1))}
                        disabled={countIn === 0}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 text-center text-xs tabular-nums text-muted-foreground">{countIn}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onChange(type, 'input', countIn + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>

                {/* OUT Counter */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onChange(type, 'output', Math.max(0, countOut - 1))}
                        disabled={countOut === 0}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-4 text-center text-xs tabular-nums text-muted-foreground">{countOut}</span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => onChange(type, 'output', countOut + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function getTypeColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('hdmi') || t.includes('sdi') || t.includes('video')) return 'bg-blue-500';
    if (t.includes('xlr') || t.includes('trs') || t.includes('audio')) return 'bg-pink-500';
    if (t.includes('power') || t.includes('ac') || t.includes('dc')) return 'bg-red-500';
    if (t.includes('usb') || t.includes('ethernet')) return 'bg-orange-400';
    return 'bg-gray-400';
}
