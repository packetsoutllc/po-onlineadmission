import React, { useState, useMemo, useEffect } from 'react';
import { AdminStudent, StudentStatus } from '../pages/StudentsPage';
import PaginationControls from './PaginationControls';
import { School } from '../pages/SettingsPage';
import { printTable } from './PrintService';
import ImagePreviewModal from '../../shared/ImagePreviewModal';
import { initialClasses } from '../pages/ClassesPage';

interface MemberListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    members: AdminStudent[];
    icon: string;
    headerColor: string;
    selectedSchool?: School | null;
    listMeta?: string;
    groupGender?: 'Male' | 'Female' | 'Mixed';
    onEditStudent?: (student: AdminStudent) => void;
}

const getStudentAvatarUrl = (indexNumber: string, gender: 'Male' | 'Female', schoolId?: string): string => {
    const keysToTry = [
        schoolId ? `applicationData_${schoolId}_${indexNumber}` : null,
        `applicationData_s1_${indexNumber}`,
        `applicationData_${indexNumber}`,
        `file_upload_${indexNumber}_Passport-Size-Photograph`
    ].filter(Boolean);

    for (const key of keysToTry) {
        try {
            const raw = localStorage.getItem(key!);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.passportPhotograph?.data) return parsed.passportPhotograph.data;
                if (parsed.data) return parsed.data;
            }
        } catch (e) {}
    }
    return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${gender === 'Male' ? '#dbeafe' : '#fce7f3'}" /><text x="50" y="55" font-family="Arial" font-size="50" fill="${gender === 'Male' ? '#1d4ed8' : '#be185d'}" text-anchor="middle" dominant-baseline="middle">?</text></svg>`)}`;
};


const StatusPill: React.FC<{ status: StudentStatus }> = ({ status }) => {
    const baseClasses = 'px-2 py-0.5 text-xs font-semibold rounded-full capitalize whitespace-nowrap';
    const styles = {
        Admitted: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
        Placed: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
        Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
        Rejected: 'bg-red-100 text-red-800 dark:bg-red-50/20 dark:text-red-300',
        Prospective: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    };
    return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
};

const MemberListModal: React.FC<MemberListModalProps> = ({ isOpen, onClose, title, members, icon, headerColor, selectedSchool, listMeta, groupGender, onEditStudent }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12); // Adjusted for grid view
    const [imagePreview, setImagePreview] = useState<{ isOpen: boolean; url: string; alt: string }>({ isOpen: false, url: '', alt: '' });
    const [isFullScreen, setIsFullScreen] = useState(false);

    const filteredMembers = useMemo(() => {
        return members.filter(member =>
            member.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [members, searchTerm]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, filteredMembers.length);

    const maleCount = useMemo(() => members.filter(m => m.gender === 'Male').length, [members]);
    const femaleCount = useMemo(() => members.filter(m => m.gender === 'Female').length, [members]);
    
    const handleOpenImagePreview = (url: string, alt: string) => {
        setImagePreview({ isOpen: true, url, alt });
    };

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    if (!isOpen) return null;

    const handlePrint = () => {
        let summaryStatsText = `Total: ${members.length}, Male: ${maleCount}, Female: ${femaleCount}`;
        if (groupGender === 'Male') {
            summaryStatsText = `Total: ${members.length}, Male: ${maleCount}`;
        } else if (groupGender === 'Female') {
            summaryStatsText = `Total: ${members.length}, Female: ${femaleCount}`;
        }

        const preTableContent = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; margin-bottom: 20px; padding: 10px 15px; background-color: #f9f9f9; border-radius: 5px; border: 1px solid #eee;">
                <h3 style="margin:0; font-size: 12px; font-weight: 600; color: #333;">${summaryStatsText}</h3>
            </div>
        `;
        // Pass listMeta (admission title) as the 5th argument
        printTable('member-list-table-printable', title, selectedSchool, preTableContent, listMeta);
    };

    const handleExportCsv = () => {
        const headers = ["S/N", "Name", "Gender", "Status", "Date Admitted"];
        const rows = filteredMembers.map((member, index) => [
            index + 1,
            `"${member.name.replace(/"/g, '""')}"`, // Handle quotes in names
            member.gender,
            member.status,
            new Date(member.admissionDate).toLocaleDateString('en-GB').replace(/\//g, '-'),
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        const fileName = `${title.replace(/\s+/g, '_')}_export.csv`;
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center animate-fadeIn ${isFullScreen ? 'p-0' : 'p-4'}`}
            onClick={onClose}
        >
            <div 
                className={`bg-logip-white dark:bg-dark-surface shadow-2xl w-full m-auto animate-scaleIn border border-logip-border dark:border-dark-border flex flex-col ${isFullScreen ? 'max-w-none w-full h-full max-h-none rounded-none' : 'max-w-5xl rounded-xl max-h-[90vh]'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-gradient-to-br ${headerColor} p-6 text-white ${isFullScreen ? 'rounded-t-none' : 'rounded-t-xl'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-4xl">{icon}</span>
                            <div>
                                <h2 className="text-2xl font-bold">{title}</h2>
                                <p className="opacity-80">Detailed member listing and information</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={toggleFullScreen} className="text-white/70 hover:text-white transition-colors rounded-full p-1">
                                <span className="material-symbols-outlined">{isFullScreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                            </button>
                            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors rounded-full p-1">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-6 text-sm">
                        <div className="text-center"><span className="font-bold text-lg">{members.length}</span> Total Members</div>
                        {groupGender !== 'Female' && <div className="text-center"><span className="font-bold text-lg">{maleCount}</span> Male</div>}
                        {groupGender !== 'Male' && <div className="text-center"><span className="font-bold text-lg">{femaleCount}</span> Female</div>}
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 border-b border-logip-border dark:border-dark-border flex items-center justify-between">
                     <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary dark:focus:ring-dark-accent-purple transition-colors"
                        />
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={handleExportCsv} title="Export as CSV" className="p-2 border border-logip-border dark:border-dark-border font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                            <span className="material-symbols-outlined text-xl leading-none">download</span>
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-base border border-logip-border dark:border-dark-border font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                            <span className="material-symbols-outlined text-xl">print</span>
                            Print List
                        </button>
                    </div>
                </div>
                
                {/* Photo Album Grid */}
                <div className="overflow-y-auto flex-1 p-6 bg-gray-50 dark:bg-dark-bg/50">
                    {paginatedMembers.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {paginatedMembers.map(member => {
                                const avatarUrl = getStudentAvatarUrl(member.indexNumber, member.gender, member.schoolId);
                                const className = initialClasses.find(c => c.id === member.classId)?.name;
                                return (
                                    <button 
                                        key={member.id} 
                                        onClick={() => onEditStudent?.(member)}
                                        className={`bg-logip-white dark:bg-dark-surface rounded-lg p-4 text-center flex flex-col items-center animate-fadeIn shadow-sm  transition-all duration-200 border border-logip-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logip-primary dark:focus:ring-offset-dark-bg/50 ${onEditStudent ? 'hover:shadow-md hover:scale-105 cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div onClick={(e) => { e.stopPropagation(); handleOpenImagePreview(avatarUrl, member.name); }} className="rounded-full mb-3 cursor-pointer">
                                            <img src={avatarUrl} alt={member.name} className="w-24 h-24 rounded-full object-cover" />
                                        </div>
                                        <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary truncate w-full" title={member.name}>{member.name}</h4>
                                        {className && <p className="text-xs text-logip-text-subtle dark:text-dark-text-secondary mt-1">{className}</p>}
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(member.admissionDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
                                        <div className="mt-2">
                                            <StatusPill status={member.status} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center py-16 text-logip-text-subtle">
                           <div>
                                <span className="material-symbols-outlined text-5xl">person_off</span>
                                <p className="mt-2 text-lg font-semibold">No Members Found</p>
                                <p>Try adjusting your search term.</p>
                           </div>
                        </div>
                    )}
                </div>

                 {/* Footer */}
                <div className="p-4 border-t border-logip-border dark:border-dark-border flex items-center justify-between flex-shrink-0">
                    <PaginationControls 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={filteredMembers.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startItem={startItem}
                        endItem={endItem}
                    />
                </div>
                {/* Hidden table for printing */}
                <div className="hidden">
                    <table id="member-list-table-printable">
                        <thead>
                            <tr>
                                <th>S/N</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Status</th>
                                <th>Date Admitted</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member, index) => (
                                <tr key={`print-${member.id}`}>
                                    <td>{index + 1}</td>
                                    <td>{member.name}</td>
                                    <td>{member.gender}</td>
                                    <td>{member.status}</td>
                                    <td>{new Date(member.admissionDate).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <ImagePreviewModal
                isOpen={imagePreview.isOpen}
                onClose={() => setImagePreview({ isOpen: false, url: '', alt: '' })}
                imageUrl={imagePreview.url}
                altText={imagePreview.alt}
            />
        </div>
    );
};

export default MemberListModal;