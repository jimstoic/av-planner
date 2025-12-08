"use client";

import { useEquipmentStore } from "@/store/equipmentStore";
import { useProjectStore } from "@/store/projectStore"; // Added
import { Search, GripVertical, ListFilter } from "lucide-react"; // Added ListFilter
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Sidebar() {
    const { equipment } = useEquipmentStore();
    const { selectedEquipmentIds } = useProjectStore(); // Use selections

    // Filter equipment based on selection
    const filteredEquipment = equipment.filter(item =>
        selectedEquipmentIds && selectedEquipmentIds.includes(item.id)
    );

    // Group equipment by category
    const groupedEquipment = filteredEquipment.reduce((acc, item) => {
        const cat = item.majorCategory || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, typeof equipment>);

    const onDragStart = (event: React.DragEvent, item: typeof equipment[0]) => {
        // IMPORTANT: Data format must match DiagramEditor's onDrop expectation
        event.dataTransfer.setData('application/reactflow', 'equipment');
        event.dataTransfer.setData('application/json', JSON.stringify(item));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-64 border-r bg-background flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <ListFilter className="h-4 w-4" />
                    使用機材 (Selected)
                </h3>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="機材を検索..." className="pl-8" />
                </div>
            </div>
            <ScrollArea className="flex-1">
                {filteredEquipment.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        <p className="mb-2">機材が選択されていません。</p>
                        <p className="text-xs opacity-70">「機材リスト」タブで使用する機材にチェックを入れてください。</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-6">
                        {/* Categories */}
                        {Object.entries(groupedEquipment).map(([category, items]) => (
                            <div key={category}>
                                <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                                    {category}
                                </h4>
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-3 border rounded-md hover:bg-accent cursor-pointer group transition-colors bg-card shadow-sm select-none"
                                            draggable
                                            onDragStart={(event) => onDragStart(event, item)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm truncate">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                        {item.manufacturer}
                                                        {item.stockQuantity > 0 && (
                                                            <Badge variant="outline" className="text-[10px] h-4 px-1 ml-auto">
                                                                x{item.stockQuantity}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator className="mt-4" />
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
