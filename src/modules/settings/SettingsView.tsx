"use client";

import React, { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useStaffMasterStore } from '@/store/staffMasterStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Landmark, Cloud, Layout, Building2, Download } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
    const [isImporting, setIsImporting] = useState(false);
    const {
        taxRate,
        currency,
        defaultArtboardSize,
        defaultArtboardOrientation,
        companyInfo,
        updateSettings,
        loadFromServer: reloadSettings,
    } = useSettingsStore();
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
            // ストアをリロード
            await Promise.all([reloadEquipment(), reloadStaff(), reloadSettings()]);
            toast.success(`インポート完了: 機材 ${data.importedEquipment}件、スタッフ ${data.importedStaff}件`);
        } catch (e) {
            toast.error('インポート中にエラーが発生しました');
        } finally {
            setIsImporting(false);
        }
    };

    const updateCompanyField = (field: string, value: string) => {
        updateSettings({
            companyInfo: { ...companyInfo, [field]: value }
        });
    };

    const updateBankField = (field: string, value: string) => {
        updateSettings({
            companyInfo: {
                ...companyInfo,
                bankInfo: { ...companyInfo.bankInfo!, [field]: value }
            }
        });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="border-b pb-4">
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-primary" /> 設定 (Settings)
                </h2>
                <p className="text-muted-foreground mt-1 text-lg">
                    アプリケーション全体の動作と共通設定を管理します
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Financial Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-blue-500" /> 財務設定
                        </CardTitle>
                        <CardDescription>見積もり計算に関するデフォルト設定</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>消費税率 (%)</Label>
                            <Input
                                type="number"
                                value={taxRate}
                                onChange={(e) => updateSettings({ taxRate: Number(e.target.value) })}
                                className="max-w-[120px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>通貨記号</Label>
                            <Input
                                value={currency}
                                onChange={(e) => updateSettings({ currency: e.target.value })}
                                className="max-w-[120px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Diagram Defaults */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layout className="w-5 h-5 text-emerald-500" /> ダイアグラム規定値
                        </CardTitle>
                        <CardDescription>新規プロジェクト作成時のエディタ設定</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>デフォルト アートボードサイズ</Label>
                            <Select
                                value={defaultArtboardSize}
                                onValueChange={(val: any) => updateSettings({ defaultArtboardSize: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A4">A4</SelectItem>
                                    <SelectItem value="A3">A3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>デフォルト 向き</Label>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm">縦 (Portrait)</span>
                                <Switch
                                    checked={defaultArtboardOrientation === 'landscape'}
                                    onCheckedChange={(val) => updateSettings({ defaultArtboardOrientation: val ? 'landscape' : 'portrait' })}
                                />
                                <span className="text-sm">横 (Landscape)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Company Info */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-violet-500" /> 会社情報
                        </CardTitle>
                        <CardDescription>見積書・請求書のヘッダーに表示される情報です</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>会社名</Label>
                                <Input value={companyInfo.name} onChange={(e) => updateCompanyField('name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>郵便番号</Label>
                                <Input value={companyInfo.zipCode} onChange={(e) => updateCompanyField('zipCode', e.target.value)} placeholder="〒000-0000" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>住所</Label>
                                <Input value={companyInfo.address} onChange={(e) => updateCompanyField('address', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>電話番号</Label>
                                <Input value={companyInfo.tel} onChange={(e) => updateCompanyField('tel', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>メールアドレス</Label>
                                <Input value={companyInfo.email} onChange={(e) => updateCompanyField('email', e.target.value)} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>適格請求書発行事業者番号 (インボイス)</Label>
                                <Input value={companyInfo.registrationNumber || ''} onChange={(e) => updateCompanyField('registrationNumber', e.target.value)} placeholder="T0000000000000" className="max-w-sm font-mono" />
                            </div>
                        </div>

                        {/* Bank Info */}
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-blue-500" /> 振込先情報
                                <span className="text-xs text-muted-foreground font-normal">（請求書に表示されます）</span>
                            </h4>
                            {companyInfo.bankInfo && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>金融機関名</Label>
                                        <Input value={companyInfo.bankInfo.bankName} onChange={(e) => updateBankField('bankName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>支店名</Label>
                                        <Input value={companyInfo.bankInfo.branchName} onChange={(e) => updateBankField('branchName', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>口座種別</Label>
                                        <Select value={companyInfo.bankInfo.accountType} onValueChange={(val) => updateBankField('accountType', val)}>
                                            <SelectTrigger className="max-w-[160px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="普通">普通</SelectItem>
                                                <SelectItem value="当座">当座</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>口座番号</Label>
                                        <Input value={companyInfo.bankInfo.accountNumber} onChange={(e) => updateBankField('accountNumber', e.target.value)} className="font-mono max-w-[200px]" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>口座名義</Label>
                                        <Input value={companyInfo.bankInfo.accountHolder} onChange={(e) => updateBankField('accountHolder', e.target.value)} className="max-w-sm" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Cloud & Integration */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cloud className="w-5 h-5 text-sky-500" /> クラウド・外部連携
                        </CardTitle>
                        <CardDescription>Google Driveとの接続設定</CardDescription>
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
                                ※ このIDは環境変数 `.env` で管理されています。変更が必要な場合はシステム管理者に連絡してください。
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

            <div className="pt-8 flex justify-center">
                <Button variant="ghost" className="text-muted-foreground text-xs" onClick={() => {
                    if (confirm("全ての設定をリセットしますか？")) {
                        localStorage.removeItem('av-planner-settings');
                        window.location.reload();
                    }
                }}>
                    設定をリセット
                </Button>
            </div>
        </div>
    );
}
