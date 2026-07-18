import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useTranslation } from 'react-i18next';
import { usePetBubbleStore } from './usePetBubbleStore';

export interface IStorageRecord {
    originalPath: string;
    storedPath: string;
    fileName: string;
}

export interface IStorageResult {
    success: number;
    skipped: number;
    failed: number;
    total: number;
    storageFolder: string;
}

export interface IPendingFilesResult {
    total: number;
    files: string[];
    storageFolder: string;
}

export function useDesktopStorage() {
    const { t } = useTranslation();
    const { addBubble } = usePetBubbleStore();

    const showStorageSelect = useCallback((petId: string) => {
        addBubble({
            type: 'select',
            petId,
            content: t('desktopStorage:Want to tidy up?'),
            buttons: [
                {
                    label: t('desktopStorage:Slow tidy'),
                    type: 'secondary',
                    onClick: () => {
                        startSlowTidy(petId);
                    },
                },
                {
                    label: t('desktopStorage:Quick tidy'),
                    type: 'primary',
                    onClick: () => {
                        startQuickTidy(petId);
                    },
                },
            ],
        });
    }, [t, addBubble]);

    const startQuickTidy = useCallback(async (petId: string) => {
        addBubble({
            type: 'tip',
            petId,
            content: t('desktopStorage:Quick tidy in progress...'),
            duration: 0,
        });

        try {
            const result = await invoke<IStorageResult>('quick_tidy_desktop');
            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Quick tidy done', {
                    success: result.success,
                    failed: result.failed,
                    total: result.total,
                }),
                duration: 4000,
            });
        } catch (err: any) {
            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Tidy failed', { error: err }),
                duration: 4000,
            });
        }
    }, [t, addBubble]);

    const startSlowTidy = useCallback(async (petId: string) => {
        try {
            const pending = await invoke<IPendingFilesResult>('get_pending_tidy_files');

            if (pending.total === 0) {
                addBubble({
                    type: 'tip',
                    petId,
                    content: t('desktopStorage:Nothing to tidy'),
                    duration: 3000,
                });
                return;
            }

            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Start slow tidy', { total: pending.total }),
                duration: 1500,
            });

            const records: IStorageRecord[] = [];
            let successCount = 0;
            let failedCount = 0;

            for (let i = 0; i < pending.files.length; i++) {
                const file = pending.files[i];
                try {
                    const record = await invoke<IStorageRecord>('move_single_file_to_storage', {
                        filePath: file,
                    });
                    records.push(record);
                    successCount++;

                    if (i % 3 === 0 || i === pending.files.length - 1) {
                        addBubble({
                            type: 'tip',
                            petId,
                            content: t('desktopStorage:Slow tidy progress', {
                                current: i + 1,
                                total: pending.total,
                            }),
                            duration: 0,
                        });
                    }
                } catch (e) {
                    failedCount++;
                }
            }

            if (records.length > 0) {
                await invoke('save_storage_history', { records });
            }

            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Slow tidy done', {
                    success: successCount,
                    failed: failedCount,
                    total: pending.total,
                }),
                duration: 4000,
            });
        } catch (err: any) {
            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Tidy failed', { error: err }),
                duration: 4000,
            });
        }
    }, [t, addBubble]);

    const undoLastStorage = useCallback(async (petId: string) => {
        try {
            const hasHistory = await invoke<boolean>('has_storage_history');

            if (!hasHistory) {
                addBubble({
                    type: 'tip',
                    petId,
                    content: t('desktopStorage:No undo history'),
                    duration: 3000,
                });
                return;
            }

            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Undo in progress...'),
                duration: 0,
            });

            const result = await invoke<IStorageResult>('undo_last_storage');

            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Undo done', {
                    success: result.success,
                    failed: result.failed,
                    total: result.total,
                }),
                duration: 4000,
            });
        } catch (err: any) {
            addBubble({
                type: 'tip',
                petId,
                content: t('desktopStorage:Undo failed', { error: err }),
                duration: 4000,
            });
        }
    }, [t, addBubble]);

    return {
        showStorageSelect,
        startQuickTidy,
        startSlowTidy,
        undoLastStorage,
    };
}
