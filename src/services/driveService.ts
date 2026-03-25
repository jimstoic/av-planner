export class DriveAuthError extends Error {
    constructor() {
        super('Drive認証エラー: セッションが期限切れです。再ログインしてください。');
        this.name = 'DriveAuthError';
    }
}

export const driveService = {
    /**
     * Search for files/folders in Drive
     */
    async searchFiles(accessToken: string, query: string = "") {
        const teamFolderId = process.env.NEXT_PUBLIC_TEAM_FOLDER_ID;
        let q = query || "mimeType = 'application/json' and trashed = false";

        // If Team Folder is defined, restrict search to that folder
        if (teamFolderId) {
            q = `('${teamFolderId}' in parents) and ${q}`;
        } else {
            q = `mimeType = 'application/json' and trashed = false`; // Fallback to broad search if no folder
        }

        // supportsAllDrives=true is crucial for Shared Drives
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id, name, mimeType, parents)`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!res.ok) {
            if (res.status === 401) throw new DriveAuthError();
            throw new Error(`Drive API Error: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Fetch file content with retry logic
     */
    async getFileContent(accessToken: string, fileId: string, retries: number = 2) {
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;

        for (let i = 0; i <= retries; i++) {
            try {
                const res = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!res.ok) {
                    if (res.status === 401) throw new DriveAuthError();
                    if (res.status === 403 || res.status === 429 || res.status >= 500) {
                        if (i < retries) {
                            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
                            continue;
                        }
                    }
                    throw new Error(`Drive API Error: ${res.status} ${res.statusText}`);
                }

                return await res.json();
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
    },

    /**
     * Create or Update a file (Simple upload for JSON)
     */
    async saveFile(accessToken: string, name: string, content: object, parentId?: string, fileId?: string) {
        // Enforce Team Folder if set
        const targetParentId = parentId || process.env.NEXT_PUBLIC_TEAM_FOLDER_ID;

        const doSave = async (withParent: boolean) => {
            const metadata: any = { name, mimeType: 'application/json' };
            if (withParent && targetParentId && !fileId) {
                metadata.parents = [targetParentId];
            }

            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));

            let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&includeItemsFromAllDrives=true';
            let method = 'POST';

            if (fileId) {
                url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&supportsAllDrives=true&includeItemsFromAllDrives=true`;
                method = 'PATCH';
            }

            return fetch(url, {
                method,
                headers: { Authorization: `Bearer ${accessToken}` },
                body: form,
            });
        };

        let res = await doSave(true);

        // 403 insufficientParentPermissions: retry without specifying a parent folder
        if (res.status === 403 && !fileId) {
            const errBody = await res.json().catch(() => ({}));
            const reason = errBody?.error?.errors?.[0]?.reason;
            if (reason === 'insufficientParentPermissions') {
                res = await doSave(false);
            }
        }

        if (!res.ok) {
            if (res.status === 401) throw new DriveAuthError();
            const err = await res.text();
            throw new Error(`Drive Upload Error: ${res.statusText} - ${err}`);
        }

        return res.json();
    }
};
