'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { masterDataService, MasterData } from '@/services/masterDataService';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useStaffMasterStore } from '@/store/staffMasterStore';
import { useSettingsStore } from '@/store/settingsStore';

const SAVE_DEBOUNCE_MS = 2500;

export function useMasterDataSync() {
    const { data: session, status } = useSession();

    const masterFileIdRef = useRef<string | null>(null);
    const hasLoadedRef = useRef(false);
    const justLoadedRef = useRef(false);
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const { equipment, setEquipment } = useEquipmentStore();
    const { masterStaff, setMasterStaff } = useStaffMasterStore();
    const { companyInfo, taxRate, currency, updateSettings } = useSettingsStore();

    // -------------------------------------------------------
    // Load master data from Drive on first authentication
    // -------------------------------------------------------
    useEffect(() => {
        if (status !== 'authenticated' || !session?.accessToken || hasLoadedRef.current) return;
        hasLoadedRef.current = true;

        const load = async () => {
            try {
                const result = await masterDataService.load(session.accessToken!);
                if (!result) return; // No master file yet — first user, local data stays

                masterFileIdRef.current = result.fileId;
                const d = result.data;

                // Prevent the change-triggered save from firing right after load
                justLoadedRef.current = true;

                if (Array.isArray(d.equipment) && d.equipment.length > 0) setEquipment(d.equipment);
                if (Array.isArray(d.masterStaff) && d.masterStaff.length > 0) setMasterStaff(d.masterStaff);
                updateSettings({
                    ...(d.companyInfo ? { companyInfo: d.companyInfo } : {}),
                    ...(typeof d.taxRate === 'number' ? { taxRate: d.taxRate } : {}),
                    ...(d.currency ? { currency: d.currency } : {}),
                });

                toast.success('マスターデータをDriveから読み込みました', { duration: 3000 });

                // Allow saves again after a short grace period
                setTimeout(() => { justLoadedRef.current = false; }, 3000);
            } catch (e: any) {
                console.error('[MasterDataSync] Load failed', e);
                // Non-fatal — fall back to local data silently
            }
        };

        load();
    }, [status, session?.accessToken]);

    // -------------------------------------------------------
    // Debounced save to Drive when master data changes
    // -------------------------------------------------------
    const scheduleSave = useCallback(() => {
        if (!session?.accessToken || !hasLoadedRef.current || justLoadedRef.current) return;

        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(async () => {
            const masterData: MasterData = {
                version: 1,
                equipment,
                masterStaff,
                companyInfo,
                taxRate,
                currency,
            };
            try {
                const newFileId = await masterDataService.save(
                    session.accessToken!,
                    masterData,
                    masterFileIdRef.current
                );
                masterFileIdRef.current = newFileId;
            } catch (e) {
                console.error('[MasterDataSync] Save failed', e);
                toast.error('マスターデータの保存に失敗しました', { duration: 5000 });
            }
        }, SAVE_DEBOUNCE_MS);
    }, [session?.accessToken, equipment, masterStaff, companyInfo, taxRate, currency]);

    useEffect(() => {
        scheduleSave();
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [scheduleSave]);
}
