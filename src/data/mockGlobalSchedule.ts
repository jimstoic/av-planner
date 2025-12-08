export interface GlobalProject {
    id: string;
    projectName: string;
    startDate: Date;
    endDate: Date;
    equipmentUsage: Record<string, number>; // equipmentId: count
    venue: string;
}

// Mock other projects happening in the world
export const mockGlobalSchedule: GlobalProject[] = [
    {
        id: 'gp-1',
        projectName: 'Corporate Seminar 2024',
        startDate: new Date('2025-12-06'),
        endDate: new Date('2025-12-09'),
        venue: 'Grand Hotel',
        equipmentUsage: {
            'cam-sony-fx6': 2, // Sony FX6 x2 (Total 3)
            'sw-atem-mini-pro': 1, // ATEM Mini Pro x1 (Total 5)
        }
    },
    {
        id: 'gp-2',
        projectName: 'Music Festival Live',
        startDate: new Date('2025-12-08'),
        endDate: new Date('2025-12-12'),
        venue: 'Outdoor Park',
        equipmentUsage: {
            'cam-sony-fx6': 2, // Sony FX6 x2
        }
    }
];

// Mock Global Inventory Limits (Total Stock)
export const mockInventoryLimits: Record<string, number> = {
    'cam-sony-fx6': 3, // Total 3
    'sw-atem-mini-pro': 5, // Total 5
    'mic-shure-sm58': 20, // Total 20
};
