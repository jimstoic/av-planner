"use client";

import { useState, useEffect } from 'react';
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, FolderOpen, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectInfoView() {
    const {
        projectName,
        startDate,
        endDate,
        clientName,
        venue,
        staffName,
        driveFolderId,
        updateMetadata
    } = useProjectStore();

    // Removed Picker Hook


    const [formData, setFormData] = useState({
        name: "",
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
        setupDate: undefined as Date | undefined,
        description: "",
        client: "",
        venue: "",
        staff: "",
        folderId: ""
    });

    const [isDirty, setIsDirty] = useState(false);

    // Popover states
    const [isStartOpen, setIsStartOpen] = useState(false);
    const [isEndOpen, setIsEndOpen] = useState(false);
    const [isSetupOpen, setIsSetupOpen] = useState(false);

    // Load initial data
    useEffect(() => {
        setFormData({
            name: projectName,
            startDate: startDate,
            endDate: endDate,
            setupDate: useProjectStore.getState().setupDate,
            description: "",
            client: clientName,
            venue: venue || "",
            staff: staffName,
            folderId: driveFolderId || ""
        });
    }, [projectName, startDate, endDate, clientName, venue, staffName, driveFolderId]);

    const handleSave = () => {
        updateMetadata({
            projectName: formData.name,
            clientName: formData.client,
            venue: formData.venue,
            staffName: formData.staff,
            startDate: formData.startDate || new Date(),
            endDate: formData.endDate || new Date(),
            setupDate: formData.setupDate || new Date(),
            driveFolderId: formData.folderId
        });
        setIsDirty(false);
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    // Picker logic removed


    return (
    return (
        <div className="flex flex-col h-full w-full bg-slate-50/50 dark:bg-background">
            {/* Fixed Header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 sticky top-0 z-10 w-full shadow-sm">
                <div className="max-w-5xl mx-auto px-8 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">プロジェクト情報</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            プロジェクトの基本情報と連携設定を管理します
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={!isDirty} size="lg">
                        <Save className="mr-2 h-4 w-4" />
                        {isDirty ? '変更を保存' : '保存済み'}
                    </Button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-6">
                            <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    基本情報
                                </h3>

                                <div className="space-y-2">
                                    <Label htmlFor="name">プロジェクト名 <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="例: 〇〇株式会社 新製品発表会"
                                        className="text-lg font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="client">クライアント名</Label>
                                        <Input
                                            id="client"
                                            value={formData.client}
                                            onChange={(e) => handleChange('client', e.target.value)}
                                            placeholder="例: 株式会社〇〇"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="venue">会場名</Label>
                                        <Input
                                            id="venue"
                                            value={formData.venue}
                                            onChange={(e) => handleChange('venue', e.target.value)}
                                            placeholder="例: 東京ビッグサイト"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-base font-semibold border-b pb-1 mb-2 block">スケジュール</Label>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label>仕込み日 (Setup)</Label>
                                            <Popover open={isSetupOpen} onOpenChange={setIsSetupOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !formData.setupDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {formData.setupDate ? format(formData.setupDate, "PPP") : <span>日付を選択</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.setupDate}
                                                        onSelect={(date) => {
                                                            handleChange('setupDate', date);
                                                            setIsSetupOpen(false);
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>開催日 (Start)</Label>
                                            <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !formData.startDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {formData.startDate ? format(formData.startDate, "PPP") : <span>日付を選択</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.startDate}
                                                        onSelect={(date) => {
                                                            handleChange('startDate', date);
                                                            setIsStartOpen(false);
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>終了日 (End)</Label>
                                            <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full justify-start text-left font-normal",
                                                            !formData.endDate && "text-muted-foreground"
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {formData.endDate ? format(formData.endDate, "PPP") : <span>日付を選択</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.endDate}
                                                        onSelect={(date) => {
                                                            handleChange('endDate', date);
                                                            setIsEndOpen(false);
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">概要 / メモ</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="プロジェクトの概要や共有事項..."
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Cloud & Integrations */}
                        <div className="space-y-6">
                            <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <FolderOpen className="h-5 w-5 text-blue-500" />
                                    クラウド連携 (Team Drive)
                                </h3>

                                <div className="p-4 bg-muted/30 rounded-md border text-sm text-muted-foreground space-y-2">
                                    <p>
                                        環境変数で指定されたチームフォルダに自動保存されます。
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="folderId">連携フォルダID (固定)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="folderId"
                                            value={process.env.NEXT_PUBLIC_TEAM_FOLDER_ID || formData.folderId || "設定されていません"}
                                            readOnly={true}
                                            className="font-mono text-xs bg-muted text-muted-foreground"
                                        />
                                    </div>
                                    <p className="text-xs text-green-600 flex items-center mt-1">
                                        <RefreshCw className="h-3 w-3 mr-1" /> チームフォルダ連携中
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm opacity-50 pointer-events-none">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    チームメンバー (Coming Soon)
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    チームメンバーの招待機能は開発中です。現在はGoogle Driveの共有権限にて管理してください。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
