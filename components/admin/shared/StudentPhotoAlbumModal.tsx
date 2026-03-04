import React, { useState, useMemo } from 'react';
import AdminModal from './AdminModal';
import { AdminStudent } from '../pages/StudentsPage';
import { Class } from '../pages/ClassesPage';
import { House, initialHouses } from './houseData';
import { Dormitory } from './dormitoryData';
import { Programme } from '../pages/ProgrammesPage';
import ImagePreviewModal from '../../shared/ImagePreviewModal';
import PDFPreviewModal from '../../PDFPreviewModal';
import { printTable } from './PrintService';
import { School, Admission } from '../pages/SettingsPage';
import { AdminSelect } from './forms';

interface StudentPhotoAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    students: AdminStudent[];
    classes: Class[];
    houses: House[];
    dormitories: Dormitory[];
    programs: Programme[];
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
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

const getMedicalReport = (indexNumber: string, schoolId?: string) => {
    const key = schoolId ? `applicationData_${schoolId}_${indexNumber}` : `applicationData_${indexNumber}`;
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.hasDisability === 'Yes' && parsed.medicalReport) return parsed.medicalReport;
        }
    } catch (e) {}
    return null;
};

const FilterBadge: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${active ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>{label}</button>
);

const StudentPhotoAlbumModal: React.FC<StudentPhotoAlbumModalProps> = ({ isOpen, onClose, students, classes, houses, dormitories, programs, selectedSchool, selectedAdmission }) => {
    const [filters, setFilters] = useState({ gender: 'All', residence: 'All', programme: 'All', classId: 'All', houseId: 'All', dormitoryId: 'All', medicalOnly: false });
    const [previewImage, setPreviewImage] = useState({ isOpen: false, url: '', title: '' });
    const [medicalPreview, setMedicalPreview] = useState({ isOpen: false, data: '', name: '', type: '' });

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (s.status !== 'Admitted') return false;
            if (filters.gender !== 'All' && s.gender !== filters.gender) return false;
            if (filters.residence !== 'All' && s.residence !== filters.residence) return false;
            if (filters.programme !== 'All' && s.programme !== filters.programme) return false;
            if (filters.classId !== 'All' && s.classId !== filters.classId) return false;
            if (filters.houseId !== 'All' && s.houseId !== filters.houseId) return false;
            if (filters.dormitoryId !== 'All' && s.dormitoryId !== filters.dormitoryId) return false;
            if (filters.medicalOnly && !getMedicalReport(s.indexNumber, s.schoolId)) return false;
            return true;
        });
    }, [students, filters]);

    const handleReset = () => setFilters({ gender: 'All', residence: 'All', programme: 'All', classId: 'All', houseId: 'All', dormitoryId: 'All', medicalOnly: false });

    return (
        <>
        <AdminModal isOpen={isOpen} onClose={onClose} title="Student Photo Gallery" size="6xl">
            <div className="flex flex-col h-[80vh] -mx-8 -my-6">
                <div className="px-8 py-6 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><span className="material-symbols-outlined text-blue-600">photo_library</span> Admitted Students Album</h2>
                            <p className="text-sm text-gray-500 mt-1">Visual directory of {filteredStudents.length} admitted students</p>
                        </div>
                        <div className="flex gap-4">
                             <div className="flex flex-col items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100"><span className="text-xs font-bold text-blue-600 uppercase">MALE</span><span className="text-xl font-bold">{filteredStudents.filter(s => s.gender === 'Male').length}</span></div>
                             <div className="flex flex-col items-center px-4 py-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-100"><span className="text-xs font-bold text-pink-600 uppercase">FEMALE</span><span className="text-xl font-bold">{filteredStudents.filter(s => s.gender === 'Female').length}</span></div>
                             <button onClick={() => printTable('printable-album', 'Photo Album', selectedSchool, undefined, selectedAdmission?.title)} className="px-4 py-2 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center group"><span className="material-symbols-outlined text-gray-400 group-hover:text-blue-600">print</span><span className="text-[10px] font-bold uppercase mt-1">PRINT ALBUM</span></button>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">FILTERS:</span>
                        <div className="flex bg-gray-100 dark:bg-dark-border rounded-full p-1">
                            <FilterBadge label="All" active={filters.gender === 'All'} onClick={() => setFilters(p => ({...p, gender: 'All'}))} />
                            <FilterBadge label="Male" active={filters.gender === 'Male'} onClick={() => setFilters(p => ({...p, gender: 'Male'}))} />
                            <FilterBadge label="Female" active={filters.gender === 'Female'} onClick={() => setFilters(p => ({...p, gender: 'Female'}))} />
                        </div>
                        <div className="flex bg-gray-100 dark:bg-dark-border rounded-full p-1">
                            <FilterBadge label="All" active={filters.residence === 'All'} onClick={() => setFilters(p => ({...p, residence: 'All'}))} />
                            <FilterBadge label="Boarding" active={filters.residence === 'Boarding'} onClick={() => setFilters(p => ({...p, residence: 'Boarding'}))} />
                            <FilterBadge label="Day" active={filters.residence === 'Day'} onClick={() => setFilters(p => ({...p, residence: 'Day'}))} />
                        </div>
                        <div className="w-44"><AdminSelect value={filters.programme} onChange={(e) => setFilters(p => ({...p, programme: e.target.value}))}><option value="All">All Programmes</option>{programs.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}</AdminSelect></div>
                        <div className="w-40"><AdminSelect value={filters.classId} onChange={(e) => setFilters(p => ({...p, classId: e.target.value}))}><option value="All">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</AdminSelect></div>
                        <div className="w-40"><AdminSelect value={filters.houseId} onChange={(e) => setFilters(p => ({...p, houseId: e.target.value}))}><option value="All">All Houses</option>{houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</AdminSelect></div>
                        {filters.residence !== 'Day' && <div className="w-40"><AdminSelect value={filters.dormitoryId} onChange={(e) => setFilters(p => ({...p, dormitoryId: e.target.value}))}><option value="All">All Dorms</option>{dormitories.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</AdminSelect></div>}
                        <button onClick={() => setFilters(p => ({...p, medicalOnly: !p.medicalOnly}))} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${filters.medicalOnly ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white dark:bg-dark-surface text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}`}><span className="material-symbols-outlined text-sm">medical_information</span>Medical</button>
                        <button onClick={handleReset} className="text-[10px] font-black uppercase text-gray-500 hover:text-red-500 underline ml-auto">Reset Filters</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-gray-100 dark:bg-black/20">
                    {filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {filteredStudents.map(student => {
                                const avatarUrl = getStudentAvatarUrl(student.indexNumber, student.gender, student.schoolId);
                                const medicalReport = getMedicalReport(student.indexNumber, student.schoolId);
                                return (
                                    <div key={student.id} className="group relative bg-white dark:bg-dark-surface rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer transform hover:-translate-y-1 transition-all duration-300" onClick={() => setPreviewImage({ isOpen: true, url: avatarUrl, title: student.name })}>
                                        <div className="aspect-square bg-gray-200 relative"><img src={avatarUrl} alt={student.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"><span className="text-white text-xs font-bold">{student.indexNumber}</span></div>{medicalReport && <button onClick={(e) => { e.stopPropagation(); setMedicalPreview({ isOpen: true, data: medicalReport.data, name: `${student.name} - Medical Report`, type: medicalReport.type }); }} className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center border-2 border-white shadow-lg transform hover:scale-110 active:scale-95"><span className="material-symbols-outlined text-[18px]">medical_information</span></button>}</div>
                                        <div className="p-3"><h3 className="font-bold text-sm truncate">{student.name}</h3><p className="text-[10px] text-gray-500 truncate mt-1">{classes.find(c => c.id === student.classId)?.name || student.programme}</p></div>
                                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${student.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="h-full flex flex-col items-center justify-center text-gray-400"><span className="material-symbols-outlined text-6xl mb-4 opacity-20">photo_album</span><p className="text-lg font-bold uppercase tracking-widest">No matching results</p></div>
                    )}
                </div>
            </div>
            <table id="printable-album" className="hidden"><tbody>{Array.from({ length: Math.ceil(filteredStudents.length / 4) }).map((_, r) => (<tr key={r}>{filteredStudents.slice(r*4, (r*4)+4).map(s => (<td key={s.id}><div className="print-card"><div className="print-photo-container"><img src={getStudentAvatarUrl(s.indexNumber, s.gender, s.schoolId)} className="print-photo" /></div><div className="print-name">{s.name}</div><div className="print-meta">{s.indexNumber}<br/>{s.programme}</div></div></td>))}</tr>))}</tbody></table>
        </AdminModal>
        <ImagePreviewModal isOpen={previewImage.isOpen} onClose={() => setPreviewImage(p => ({...p, isOpen: false}))} imageUrl={previewImage.url} altText={previewImage.title} />
        {medicalPreview.isOpen && (medicalPreview.type === 'application/pdf' ? <PDFPreviewModal isOpen={true} onClose={() => setMedicalPreview(p => ({ ...p, isOpen: false }))} pdfData={medicalPreview.data} fileName={medicalPreview.name} /> : <ImagePreviewModal isOpen={true} onClose={() => setMedicalPreview(p => ({ ...p, isOpen: false }))} imageUrl={medicalPreview.data} altText={medicalPreview.name} />)}
        </>
    );
};

export default StudentPhotoAlbumModal;