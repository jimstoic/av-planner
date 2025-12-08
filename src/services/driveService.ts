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
            throw new Error(`Drive API Error: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Create or Update a file (Simple upload for JSON)
     */
    async saveFile(accessToken: string, name: string, content: object, parentId?: string, fileId?: string) {
        const metadata = {
            name,
            mimeType: 'application/json',
            parents: parentId ? [parentId] : undefined,
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';
        let method = 'POST';

        if (fileId) {
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&supportsAllDrives=true`;
            method = 'PATCH';
        }

        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: form,
        });

        if (!res.ok) {
            throw new Error(`Drive Upload Error: ${res.statusText}`);
        }

        return res.json();
    }
};
