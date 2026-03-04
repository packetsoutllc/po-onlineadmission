
import React, { useState, useEffect, useMemo } from 'react';
import { Student } from './StudentDetails';
import { FormField, Input, Select } from './FormControls';
import CapacityDisplay from './CapacityDisplay';
import { getHouseColor, initialHouses, House } from './admin/shared/houseData';
import { getHouseCounts } from './admin/shared/houseAllocationService';
import { AdminStudent } from './admin/pages/StudentsPage';

interface HouseAllocationFormProps {
    student: Student;
    showToast: (message: string, type?: 'info' | 'error') => void;
    isSubmitted: boolean;
    houseAssignmentMethod: 'automatic' | 'student_choice' | 'manual';
    studentHouseChoice: string;
    setStudentHouseChoice: (value: string) => void;
    allStudents?: AdminStudent[];
    assignedHouse: string;
}

const HouseAllocationForm: React.FC<HouseAllocationFormProps> = ({ 
    student, 
    isSubmitted, 
    allStudents, 
    assignedHouse, 
    houseAssignmentMethod, 
    studentHouseChoice, 
    setStudentHouseChoice 
}) => {

    const [capacityInfo, setCapacityInfo] = useState<{ capacity: number; current: number } | null>(null);

    // Determine the effective house name to display stats for
    const displayHouseName = assignedHouse || (houseAssignmentMethod === 'student_choice' ? studentHouseChoice : '');

    useEffect(() => {
        if (displayHouseName) {
            const houseDetails = initialHouses.find(h => h.name === displayHouseName);
            if (houseDetails) {
                let currentCount = 0;
                if (allStudents) {
                    currentCount = allStudents.filter(s => s.houseId === houseDetails.id && (s.status === 'Admitted' || s.status === 'Placed')).length;
                } else {
                    // FIX: Pass schoolId and admissionId to getHouseCounts as required by its definition.
                    const allCounts = getHouseCounts(student.schoolId, student.admissionId);
                    currentCount = allCounts[displayHouseName] || 0;
                }
                setCapacityInfo({
                    current: currentCount,
                    capacity: houseDetails.capacity
                });
            } else {
                setCapacityInfo(null);
            }
        } else {
            setCapacityInfo(null);
        }
    }, [displayHouseName, allStudents, student.schoolId, student.admissionId]);

    const assignedHouseObject = useMemo(() => {
        if (!displayHouseName) return undefined;
        const houseDetails = initialHouses.find(h => h.name === displayHouseName);
        if (houseDetails) {
            return {
                ...houseDetails,
                studentCount: capacityInfo?.current ?? 0,
            };
        }
        return undefined;
    }, [displayHouseName, capacityInfo]);

    const houseColors = getHouseColor(assignedHouseObject);

    // Filter available houses for Student Choice
    const availableHouses = useMemo(() => {
        if (houseAssignmentMethod !== 'student_choice') return [];
        return initialHouses.filter(h => {
            // Match gender (or mixed)
            const genderMatch = h.gender === student.gender || h.gender === 'Mixed';
            // Check capacity
            const currentCount = allStudents 
                ? allStudents.filter(s => s.houseId === h.id && (s.status === 'Admitted' || s.status === 'Placed')).length
                // FIX: Pass schoolId and admissionId to getHouseCounts as required by its definition.
                : (getHouseCounts(student.schoolId, student.admissionId)[h.name] || 0);
            
            const hasSpace = currentCount < h.capacity;
            
            return genderMatch && hasSpace;
        });
    }, [houseAssignmentMethod, student.gender, student.schoolId, student.admissionId, allStudents]);

    // --- RENDER LOGIC ---

    return (
        <>
            <h3 className="text-lg font-semibold text-black dark:text-gray-100 mb-4">House Allocation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                {houseAssignmentMethod === 'manual' && !assignedHouse ? (
                    <FormField label="Assigned House" className="md:col-span-2">
                        <Input 
                            type="text" 
                            value="Pending Allocation" 
                            disabled 
                            className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700/50"
                        />
                        <p className="text-xs text-gray-500 mt-1">House will be assigned to student upon reporting to school.</p>
                    </FormField>
                ) : houseAssignmentMethod === 'student_choice' && !isSubmitted && !assignedHouse ? (
                    <FormField label="Select Your Preferred House" className={!displayHouseName ? 'md:col-span-2' : ''}>
                        <Select 
                            value={studentHouseChoice} 
                            onChange={(e) => setStudentHouseChoice(e.target.value)}
                        >
                            <option value="">-- Choose a House --</option>
                            {availableHouses.map(h => (
                                <option key={h.id} value={h.name}>{h.name}</option>
                            ))}
                        </Select>
                    </FormField>
                ) : (
                    // Automatic or Already Assigned or View Only
                    <FormField label="Assigned House" className={!displayHouseName ? 'md:col-span-2' : ''}>
                        <Input type="text" value={assignedHouse || 'Allocation Pending'} disabled />
                        {houseAssignmentMethod === 'automatic' && !assignedHouse && (
                            <p className="text-xs text-gray-500 mt-1">House will be assigned upon submission.</p>
                        )}
                        {houseAssignmentMethod === 'student_choice' && !assignedHouse && isSubmitted && (
                            <p className="text-xs text-gray-500 mt-1">Your house preference has been submitted and is awaiting final assignment.</p>
                        )}
                    </FormField>
                )}

                {displayHouseName && (
                    <CapacityDisplay 
                        label="House Capacity" 
                        info={capacityInfo} 
                        barColorClass={houseColors.bar}
                        textColorClass={houseColors.text}
                        bgColorClass={houseColors.bg}
                    />
                )}
            </div>
        </>
    );
};

export default React.memo(HouseAllocationForm);
