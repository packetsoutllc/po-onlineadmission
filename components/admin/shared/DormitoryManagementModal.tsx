import React, { useState, useMemo, useEffect } from 'react';
import AdminModal from './AdminModal';
import { House } from './houseData';
import { Dormitory } from './dormitoryData';
import { AdminStudent } from '../pages/StudentsPage';
import { AdminInput } from './forms';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from './ToastContext';
import PaginationControls from './PaginationControls';

interface DormitoryManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    house: House;
    allStudents: AdminStudent[];
    dormitories: Dormitory[];
    setDormitories: React.Dispatch<React.SetStateAction<Dormitory[]>>;
    permissions: Set<string>;
    isSuperAdmin: boolean;
}

const DormitoryManagementModal: React.FC<DormitoryManagementModalProps> = ({ isOpen, onClose, house, allStudents, dormitories, setDormitories, permissions, isSuperAdmin }) => {
    const { showToast } = useToast();
    const [newDormName, setNewDormName] = useState('');
    const [newDormCapacity, setNewDormCapacity] = useState(4);
    const [dormToDelete, setDormToDelete] = useState<Dormitory | null>(null);
    const [dormToEdit, setDormToEdit] = useState<Dormitory | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const canEdit = isSuperAdmin || permissions.has('icon:house:edit');

    useEffect(() => {
        if (dormToEdit) {
            setNewDormName(dormToEdit.name);
            setNewDormCapacity(dormToEdit.capacity);
        } else {
            setNewDormName('');
            setNewDormCapacity(4);
        }
    }, [dormToEdit]);

    const houseDormitories = useMemo(() => {
        return dormitories
            .filter(d => d.houseId === house.id)
            .map(d => {
                const studentCount = allStudents.filter(s => s.dormitoryId === d.id && (s.status === 'Admitted' || s.status === 'Placed')).length;
                return { ...d, studentCount };
            });
    }, [dormitories, house.id, allStudents]);

    const totalPages = Math.ceil(houseDormitories.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDorms = useMemo(() => houseDormitories.slice(startIndex, startIndex + itemsPerPage), [houseDormitories, startIndex, itemsPerPage]);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, houseDormitories.length);

    // Reset page if needed
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [houseDormitories.length, totalPages, currentPage]);
    
    const handleSaveDormitory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canEdit) return;

        if (!newDormName.trim() || newDormCapacity <= 0) {
            showToast('Please enter a valid name and capacity.', 'error');
            return;
        }

        const currentDormsForHouse = dormitories.filter(d => d.houseId === house.id);
        let newTotalDormCapacity: number;

        if (dormToEdit) {
            const capacityOfOtherDorms = currentDormsForHouse
                .filter(d => d.id !== dormToEdit.id)
                .reduce((sum, d) => sum + d.capacity, 0);
            newTotalDormCapacity = capacityOfOtherDorms + newDormCapacity;
        } else {
            const currentDormsCapacity = currentDormsForHouse.reduce((sum, d) => sum + d.capacity, 0);
            newTotalDormCapacity = currentDormsCapacity + newDormCapacity;
        }

        if (newTotalDormCapacity > house.capacity) {
            showToast(`Total dorm capacity (${newTotalDormCapacity}) cannot exceed house capacity (${house.capacity}).`, 'error');
            return;
        }

        if (dormToEdit) {
            setDormitories(prev => prev.map(d => d.id === dormToEdit.id ? { ...d, name: newDormName.trim(), capacity: newDormCapacity } : d));
            showToast(`Dorm/Room "${newDormName.trim()}" updated.`, 'success');
        } else {
            const newDorm: Dormitory = {
                id: `dorm_${Date.now()}`,
                houseId: house.id,
                name: newDormName.trim(),
                capacity: newDormCapacity,
            };
            setDormitories(prev => [...prev, newDorm]);
            showToast(`Dorm/Room "${newDormName.trim()}" added.`, 'success');
        }
        
        setDormToEdit(null);
    };

    const handleDeleteDormitory = () => {
        if (!dormToDelete || !canEdit) return;

        const studentsInDorm = allStudents.filter(s => s.dormitoryId === dormToDelete.id).length;
        if (studentsInDorm > 0) {
            showToast(`Cannot delete "${dormToDelete.name}" as it contains ${studentsInDorm} student(s).`, 'error');
            // FIX: Corrected typo 'setNotDelete' to 'setDormToDelete'
            setDormToDelete(null);
            return;
        }

        setDormitories(prev => prev.filter(d => d.id !== dormToDelete.id));
        showToast(`Dorm/Room "${dormToDelete.name}" deleted successfully.`, 'success');
        setDormToDelete(null);
    };

    return (
        <>
            <AdminModal isOpen={isOpen} onClose={onClose} title={`Dorms/Rooms for ${house.name}`} size="5xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[450px]">
                    {/* Add/Edit Form Column */}
                    <div className={`p-6 bg-logip-white dark:bg-dark-bg/50 rounded-lg border border-logip-border dark:border-dark-border h-fit ${!canEdit ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h3 className="text-lg font-bold text-logip-text-header dark:text-dark-text-primary mb-4">{dormToEdit ? 'Edit Dorm/Room' : 'Add New Dorm/Room'}</h3>
                        <form onSubmit={handleSaveDormitory} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1">Dorm/Room Name</label>
                                <AdminInput 
                                    value={newDormName}
                                    onChange={e => setNewDormName(e.target.value)}
                                    placeholder="e.g., Room 101, Block A"
                                    required
                                    disabled={!canEdit}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-logip-text-body dark:text-gray-300 mb-1">Capacity</label>
                                <AdminInput 
                                    type="number"
                                    value={newDormCapacity}
                                    onChange={e => setNewDormCapacity(parseInt(e.target.value, 10) || 0)}
                                    min="1"
                                    required
                                    disabled={!canEdit}
                                />
                            </div>
                            <div className="pt-2 flex items-center gap-4">
                                <button type="submit" disabled={!canEdit} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-base bg-logip-primary text-white font-semibold rounded-lg hover:bg-logip-primary-hover transition-colors disabled:opacity-50">
                                    <span className="material-symbols-outlined text-xl">{dormToEdit ? 'save' : 'add'}</span>
                                    {dormToEdit ? 'Save Changes' : 'Add Dormitory'}
                                </button>
                                {dormToEdit && (
                                    <button type="button" onClick={() => setDormToEdit(null)} className="flex-shrink-0 px-4 py-2 text-base border border-logip-border dark:border-dark-border font-semibold rounded-lg text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Existing List Column */}
                    <div className="flex flex-col p-6 bg-logip-white dark:bg-dark-bg/50 rounded-lg border border-logip-border dark:border-dark-border">
                        <h3 className="text-lg font-bold text-logip-text-header dark:text-dark-text-primary mb-4">Existing Dorms/Rooms ({houseDormitories.length})</h3>
                        <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-2 mb-4">
                            {paginatedDorms.length > 0 ? (
                                paginatedDorms.map(dorm => {
                                    const percentage = dorm.capacity > 0 ? (dorm.studentCount / dorm.capacity) * 100 : 0;
                                    return (
                                        <div key={dorm.id} className="p-3 bg-gray-50 dark:bg-dark-surface rounded-lg flex items-center justify-between gap-4 border border-logip-border dark:border-dark-border">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-logip-text-header dark:text-dark-text-primary truncate">{dorm.name}</p>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-xs font-medium text-logip-text-subtle">{dorm.studentCount}/{dorm.capacity}</span>
                                                    <div className="flex-1 bg-gray-200 dark:bg-dark-border rounded-full h-1.5">
                                                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <div className="flex items-center">
                                                    <button 
                                                        onClick={() => setDormToEdit(dorm)}
                                                        title="Edit Dorm/Room"
                                                        className="p-1.5 rounded-full text-logip-text-subtle hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit_square</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => setDormToDelete(dorm)}
                                                        title="Delete Dorm/Room"
                                                        className="p-1.5 rounded-full text-logip-text-subtle hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-logip-text-subtle">
                                    <span className="material-symbols-outlined text-5xl">meeting_room</span>
                                    <p className="mt-2 font-medium">No dorms/rooms found.</p>
                                </div>
                            )}
                        </div>
                        {/* Pagination for Dorms */}
                        {houseDormitories.length > 0 && (
                            <div className="pt-4 border-t border-logip-border dark:border-dark-border">
                                <PaginationControls 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={houseDormitories.length}
                                    itemsPerPage={itemsPerPage}
                                    onItemsPerPageChange={setItemsPerPage}
                                    startItem={startItem}
                                    endItem={endItem}
                                />
                            </div>
                        )}
                    </div>
                </div>

                 <div className="pt-8 flex justify-end">
                    <button type="button" onClick={onClose} className="px-6 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Close</button>
                </div>
            </AdminModal>
            
            <ConfirmationModal
                isOpen={!!dormToDelete}
                onClose={() => setDormToDelete(null)}
                onConfirm={handleDeleteDormitory}
                title="Delete Dorm/Room"
            >
                Are you sure you want to delete <strong>{dormToDelete?.name}</strong>? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};

export default DormitoryManagementModal;