import { MALE_HOUSES, FEMALE_HOUSES, initialHouses } from './houseData';
import { AdminStudent } from '../pages/StudentsPage';
import { Dormitory } from './dormitoryData';

/**
 * Gets real-time counts from the student list in localStorage.
 * Isolated to specific school and admission context.
 */
export const getHouseCounts = (schoolId: string, admissionId: string): Record<string, number> => {
    try {
        const studentsRaw = localStorage.getItem('admin_students');
        if (!studentsRaw) return {};
        
        const allStudents: AdminStudent[] = JSON.parse(studentsRaw);
        const counts: Record<string, number> = {};

        // Only look at houses belonging to this school
        const schoolHouses = initialHouses.filter(h => h.schoolId === schoolId);

        // Initialize relevant houses with 0
        schoolHouses.forEach(h => {
            counts[h.name] = 0;
        });

        allStudents.forEach(s => {
            // Strict filtering by school AND admission type
            const isTargetContext = s.schoolId === schoolId && s.admissionId === admissionId;
            
            if (isTargetContext && (s.status === 'Admitted' || s.status === 'Placed') && s.houseId) {
                const house = schoolHouses.find(h => h.id === s.houseId);
                if (house) {
                    counts[house.name] = (counts[house.name] || 0) + 1;
                }
            }
        });
        return counts;
    } catch {
        return {};
    }
};

const getLastAssignedIndices = (schoolId: string, admissionId: string): { male: number; female: number } => {
    try {
        const key = `lastAssignedHouseIndices_${schoolId}_${admissionId}`;
        const storedIndices = localStorage.getItem(key);
        return storedIndices ? JSON.parse(storedIndices) : { male: 0, female: 0 };
    } catch {
        return { male: 0, female: 0 };
    }
};

const saveLastAssignedIndices = (schoolId: string, admissionId: string, indices: { male: number; female: number }) => {
    const key = `lastAssignedHouseIndices_${schoolId}_${admissionId}`;
    localStorage.setItem(key, JSON.stringify(indices));
};

/**
 * Balanced House Allocation:
 * Strictly scoped to the current school and admission group.
 */
export const allocateHouseForStudent = (gender: 'Male' | 'Female', schoolId: string, admissionId: string): string => {
    // Only consider houses for the specific school
    const schoolHouses = initialHouses.filter(h => h.schoolId === schoolId);
    const genderHouseNames = schoolHouses
        .filter(h => h.gender === gender || h.gender === 'Mixed')
        .map(h => h.name);

    if (genderHouseNames.length === 0) return 'Unassigned';

    const allCounts = getHouseCounts(schoolId, admissionId);
    
    const candidates = genderHouseNames.map(name => ({
        name,
        count: allCounts[name] || 0
    }));

    const minOccupancy = Math.min(...candidates.map(c => c.count));
    const housesAtMin = candidates.filter(c => c.count === minOccupancy);

    if (housesAtMin.length === 1) {
        return housesAtMin[0].name;
    }

    const indices = getLastAssignedIndices(schoolId, admissionId);
    const genderKey = gender.toLowerCase() as 'male' | 'female';
    
    let nextIdx = indices[genderKey] % housesAtMin.length;
    const assignedName = housesAtMin[nextIdx].name;

    indices[genderKey] = (nextIdx + 1) % housesAtMin.length;
    saveLastAssignedIndices(schoolId, admissionId, indices);

    return assignedName;
};

/**
 * Balanced Dorm Allocation:
 * Works within a specific house context for the current student list.
 */
export const allocateDormForStudent = (
    houseId: string,
    allStudents: AdminStudent[],
    allDorms: Dormitory[]
): string | null => {
    const dormsInHouse = allDorms.filter(d => d.houseId === houseId);
    if (dormsInHouse.length === 0) return null;

    // The provided allStudents list is usually already filtered by context in the calling component
    const dormsWithCounts = dormsInHouse.map(dorm => {
        const currentCount = allStudents.filter(s => 
            s.dormitoryId === dorm.id && 
            (s.status === 'Admitted' || s.status === 'Placed')
        ).length;
        return { ...dorm, currentCount };
    });

    const availableDorms = dormsWithCounts.filter(d => d.currentCount < d.capacity);
    if (availableDorms.length === 0) return null;

    const minCount = Math.min(...availableDorms.map(d => d.currentCount));
    const tiedDorms = availableDorms.filter(d => d.currentCount === minCount);

    return tiedDorms[0].id;
};

export const updateHouseCountOnManualChange = () => {
    // Redundant helper
};