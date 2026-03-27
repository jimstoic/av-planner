"use client";

import React, { useState } from 'react';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useStaffMasterStore } from '@/store/staffMasterStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useOrgSettingsStore } from '@/store/orgSettingsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Cloud, Download } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
    const [isImporting, setIsImporting] = useState(false);
    const { loadFromServer: reloadSettings } = useSettingsStore();
    const { loadFromServer: reloadOrgSettings } = useOrgSettingsStore();
    const { loadFromServer: reloadEquipment } = useEquipmentStore();
    const { loadFromServer: reloadStaff } = useStaffMasterStore();

    const handleImportFromDrive = async () => {
        setIsImporting(true);
        try {
            const res = await fetch('/api/db/import-from-drive', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'インポートに失敗しました');
                return;
            }
            await Promise.all([reloadEquipment(), reloadStaff(), reloadSettings(), reloadOrgSettings()]);
            toast.success(`インポート完了: 機材 ${data.importedEquipment}件、スタッフ ${data.importedStaff}件`);
        } catch (e) {
            toast.error('インポート中にエラーが発生しました');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-primary" /> クラウド設定
                </h2>
                <p className="text-muted-foreground mt-1 text-lg">
                    Google Driveとの連携設定を管理します
                </p>
            </div>

            {/* Cloud & Integration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Cloud className="w-5 h-5 text-sky-500" /> Google Drive 連携
                    </CardTitle>
                    <CardDescription>共有チームフォルダの設定とデータのインポート</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>共有チームフォルダID (Read-only)</Label>
                        <div className="flex gap-2">
                            <Input
                                value={process.env.NEXT_PUBLIC_TEAM_FOLDER_ID || "未設定"}
                                readOnly
                                className="bg-muted font-mono text-xs"
                            />
                            <Button variant="outline" size="sm" onClick={() => {
                                navigator.clipboard.writeText(process.env.NEXT_PUBLIC_TEAM_FOLDER_ID || "");
                                toast.success("コピーしました");
                            }}>
                                コピー
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            このIDは環境変数で管理されています。変更が必要な場合はシステム管理者に連絡してください。
                        </p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <Label className="flex items-center gap-2">
                            <Download className="w-4 h-4" /> Google Driveからデータをインポート
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Google Driveに保存されている旧マスターデータ（機材・スタッフ・設定）をSupabaseに一括インポートします。既存のデータは上書きされます。
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleImportFromDrive}
                            disabled={isImporting}
                        >
                            {isImporting ? 'インポート中...' : 'Driveからインポート'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
