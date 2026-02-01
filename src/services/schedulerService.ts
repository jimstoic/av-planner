import { driveService } from "./driveService";
import { ProjectState, Staff, ScheduleItem } from "@/store/projectStore";

export interface ProjectSummary {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    venue: string;
    staff: Staff[];
    equipmentIds: string[];
    schedule: ScheduleItem[];
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
        // We use the same search logic as page.tsx but strictly for JSONs
        const filesResult = await driveService.searchFiles(accessToken, "mimeType = 'application/json' and trashed = false");

        if (!filesResult.files) return [];

        const projectSummaries: ProjectSummary[] = [];
        const ignoredFiles = ['staff-master.json', 'equipment-master.json'];

        // 2. Filter relevant files
        const relevantFiles = (filesResult.files || []).filter((f: any) => !ignoredFiles.includes(f.name));

        // 3. Fetch content in parallel (limit concurrency in real app, but here simplistic)
        const fetchPromises = relevantFiles.map(async (file: any) => {
            try {
                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                if (!res.ok) return null;

                const data = await res.json();

                // Basic validation that it looks like a project
                if (!data.id || !data.projectName) return null;

                // Recursive date parser similar to store
                const recursiveDateParse = (obj: any): any => {
                    if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(obj)) {
                        return new Date(obj);
                    }
                    if (Array.isArray(obj)) return obj.map(recursiveDateParse);
                    if (typeof obj === 'object' && obj !== null) {
                        const result: any = {};
                        for (const key in obj) result[key] = recursiveDateParse(obj[key]);
                        return result;
                    }
                    return obj;
                };

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
