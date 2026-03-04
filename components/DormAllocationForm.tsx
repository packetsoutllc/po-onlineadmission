
import React, { useMemo } from 'react';
import { FormField, Input, Select } from './FormControls';
import { initialDormitories } from './admin/shared/dormitoryData';
import { initialHouses } from './admin/shared/houseData';

interface DormAllocationFormProps {
    isSubmitted: boolean;
    dormAssignmentMethod: 'automatic' | 'student_choice' | 'manual';
    enableRoomManagement: boolean;
    studentHouseChoice: string;
    studentDormChoice: string;
    setStudentDormChoice: (value: string) => void;
    allStudents?: any[]; 
    assignedDorm: string;
    assignedHouse: string;
}

const DormAllocationForm: React.FC<DormAllocationFormProps> = ({ 
    isSubmitted,
    dormAssignmentMethod,
    enableRoomManagement,
    studentHouseChoice,
    studentDormChoice,
    setStudentDormChoice,
    allStudents,
    assignedDorm,
    assignedHouse
}) => {
    if (!enableRoomManagement) return null;

    // Determine effective House Name to filter dorms
    const effectiveHouseName = assignedHouse || studentHouseChoice;
    
    const availableDorms = useMemo(() => {
        if (dormAssignmentMethod !== 'student_choice' || !effectiveHouseName) return [];
        
        const houseId = initialHouses.find(h => h.name === effectiveHouseName)?.id;
        if (!houseId) return [];

        return initialDormitories.filter(d => {
            if (d.houseId !== houseId) return false;
            
            const currentCount = allStudents 
                ? allStudents.filter(s => s.dormitoryId === d.id).length
                : 0;
            
            return currentCount < d.capacity;
        });
    }, [dormAssignmentMethod, effectiveHouseName, allStudents]);

    // Determine current student count for the selected/assigned dorm for display
    const currentDormInfo = useMemo(() => {
        const displayDormName = assignedDorm || (dormAssignmentMethod === 'student_choice' ? studentDormChoice : '');
        if (!displayDormName) return null;
        
        const dorm = initialDormitories.find(d => d.name === displayDormName);
        if (!dorm) return null;

        const currentCount = allStudents 
            ? allStudents.filter(s => s.dormitoryId === dorm.id).length
            : 0;
            
        return { name: dorm.name, current: currentCount, capacity: dorm.capacity };
    }, [assignedDorm, studentDormChoice, allStudents, dormAssignmentMethod]);


    return (
        <>
            <h3 className="text-lg font-semibold text-logip-text-header dark:text-gray-100 mb-4">Dorm/Room Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                {dormAssignmentMethod === 'manual' && !assignedDorm ? (
                    <FormField label="Assigned Dorm/Room" className="md:col-span-2">
                        <Input 
                            type="text" 
                            value="Pending Allocation" 
                            disabled 
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700/50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Room will be assigned to student upon reporting to school.</p>
                    </FormField>
                ) : dormAssignmentMethod === 'student_choice' && !isSubmitted && !assignedDorm ? (
                    <FormField label="Select Your Preferred Room" className={!currentDormInfo ? 'md:col-span-2' : ''}>
                        <Select 
                            value={studentDormChoice} 
                            onChange={(e) => setStudentDormChoice(e.target.value)}
                            disabled={!effectiveHouseName}
                        >
                            <option value="">{effectiveHouseName ? '-- Choose a Room --' : 'Select a House First'}</option>
                            {availableDorms.map(d => (
                                <option key={d.id} value={d.name}>{d.name} (Capacity: {d.capacity})</option>
                            ))}
                        </Select>
                    </FormField>
                ) : (
                    // Automatic or Already Assigned
                    <FormField label="Assigned Dorm/Room" className={!currentDormInfo ? 'md:col-span-2' : ''}>
                        <Input type="text" value={assignedDorm || 'Allocation Pending'} disabled />
                        {dormAssignmentMethod === 'automatic' && !assignedDorm && (
                            <p className="text-xs text-gray-500 mt-1">Dorm/Room will be assigned upon submission.</p>
                        )}
                        {dormAssignmentMethod === 'student_choice' && !assignedDorm && isSubmitted && (
                             <p className="text-xs text-gray-500 mt-1">Your room preference has been submitted and is awaiting final assignment.</p>
                        )}
                    </FormField>
                )}
                
                {currentDormInfo && (
                    <div className="pb-1">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Room Occupancy</span>
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{currentDormInfo.current} / {currentDormInfo.capacity}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                                className="bg-sky-500 h-2.5 rounded-full" 
                                style={{ width: `${Math.min((currentDormInfo.current / currentDormInfo.capacity) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default React.memo(DormAllocationForm);
