'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useStaffMasterStore } from '@/store/staffMasterStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useProjectRegistryStore } from '@/store/projectRegistryStore';
import { useDocumentStore } from '@/store/documentStore';

/**
 * ログイン後にSupabaseからマスターデータを一括ロードするhook。
 * Google Driveへの依存を廃止し、Supabase APIルート経由でデータを取得する。
 */
export function useMasterDataSync() {
    const { status } = useSession();
    const hasLoadedRef = useRef(false);

    const { loadFromServer: loadEquipment } = useEquipmentStore();
    const { loadFromServer: loadStaff } = useStaffMasterStore();
    const { loadFromServer: loadSettings } = useSettingsStore();
    const { loadFromServer: loadProjects } = useProjectRegistryStore();
    const { loadFromServer: loadDocuments } = useDocumentStore();

    useEffect(() => {
        if (status !== 'authenticated' || hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        const load = async () => {
            try {
                await Promise.all([
                    loadEquipment(),
                    loadStaff(),
                    loadSettings(),
                    loadProjects(),
                    loadDocuments(),
                ]);
                toast.success('データを読み込みました', { duration: 2000 });
            } catch (e) {
                console.error('[MasterDataSync] Load failed', e);
            }
        };

        load();
    }, [status]);
}
