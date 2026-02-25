"use client";

import React from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Landmark, Cloud, Layout } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
    const {
        taxRate,
        currency,
        defaultArtboardSize,
        defaultArtboardOrientation,
        updateSettings
    } = useSettingsStore();

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
