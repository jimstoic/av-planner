"use client";

import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useProjectRegistryStore } from '@/store/projectRegistryStore';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import DiagramEditor from '@/modules/diagram/DiagramEditor';
import { ConflictDisplay } from '@/components/project/ConflictDisplay';
import { LibraryView } from '@/modules/library/LibraryView';
import { ProjectInfoView } from '@/modules/project/ProjectInfoView';
import { QuotationView } from '@/modules/reports/QuotationView';
import { ScheduleView } from '@/modules/schedule/ScheduleView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Hammer, Library, CalendarDays, Info, Receipt, CheckCircle2 } from "lucide-react";

import { useSearchParams } from 'next/navigation'; // Added import

import { Suspense } from 'react'; // Added import

// Extracted Component for SearchParams usage
function ProjectContent() {
  const searchParams = useSearchParams(); // Get search params
  const initialTab = searchParams.get('tab') || "info"; // Default to info if no tab param

  // Determine default tab based on workflow (start with Info or Diagram?)
  // User probably wants to start with Diagram or Info. Let's default to Diagram as it's the core, or Info as it's step 1.
  // Let's default to 'info' as it is the first step in the "waterfall".
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync to Registry
  const project = useProjectStore();
  const { registerProject } = useProjectRegistryStore();

  useEffect(() => {
    // Debounce or just run on every change (basic)
    registerProject({
      id: project.id,
      name: project.projectName || 'Untitled Project',
      startDate: project.startDate,
      endDate: project.endDate,
      status: 'planning', // Default
      equipmentUsage: (project.selectedEquipmentIds || []).map(id => ({ equipmentId: id, quantity: 1 }))
    });
  }, [project.id, project.projectName, project.startDate, project.endDate, project.selectedEquipmentIds, registerProject]);


  return (
    <div className="h-screen w-full flex flex-col bg-background">
      <Header />

      {/* Navigation Tabs Bar - Centered */}
      <div className="border-b bg-muted/30 pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
          <TabsList className="h-auto bg-transparent p-0 gap-8 mb-0">
            <TabsTrigger
              value="info"
              className="flex flex-col gap-1 items-center py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary hover:text-primary/80 transition-all"
            >
              <Info className="h-5 w-5" />
              <span className="text-xs font-medium">1. プロジェクト情報</span>
            </TabsTrigger>

            <TabsTrigger
              value="library"
              className="flex flex-col gap-1 items-center py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary hover:text-primary/80 transition-all"
            >
              <Library className="h-5 w-5" />
              <span className="text-xs font-medium">2. 機材リスト</span>
            </TabsTrigger>

            <TabsTrigger
              value="diagram"
              className="flex flex-col gap-1 items-center py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary hover:text-primary/80 transition-all"
            >
              <Hammer className="h-5 w-5" />
              <span className="text-xs font-medium">3. 配線図</span>
            </TabsTrigger>

            <TabsTrigger
              value="quotation"
              className="flex flex-col gap-1 items-center py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary hover:text-primary/80 transition-all"
            >
              <Receipt className="h-5 w-5" />
              <span className="text-xs font-medium">4. 見積・請求</span>
            </TabsTrigger>

            <TabsTrigger
              value="schedule"
              className="flex flex-col gap-1 items-center py-3 px-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary hover:text-primary/80 transition-all"
            >
              <CalendarDays className="h-5 w-5" />
              <span className="text-xs font-medium">5. スケジュール</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden relative bg-background">
        {activeTab === "info" && (
          <div className="h-full w-full overflow-hidden">
            <ProjectInfoView />
          </div>
        )}

        {activeTab === "library" && (
          <div className="h-full w-full overflow-hidden">
            <LibraryView />
          </div>
        )}

        {activeTab === "diagram" && (
          <div className="flex h-full w-full animate-in fade-in duration-300">
            <Sidebar />
            <div className="flex-1 relative h-full bg-slate-50 dark:bg-slate-900/50">
              <DiagramEditor />
              <ConflictDisplay />
            </div>
          </div>
        )}

        {activeTab === "quotation" && (
          <div className="h-full w-full overflow-hidden animate-in fade-in duration-300">
            <QuotationView />
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="h-full w-full overflow-hidden animate-in fade-in duration-300">
            <ScheduleView />
          </div>
        )}
      </div>
    </div>
  );
}

// Main Page Component
export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <ProjectContent />
    </Suspense>
  );
}
