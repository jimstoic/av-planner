'use client';

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, FileJson, LayoutDashboard, LogIn, Calendar } from "lucide-react";
import { driveService } from "@/services/driveService";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/store/projectStore";
import { TemplateWizard } from "@/modules/wizard/TemplateWizard";

export default function LandingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { loadProject, resetProject } = useProjectStore();

    // View State: 'dashboard' | 'open' | 'template'
    const [view, setView] = useState<'dashboard' | 'open' | 'template'>('dashboard');

    // State for Drive Files
    const [driveFiles, setDriveFiles] = useState<any[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Fetch Drive Files only when 'open' view is active
    useEffect(() => {
        if (status === 'authenticated' && session?.accessToken && view === 'open') {
            fetchDriveFiles();
        }
    }, [status, session, view]);

    const fetchDriveFiles = async () => {
        setIsLoadingFiles(true);
        try {
            const query = "mimeType = 'application/json' and trashed = false";
            const data = await driveService.searchFiles(session!.accessToken!, query);
            if (data.files) {
                setDriveFiles(data.files);
            }
        } catch (error) {
            console.error("Failed to fetch drive files:", error);
            toast.error("プロジェクト一覧の取得に失敗しました");
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleNewProject = () => {
        resetProject();
        router.push('/project');
    };

    const handleLoadFile = async (fileId: string, fileName: string) => {
        const toastId = toast.loading(`${fileName} を読み込み中...`);
        try {
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${session?.accessToken}` }
            });

            if (!res.ok) throw new Error("Failed to download file");

            const data = await res.json();

            // Validate if it's a valid project file (basic check)
            if (!data.id && !data.nodes) {
                toast.error("無効なプロジェクトファイルです", { id: toastId });
                return;
            }

            // Load into Store
            loadProject({
                ...data,
                driveFolderId: '',
                driveFolderName: '',
                driveFileId: fileId,
                id: data.id || 'imported-project'
            });

            useProjectStore.setState({ driveFileId: fileId });

            toast.success("読み込み完了", { id: toastId });
            router.push('/project');

        } catch (e) {
            console.error(e);
            toast.error("読み込みに失敗しました", { id: toastId });
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // GUEST VIEW
    if (status === 'unauthenticated') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4 text-center">
                <div className="space-y-6 max-w-lg">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                            AV Planner
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            チームのためのAV配線図 & 見積もり作成ツール
                        </p>
                    </div>

                    <Card className="w-full shadow-lg border-muted/40">
                        <CardHeader>
                            <CardTitle>Welcome</CardTitle>
                            <CardDescription>
                                プロジェクトを作成・共有するにはログインしてください
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <Button size="lg" className="w-full" onClick={() => signIn('google')}>
                                    <LogIn className="mr-2 h-4 w-4" /> Googleアカウントでログイン
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-sm text-muted-foreground">
                        <p>Powered by Next.js & Google Drive Integration</p>
                    </div>
                </div>
            </div>
        );
    }

    // AUTHENTICATED DASHBOARD
    return (
        <div className="min-h-screen bg-muted/10">
            {/* Dashboard Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur px-6 shadow-sm">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <h1 className="text-lg font-bold">Dashboard</h1>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <img
                            src={session?.user?.image || ''}
                            alt={session?.user?.name || ''}
                            className="h-8 w-8 rounded-full border"
                        />
                        <span className="hidden md:inline">{session?.user?.name}</span>
                    </div>
                </div>
            </header>

            <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
                {view === 'dashboard' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center sm:text-left">
                            ようこそ、{session?.user?.name} さん
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Option 1: New Project */}
                            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 group" onClick={handleNewProject}>
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-10 h-10 text-primary" />
                                    </div>
                                    <CardTitle>新規作成</CardTitle>
                                    <CardDescription>まっさらな状態からプロジェクトを開始します</CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Option 2: Resume / Edit */}
                            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500/50 group" onClick={() => setView('open')}>
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <FileJson className="w-10 h-10 text-blue-600" />
                                    </div>
                                    <CardTitle>プロジェクトを開く</CardTitle>
                                    <CardDescription>保存されたプロジェクトを再開・編集します</CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Option 3: Template */}
                            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-emerald-500/50 group" onClick={() => setView('template')}>
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto bg-emerald-100 dark:bg-emerald-900/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <LayoutDashboard className="w-10 h-10 text-emerald-600" />
                                    </div>
                                    <CardTitle>テンプレートから作成</CardTitle>
                                    <CardDescription>Zoom配信や収録など、目的から素早く作成します</CardDescription>
                                </CardHeader>
                            </Card>

                            {/* Option 4: Schedule Shortcut */}
                            <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-500/50 group" onClick={() => router.push('/project?tab=schedule')}>
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full w-20 h-20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-10 h-10 text-purple-600" />
                                    </div>
                                    <CardTitle>スケジュール</CardTitle>
                                    <CardDescription>進行中のプロジェクトのスケジュールを確認します</CardDescription>
                                </CardHeader>
                            </Card>
                        </div>
                    </div>
                )}

                {view === 'open' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => setView('dashboard')}>
                                ← 戻る
                            </Button>
                            <h2 className="text-2xl font-bold">プロジェクトを開く</h2>
                        </div>

                        {isLoadingFiles ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : driveFiles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {driveFiles.map((file) => (
                                    <Card
                                        key={file.id}
                                        className="group cursor-pointer hover:shadow-md transition-all border-muted/60 hover:border-primary/50"
                                        onClick={() => handleLoadFile(file.id, file.name)}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start gap-2">
                                                <CardTitle className="text-base font-semibold truncate leading-tight">
                                                    {file.name.replace('.json', '')}
                                                </CardTitle>
                                                <FileJson className="h-4 w-4 text-muted-foreground shrink-0" />
                                            </div>
                                            <CardDescription className="text-xs truncate">
                                                ID: {file.id}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
                                            <Badge variant="secondary" className="font-normal bg-muted/50">Drive File</Badge>
                                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">開く →</span>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/5">
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted/20 mb-4">
                                    <FileJson className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">プロジェクトが見つかりません</h3>
                                <p className="text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
                                    Google DriveのルートフォルダにJSON形式のプロジェクトファイルが見つかりませんでした。
                                </p>
                                <Button variant="outline" onClick={fetchDriveFiles}>
                                    再読み込み
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'template' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" onClick={() => setView('dashboard')}>
                                ← 戻る
                            </Button>
                        </div>
                        <TemplateWizard />
                    </div>
                )}
            </main>
        </div>
    );
}
