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
import { Calendar as CalendarIcon, Save, FolderOpen, RefreshCw, Loader2, User, Download, Users, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { driveService } from "@/services/driveService";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { StaffManager } from "./StaffManager";
import { useStaffMasterStore } from "@/store/staffMasterStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export function ProjectInfoView() {
    const {
        projectName,
        startDate,
        endDate,
        clientName,
        venue,
        staffName,
        driveFolderId,
        driveFileId,
        members,
        updateMetadata
    } = useProjectStore();

    const { data: session } = useSession();
    const { masterStaff } = useStaffMasterStore();
    const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
        setupDate: undefined as Date | undefined,
        description: "",
        client: "",
        venue: "",
        staff: "",
        spreadsheetUrl: "",
        folderId: ""
    });

    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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
            spreadsheetUrl: useProjectStore.getState().spreadsheetUrl || "",
            folderId: driveFolderId || ""
        });
    }, [projectName, startDate, endDate, clientName, venue, staffName, driveFolderId]);

    const handleSave = async () => {
        if (!session?.accessToken) {
            toast.error("ログインが必要です");
            return;
        }

        setIsSaving(true);
        // 1. Update Store Metadata first
        updateMetadata({
            projectName: formData.name,
            clientName: formData.client,
            venue: formData.venue,
            staffName: formData.staff,
            startDate: formData.startDate || new Date(),
            endDate: formData.endDate || new Date(),
            setupDate: formData.setupDate || new Date(),
            spreadsheetUrl: formData.spreadsheetUrl,
            driveFolderId: formData.folderId
        });

        // 2. Prepare Data for JSON
        const projectState = useProjectStore.getState();
        const savePayload = {
            version: "1.0.0",
            id: projectState.id,
            nodes: projectState.nodes,
            edges: projectState.edges,
            projectName: formData.name,
            clientName: formData.client,
            venue: formData.venue,
            spreadsheetUrl: formData.spreadsheetUrl,
            startDate: formData.startDate,
            endDate: formData.endDate,
            setupDate: formData.setupDate,
            staff: projectState.staff,
            selectedEquipmentIds: projectState.selectedEquipmentIds,
            additionalCosts: projectState.additionalCosts,
            artboard: projectState.artboard,
            members: projectState.members,
            meta: {
                updatedAt: new Date().toISOString(),
                updatedBy: session.user?.email
            }
        };

        try {
            const fileName = `${formData.name || 'Untitled'}.json`;
            const result = await driveService.saveFile(
                session.accessToken,
                fileName,
                savePayload,
                undefined, // Use default or env folder
                driveFileId || undefined // Update if exists
            );

            // Update driveFileId if new file
            if (result.id) {
                useProjectStore.setState({ driveFileId: result.id });
            }

            setIsDirty(false);
            toast.success("プロジェクトを保存しました");
        } catch (e) {
            console.error(e);
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(`保存に失敗しました: ${msg}`, { duration: 8000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestDrive = async () => {
        if (!session?.accessToken) {
            toast.error('Googleアカウントでログインしていません（accessToken なし）');
            return;
        }
        const toastId = toast.loading('Drive接続をテスト中...');
        try {
            const result = await driveService.searchFiles(session.accessToken, '');
            toast.success(
                `Drive接続 OK — ${result.files?.length ?? 0} 件取得（フォルダID: ${process.env.NEXT_PUBLIC_TEAM_FOLDER_ID || '未設定'}）`,
                { id: toastId, duration: 6000 }
            );
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            toast.error(`Drive接続エラー: ${msg}`, { id: toastId, duration: 8000 });
        }
    };

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };

    const handleJsonDownload = () => {
        const projectState = useProjectStore.getState();
        const payload = {
            version: "1.0.0",
            ...projectState,
            projectName: formData.name,
            clientName: formData.client,
            venue: formData.venue,
            startDate: formData.startDate,
            endDate: formData.endDate,
            setupDate: formData.setupDate,
            meta: { exportedAt: new Date().toISOString() }
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${formData.name || 'project'}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('JSONファイルをダウンロードしました');
    };

    // Picker logic removed


    return (

        <div className="flex flex-col h-full w-full bg-slate-50/50 dark:bg-background">
            {/* Fixed Header (Static Block) */}
            <div className="border-b bg-background shrink-0 w-full shadow-sm py-4 z-10">
                <div className="max-w-5xl mx-auto px-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">プロジェクト情報</h2>
                        <p className="text-muted-foreground text-sm mt-1">
                            プロジェクトの基本情報と連携設定を管理します
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleJsonDownload}>
                            <Download className="mr-2 h-4 w-4" />
                            JSON保存
                        </Button>
                        <Button onClick={handleSave} disabled={!isDirty || isSaving} size="lg">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isDirty ? '変更を保存' : '保存済み'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-background/50">
                <div className="max-w-5xl mx-auto p-8 space-y-8 pb-20">
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
                                <div className="space-y-2">
                                    <Label htmlFor="spreadsheetUrl">案件スプレッドシート (URL)</Label>
                                    <Input
                                        id="spreadsheetUrl"
                                        value={formData.spreadsheetUrl}
                                        onChange={(e) => handleChange('spreadsheetUrl', e.target.value)}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
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
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-green-600 flex items-center">
                                            <RefreshCw className="h-3 w-3 mr-1" /> チームフォルダ連携中
                                        </p>
                                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleTestDrive}>
                                            <Wifi className="mr-1.5 h-3.5 w-3.5" /> 接続テスト
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-indigo-500" />
                                    プロジェクトメンバー
                                </h3>
                                <div className="space-y-3">
                                    {masterStaff.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setIsMemberPickerOpen(true)}
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            スタッフマスターから選択
                                        </Button>
                                    )}
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="メールアドレスを追加..."
                                            id="new-member-email"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (!val) return;
                                                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { toast.error('有効なメールアドレスを入力してください'); return; }
                                                    if (!members.includes(val)) {
                                                        updateMetadata({ members: [...members, val] });
                                                        (e.target as HTMLInputElement).value = '';
                                                        setIsDirty(true);
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const el = document.getElementById('new-member-email') as HTMLInputElement;
                                                const val = el.value.trim();
                                                if (!val) return;
                                                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { toast.error('有効なメールアドレスを入力してください'); return; }
                                                if (!members.includes(val)) {
                                                    updateMetadata({ members: [...members, val] });
                                                    el.value = '';
                                                    setIsDirty(true);
                                                }
                                            }}
                                        >
                                            追加
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {members.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic">メンバーが設定されていません</p>
                                        )}
                                        {members.map(email => (
                                            <div key={email} className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                                                {email}
                                                <button
                                                    className="hover:text-red-500"
                                                    onClick={() => {
                                                        updateMetadata({ members: members.filter(m => m !== email) });
                                                        setIsDirty(true);
                                                    }}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        ※ ここで追加したユーザーのダッシュボードにこの案件が表示されるようになります。
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 p-6 border rounded-lg bg-card shadow-sm">
                                <StaffManager />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Master Staff Member Picker Dialog */}
            <Dialog open={isMemberPickerOpen} onOpenChange={setIsMemberPickerOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>スタッフマスターからメンバーを追加</DialogTitle>
                    </DialogHeader>
                    <p className="text-xs text-muted-foreground -mt-2">
                        選択したスタッフのメールアドレスをプロジェクトメンバーに追加します
                    </p>
                    <div className="max-h-72 overflow-y-auto space-y-1 py-2">
                        {masterStaff.filter(m => m.email).map(m => {
                            const already = members.includes(m.email);
                            return (
                                <label
                                    key={m.id}
                                    className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                                >
                                    <Checkbox
                                        checked={already}
                                        onCheckedChange={(checked) => {
                                            if (checked && !already) {
                                                updateMetadata({ members: [...members, m.email] });
                                                setIsDirty(true);
                                            } else if (!checked && already) {
                                                updateMetadata({ members: members.filter(em => em !== m.email) });
                                                setIsDirty(true);
                                            }
                                        }}
                                    />
                                    <div>
                                        <div className="text-sm font-medium">{m.name}</div>
                                        <div className="text-xs text-muted-foreground">{m.email}</div>
                                    </div>
                                </label>
                            );
                        })}
                        {masterStaff.filter(m => m.email).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                メールアドレスが登録されたスタッフがいません
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setIsMemberPickerOpen(false)}>完了</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
