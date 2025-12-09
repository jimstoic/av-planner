'use client';

import { Button } from "@/components/ui/button";
import { Moon, Sun, Save, FolderOpen, LogOut, FileText, ChevronLeft, LogIn, LayoutGrid, Zap } from "lucide-react";
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut, signIn } from "next-auth/react";
import { driveService } from "@/services/driveService";
import { toast } from "sonner";
import { useProjectStore } from "@/store/projectStore";
import { Badge } from '@/components/ui/badge'; // Re-added Badge import
import { ThemeToggle } from "@/components/theme-toggle"; // Re-added ThemeToggle import
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConflictDisplay } from "./conflict-display";

export function Header() {
    const { projectName, clientName, ...projectData } = useProjectStore(); // Get all data
    const { data: session } = useSession();
    // Removed Picker Hook
    const { setDriveFolderId, setDriveFolderName } = useProjectStore();

    useEffect(() => {
        // When session changes or driveFolderId changes, we might want to refresh checks
        // For MVP, just ensure we have access
    }, [session]);

    const handleDriveSave = async () => {
        // Local Save Logic (Always run)
        try {
            const projectDataToSave = { projectName, clientName, ...projectData };
            localStorage.setItem(`project-${projectData.id}`, JSON.stringify(projectDataToSave));

            // Update Index
            const indexStr = localStorage.getItem('av-planner-index');
            let index = indexStr ? JSON.parse(indexStr) : [];
            // Remove existing entry for this ID
            index = index.filter((p: any) => p.id !== projectData.id);
            // Add new entry
            index.unshift({
                id: projectData.id,
                name: projectName,
                client: clientName,
                updatedAt: Date.now()
            });
            localStorage.setItem('av-planner-index', JSON.stringify(index));
            toast.success("ローカル保存しました");
        } catch (e) {
            console.error("Local Save Error", e);
        }

        if (!session?.accessToken) {
            toast.error("保存するにはログインが必要です");
            return;
        }

        const toastId = toast.loading("Saving to Google Drive...");
        try {
            // MVP: Save to root with timestamped name or project name
            const fileName = `${projectName || 'Untitled'}.json`;
            const content = { ...projectData, projectName, clientName }; // projectData includes driveFileId

            // Determine Parent Folder: Team Folder > Project Folder > Root
            const teamFolderId = process.env.NEXT_PUBLIC_TEAM_FOLDER_ID;
            let targetFolderId = projectData.driveFolderId || undefined;

            // If we are creating a NEW file (no driveFileId) and Team Folder is set, enforce it
            if (!projectData.driveFileId && teamFolderId) {
                targetFolderId = teamFolderId;
            }

            // Use driveFileId if available (Overwrite), otherwise create new
            const result = await driveService.saveFile(
                session.accessToken,
                fileName,
                content,
                targetFolderId,
                projectData.driveFileId || undefined
            );

            // If new file, update store with new ID
            if (result.id) {
                useProjectStore.setState({ driveFileId: result.id });
            }

            toast.success("Saved to Google Drive!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to save to Drive", { id: toastId });
        }
    };

    // Removed picker logic


    return (
        <header className="h-14 border-b bg-background flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl hidden md:block">AV Planner</span>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" asChild>
                        <a href="/dashboard">Dashboard</a>
                    </Button>
                </div>

                <div className="flex-1 ml-6 border-l pl-6 hidden md:block">
                    <div>
                        <div className="font-semibold text-sm leading-none">{projectName || 'Untitled Project'}</div>
                        <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                            {clientName && <span>{clientName}</span>}
                            {clientName && (projectData.venue || projectData.startDate) && <span>|</span>}
                            {projectData.venue && <span>@{projectData.venue}</span>}
                            {projectData.startDate && <span>({new Date(projectData.startDate).toLocaleDateString()})</span>}
                        </div>
                    </div>
                    <div className="ml-2 pl-2 border-l h-8 flex items-center">
                        <ConflictDisplay />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleDriveSave}>
                    <Save className="h-4 w-4 mr-2" />
                    保存 {session ? '(Drive & Local)' : '(Local Only)'}
                </Button>

                {session ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                                    <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{session.user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {session.user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()}>
                                <LogOut className="mr-2 h-4 w-4" />
                                ログアウト
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => signIn("google")}>
                        <LogIn className="w-4 h-4 mr-2" />
                        ログイン
                    </Button>
                )}

                <ThemeToggle />
            </div>
        </header>
    );
}
