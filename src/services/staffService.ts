import { driveService } from "./driveService";
import { Staff } from "@/store/projectStore";

const STAFF_FILE_NAME = "staff-master.json";

export const staffService = {
    /**
     * Fetch the master staff list from the shared drive
     */
    async fetchMasterStaffList(accessToken: string): Promise<Staff[]> {
        const files = await driveService.searchFiles(accessToken, `name = '${STAFF_FILE_NAME}' and trashed = false`);

        if (files.files && files.files.length > 0) {
            // Found the master file, download it
            const fileId = files.files[0].id;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!res.ok) throw new Error("Failed to download staff master");
            
            const data = await res.json();
            return data.staff || [];
        }

        return [];
    },

    /**
     * Save the master staff list (creates or overwrites)
     */
    async saveMasterStaffList(accessToken: string, staff: Staff[]) {
        // 1. Check if it exists
        const files = await driveService.searchFiles(accessToken, `name = '${STAFF_FILE_NAME}' and trashed = false`);
        
        let fileId = null;
        if (files.files && files.files.length > 0) {
            fileId = files.files[0].id;
        }

        // 2. Save
        const content = { staff, updatedAt: new Date().toISOString() };
        await driveService.saveFile(accessToken, STAFF_FILE_NAME, content, undefined, fileId || undefined);
    }
};
