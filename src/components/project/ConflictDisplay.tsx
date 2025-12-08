import { useProjectStore } from '@/store/projectStore';
import { mockGlobalSchedule, mockInventoryLimits } from '@/data/mockGlobalSchedule';
import { AlertCircle, CheckCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { Equipment } from '@/types/equipment';

export function ConflictDisplay() {
    const { nodes, startDate, endDate, setupDate } = useProjectStore();

    // 1. Calculate Current Project Usage
    const currentUsage = new Map<string, { count: number; name: string }>();
    nodes.forEach((node) => {
        if ((node.type === 'equipment' || node.type === 'equipmentNode') && node.data) {
            const eqData = node.data as unknown as Equipment;
            const id = node.data.equipmentId as string || eqData.id;
            const name = eqData.name;
            if (id) {
                if (currentUsage.has(id)) {
                    currentUsage.get(id)!.count++;
                } else {
                    currentUsage.set(id, { count: 1, name });
                }
            }
        }
    });

    // 2. Determine overlapping period (considering setup date if earlier)
    const effectiveStart = new Date(startDate);
    if (setupDate && new Date(setupDate) < effectiveStart) {
        effectiveStart.setTime(new Date(setupDate).getTime());
    }
    const effectiveEnd = new Date(endDate);

    // 3. Find Overlapping Projects
    const conflicts: string[] = [];
    const warnings: string[] = [];

    // Helper: Check overlap
    const isOverlapping = (start1: Date, end1: Date, start2: Date, end2: Date) => {
        return start1 <= end2 && start2 <= end1;
    };

    currentUsage.forEach((usage, eqId) => {
        let otherUsageCount = 0;
        const overlappingProjects: string[] = [];

        mockGlobalSchedule.forEach(gp => {
            if (isOverlapping(effectiveStart, effectiveEnd, gp.startDate, gp.endDate)) {
                const used = gp.equipmentUsage[eqId] || 0;
                if (used > 0) {
                    otherUsageCount += used;
                    overlappingProjects.push(gp.projectName);
                }
            }
        });

        const totalStock = mockInventoryLimits[eqId] || 999;
        const available = totalStock - otherUsageCount;

        if (usage.count > available) {
            conflicts.push(`${usage.name}: Need ${usage.count}, Available ${available} (Total ${totalStock}). Conflicting with: ${overlappingProjects.join(', ')}`);
        } else if (available - usage.count < 1) { // Low stock warning
            warnings.push(`${usage.name}: Stock running low (${available - usage.count} left).`);
        }
    });

    if (conflicts.length === 0 && warnings.length === 0) {
        return (
            <Popover>
                <PopoverTrigger asChild>
                    <div className="flex items-center text-green-600 text-xs cursor-pointer hover:bg-muted/10 p-1 rounded transition-colors">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        <span>Inventory OK</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                    <div className="text-sm">No inventory conflicts detected for this period.</div>
                </PopoverContent>
            </Popover>
        );
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className={`flex items-center text-xs cursor-pointer p-1 rounded transition-colors ${conflicts.length > 0 ? 'text-destructive font-medium animate-pulse' : 'text-amber-500'}`}>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    <span>{conflicts.length > 0 ? 'Conflict Detected' : 'Low Stock'}</span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="flex flex-col gap-3">
                    <div className="font-semibold border-b pb-2">Inventory Check</div>

                    {/* DEBUG INFO REMOVED */}

                    {conflicts.length > 0 && (
                        <div className="space-y-2">
                            <Badge variant="destructive">Shortage</Badge>
                            <ul className="text-xs list-disc pl-4 space-y-1 text-muted-foreground">
                                {conflicts.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}

                    {warnings.length > 0 && (
                        <div className="space-y-2">
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">Warning</Badge>
                            <ul className="text-xs list-disc pl-4 space-y-1 text-muted-foreground">
                                {warnings.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
