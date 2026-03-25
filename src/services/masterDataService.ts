import { driveService } from './driveService';
import { Equipment } from '@/types/equipment';
import { StaffMaster } from '@/store/staffMasterStore';
import { CompanyInfo } from '@/types/document';

export const MASTER_FILE_NAME = '_master-data.json';

export interface MasterData {
    version: number;
    equipment: Equipment[];
    masterStaff: StaffMaster[];
    companyInfo: CompanyInfo;
    taxRate: number;
    currency: string;
}

export const masterDataService = {
    async findFileId(accessToken: string): Promise<string | null> {
        const query = `name = '${MASTER_FILE_NAME}' and mimeType = 'application/json' and trashed = false`;
        const data = await driveService.searchFiles(accessToken, query);
        return data.files?.[0]?.id ?? null;
    },

    async load(accessToken: string): Promise<{ data: MasterData; fileId: string } | null> {
        const fileId = await this.findFileId(accessToken);
        if (!fileId) return null;
        const data = await driveService.getFileContent(accessToken, fileId);
        return { data, fileId };
    },

    async save(
        accessToken: string,
        masterData: MasterData,
        fileId?: string | null
    ): Promise<string> {
        const result = await driveService.saveFile(
            accessToken,
            MASTER_FILE_NAME,
            masterData,
            undefined,
            fileId ?? undefined
        );
        return result.id;
    },
};
