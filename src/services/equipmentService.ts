import { driveService } from "./driveService";
import { Equipment } from "@/types/equipment";

const EQUIPMENT_FILE_NAME = "equipment-master.json";

export const equipmentService = {
    /**
     * Fetch the master equipment list from the shared drive
     */
    async fetchMasterEquipmentList(accessToken: string): Promise<Equipment[]> {
        const files = await driveService.searchFiles(accessToken, `name = '${EQUIPMENT_FILE_NAME}' and trashed = false`);

        if (files.files && files.files.length > 0) {
            // Found the master file, download it
            const fileId = files.files[0].id;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            if (!res.ok) throw new Error("Failed to download equipment master");

            const data = await res.json();
            return data.equipment || [];
        }

        return [];
    },

    /**
     * Save the master equipment list (creates or overwrites)
     */
    async saveMasterEquipmentList(accessToken: string, equipment: Equipment[]) {
        // 1. Check if it exists
        const files = await driveService.searchFiles(accessToken, `name = '${EQUIPMENT_FILE_NAME}' and trashed = false`);

        let fileId = null;
        if (files.files && files.files.length > 0) {
            fileId = files.files[0].id;
        }

        // 2. Save
        const content = { equipment, updatedAt: new Date().toISOString() };
        await driveService.saveFile(accessToken, EQUIPMENT_FILE_NAME, content, undefined, fileId || undefined);
    }
};
