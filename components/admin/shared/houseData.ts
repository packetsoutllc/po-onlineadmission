// components/admin/shared/houseData.ts

export interface House {
    id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Mixed';
    capacity: number;
    houseMaster: string; // Master / Mistress
    houseMasterContact?: string;
    schoolId: string;
    color?: 'green' | 'blue' | 'red' | 'yellow' | 'navy' | string;
    dateCreated?: string;
}

export const HOUSE_COLORS: Record<string, {
    gradient: string;
    bar: string;
    text: string;
    bg: string;
    pillText: string;
    pillBg: string;
}> = {
    'Ansa-Sasraku House': { gradient: 'from-green-600 to-teal-700', bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40', pillText: 'text-green-700 dark:text-green-300', pillBg: 'bg-green-100 dark:bg-green-500/20' },
    'Apewu House': { gradient: 'from-blue-600 to-indigo-700', bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40', pillText: 'text-blue-700 dark:text-blue-300', pillBg: 'bg-blue-100 dark:bg-blue-500/20' },
    'Asorgoe House': { gradient: 'from-orange-500 to-amber-600', bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40', pillText: 'text-orange-700 dark:text-orange-300', pillBg: 'bg-orange-100 dark:bg-orange-500/20' },
    'Bonsu House': { gradient: 'from-blue-800 to-blue-900', bar: 'bg-blue-800', text: 'text-blue-800 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', pillText: 'text-blue-800 dark:text-blue-300', pillBg: 'bg-blue-100 dark:bg-blue-800/20' },
    'Dickson House': { gradient: 'from-pink-500 to-rose-600', bar: 'bg-pink-500', text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/40', pillText: 'text-pink-700 dark:text-pink-300', pillBg: 'bg-pink-100 dark:bg-pink-500/20' },
    'Freeman House': { gradient: 'from-yellow-400 to-amber-500', bar: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40', pillText: 'text-yellow-700 dark:text-yellow-300', pillBg: 'bg-yellow-100 dark:bg-yellow-500/20' },
    'Gati House': { gradient: 'from-cyan-500 to-sky-600', bar: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/40', pillText: 'text-cyan-700 dark:text-cyan-300', pillBg: 'bg-cyan-100 dark:bg-cyan-500/20' },
    'Kudadjie House': { gradient: 'from-red-600 to-rose-700', bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', pillText: 'text-red-700 dark:text-red-300', pillBg: 'bg-red-100 dark:bg-red-500/20' },
};

const COLOR_THEME_MAP: Record<string, keyof typeof HOUSE_COLORS> = {
    green: 'Ansa-Sasraku House',
    blue: 'Apewu House',
    red: 'Dickson House',
    yellow: 'Freeman House',
    navy: 'Bonsu House',
};

export const initialHouses: Omit<House, 'studentCount'>[] = [
    { id: 'h1', name: 'Ansa-Sasraku House', gender: 'Male', capacity: 120, houseMaster: 'Mr. Alex Tetteh', houseMasterContact: '0244123456', schoolId: 's1', color: 'green', dateCreated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h2', name: 'Dickson House', gender: 'Female', capacity: 150, houseMaster: 'Mrs. Esther Williams', houseMasterContact: '0244234567', schoolId: 's1', color: 'red', dateCreated: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h3', name: 'Apewu House', gender: 'Male', capacity: 120, houseMaster: 'Mr. Benjamin Arthur', houseMasterContact: '0244345678', schoolId: 's1', color: 'blue', dateCreated: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h4', name: 'Freeman House', gender: 'Female', capacity: 150, houseMaster: 'Ms. Cynthia Lamptey', houseMasterContact: '0244456789', schoolId: 's1', color: 'yellow', dateCreated: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h5', name: 'Asorgoe House', gender: 'Male', capacity: 120, houseMaster: 'Mr. Richard Quaye', houseMasterContact: '0244567890', schoolId: 's1', color: '#f97316', dateCreated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h6', name: 'Gati House', gender: 'Female', capacity: 150, houseMaster: 'Mrs. Patience Osei', houseMasterContact: '0244678901', schoolId: 's1', dateCreated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h7', name: 'Bonsu House', gender: 'Male', capacity: 120, houseMaster: 'Mr. David Bonsu', houseMasterContact: '0244789012', schoolId: 's1', color: 'navy', dateCreated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h8', name: 'Kudadjie House', gender: 'Female', capacity: 150, houseMaster: 'Ms. Rose Kudadjie', houseMasterContact: '0244890123', schoolId: 's1', dateCreated: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'h9', name: 'House of Courage', gender: 'Male', capacity: 100, houseMaster: 'Mr. Smith', houseMasterContact: '0201234567', schoolId: 's3' },
    { id: 'h10', name: 'House of Wisdom', gender: 'Female', capacity: 100, houseMaster: 'Ms. Jones', houseMasterContact: '0202345678', schoolId: 's3' },
];

export const MALE_HOUSES = initialHouses.filter(h => h.gender === 'Male').map(h => h.name);
export const FEMALE_HOUSES = initialHouses.filter(h => h.gender === 'Female').map(h => h.name);

export const getHouseColor = (house: (House & { studentCount: number; }) | undefined) => {
    if (house?.color && COLOR_THEME_MAP[house.color]) return HOUSE_COLORS[COLOR_THEME_MAP[house.color]];
    if (house?.color && house.color.startsWith('#')) {
        const customColor = house.color;
        return {
            gradient: `from-[${customColor}] to-[${customColor}]`,
            bar: `bg-[${customColor}]`,
            text: `text-[${customColor}]`,
            bg: 'bg-gray-100 dark:bg-gray-900/40',
            pillText: `text-[${customColor}]`,
            pillBg: 'bg-gray-100 dark:bg-gray-500/20',
        };
    }
    if (house?.name && HOUSE_COLORS[house.name]) return HOUSE_COLORS[house.name];
    return { gradient: 'from-gray-600 to-gray-700', bar: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/40', pillText: 'text-gray-700 dark:text-gray-300', pillBg: 'bg-gray-100 dark:bg-gray-500/20' };
};