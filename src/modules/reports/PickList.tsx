'use client';

import { useProjectStore } from '@/store/projectStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Equipment } from '@/types/equipment';

export default function PickList() {
    const nodes = useProjectStore((state) => state.nodes);
    const edges = useProjectStore((state) => state.edges);

    // Aggregate nodes by equipment ID
    const equipmentMap = new Map<string, { count: number; data: Equipment }>();

    nodes.forEach((node) => {
        if ((node.type === 'equipment' || node.type === 'equipmentNode') && node.data) {
            // Safe casting as we know the structure
            const equipmentData = node.data as unknown as Equipment;
            const originalId = node.data.equipmentId as string || equipmentData.id;

            if (originalId) {
                const id = originalId; // Use originalId as the key for the map

                if (equipmentMap.has(id)) {
                    equipmentMap.get(id)!.count++;
                } else {
                    equipmentMap.set(id, { count: 1, data: equipmentData });
                }
            }
        }
    });

    // Aggregate cables
    const cableMap = new Map<string, { count: number; length: string; type: string }>();

    edges.forEach((edge) => {
        const type = (edge.data?.type as string) || 'Unknown';
        const length = (edge.data?.length as string) || '1m';
        const key = `${type}-${length}`;

        if (cableMap.has(key)) {
            cableMap.get(key)!.count++;
        } else {
            cableMap.set(key, { count: 1, type, length });
        }
    });

    const listItems = Array.from(equipmentMap.values());
    const cableItems = Array.from(cableMap.values());
    const totalItems = listItems.reduce((acc, item) => acc + item.count, 0) + cableItems.reduce((acc, item) => acc + item.count, 0);

    return (
        <Card className="m-4">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    機材ピックリスト
                    <span className="text-sm font-normal text-muted-foreground">合計アイテム数: {totalItems}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">機材</h3>
                    {listItems.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 text-sm">
                            ダイアグラム上に機材がありません。
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>カテゴリ</TableHead>
                                    <TableHead>名称</TableHead>
                                    <TableHead>メーカー</TableHead>
                                    <TableHead className="text-right">数量</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {listItems.map(({ count, data }) => (
                                    <TableRow key={data.id}>
                                        <TableCell className="capitalize font-medium text-muted-foreground">{data.category}</TableCell>
                                        <TableCell>{data.name}</TableCell>
                                        <TableCell>{data.manufacturer}</TableCell>
                                        <TableCell className="text-right font-bold">{count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {cableItems.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">ケーブル</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>種別</TableHead>
                                    <TableHead>長さ</TableHead>
                                    <TableHead className="text-right">数量</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cableItems.map((cable) => (
                                    <TableRow key={`${cable.type}-${cable.length}`}>
                                        <TableCell className="font-medium">{cable.type}</TableCell>
                                        <TableCell>{cable.length}</TableCell>
                                        <TableCell className="text-right font-bold">{cable.count}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
