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
import useDrivePicker from 'react-google-drive-picker';

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

    const [openPicker, authResponse] = useDrivePicker();

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

    const [isPicking, setIsPicking] = useState(false);

    const handleOpenPicker = () => {
        setIsPicking(true);
        try {
            openPicker({
                clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
                developerKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
                viewId: "FOLDERS",
                showUploadView: true,
                showUploadFolders: true,
                supportDrives: true,
                multiselect: false,
                setSelectFolderEnabled: true,
                callbackFunction: (data) => {
                    if (data.action === 'picked') {
                        const folder = data.docs[0];
                        setFormData(prev => ({ ...prev, folderId: folder.id }));
                        setIsDirty(true);
                    }
                    if (data.action === 'cancel' || data.action === 'picked') {
                        setIsPicking(false);
                    }
                },
            });
        } catch (e) {
            console.error("Picker Error", e);
            setIsPicking(false);
        }
    };

    return (
        <div className="h-full w-full max-w-5xl mx-auto p-8 flex flex-col gap-8">
            <div className="flex justify-between items-center border-b pb-4">
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
                            クラウド連携 (Google Drive)
                        </h3>

                        <div className="p-4 bg-muted/30 rounded-md border text-sm text-muted-foreground space-y-2">
                            <p>
                                プロジェクトファイルを保存・同期するGoogle Driveフォルダを指定します。
                                指定したフォルダに <code>project.json</code> が自動的に保存され、チームメンバーと共有できます。
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="folderId">連携フォルダID</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="folderId"
                                    value={formData.folderId}
                                    onChange={(e) => handleChange('folderId', e.target.value)}
                                    placeholder="Google Drive Folder ID"
                                    className="font-mono text-xs"
                                    readOnly={true}
                                />
                                <Button variant="outline" onClick={handleOpenPicker} disabled={isPicking}>
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    {isPicking ? '読込中...' : '選択'}
                                </Button>
                            </div>
                            {formData.folderId && (
                                <p className="text-xs text-green-600 flex items-center mt-1">
                                    <RefreshCw className="h-3 w-3 mr-1" /> 連携中
                                </p>
                            )}
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
    );
}
