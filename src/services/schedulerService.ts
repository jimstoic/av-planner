import { driveService } from "./driveService";
import { ProjectState, Staff, ScheduleItem } from "@/store/projectStore";
import { recursiveDateParse } from "@/lib/utils";

export interface ProjectSummary {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    venue: string;
    staff: Staff[];
    equipmentIds: string[];
    schedule: ScheduleItem[];
    members?: string[];
    spreadsheetUrl?: string;
    fileId: string;
}

export const schedulerService = {
    /**
     * Fetches all project files from the Team Folder and aggregates them.
     * Skips master files and non-project JSONs.
     */
    async fetchAllProjects(accessToken: string): Promise<ProjectSummary[]> {
        // 1. Search for all JSON files
        const filesResult = await driveService.searchFiles(accessToken, "mimeType = 'application/json' and trashed = false");

        if (!filesResult.files) return [];

        const projectSummaries: ProjectSummary[] = [];
        const ignoredFiles = ['staff-master.json', 'equipment-master.json'];

        // 2. Filter relevant files
        const relevantFiles = (filesResult.files || []).filter((f: any) => !ignoredFiles.includes(f.name));

        // 3. Fetch content in parallel
        const fetchPromises = relevantFiles.map(async (file: any) => {
            try {
                const data = await driveService.getFileContent(accessToken, file.id);

                // Basic validation that it looks like a project
                if (!data.id || !data.projectName) return null;

                const parsed = recursiveDateParse(data);

                return {
                    id: parsed.id,
                    name: parsed.projectName || file.name.replace('.json', ''),
                    startDate: parsed.startDate || new Date(),
                    endDate: parsed.endDate || new Date(),
                    venue: parsed.venue || '',
                    staff: parsed.staff || [],
                    equipmentIds: parsed.selectedEquipmentIds || [],
                    schedule: parsed.schedule || [],
                    members: parsed.members || [],
                    spreadsheetUrl: parsed.spreadsheetUrl,
                    fileId: file.id
                } as ProjectSummary;

            } catch (e) {
                console.error(`Failed to parse file ${file.name}`, e);
                return null;
            }
        });

        const results = await Promise.all(fetchPromises);

        return results.filter((p): p is ProjectSummary => p !== null);
    }
};
