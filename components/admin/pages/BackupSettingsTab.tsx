import React, { useState, useMemo } from 'react';
import { Admission, School } from './SettingsPage';
import { useToast } from '../shared/ToastContext';
import ConfirmationModal from '../shared/ConfirmationModal';

interface BackupSettingsTabProps {
    allAdmissions: Admission[];
    selectedSchool?: School | null; // Add prop for selected school
}

const generateMockBackups = () => {
    const backups: { timestamp: Date; size: number }[] = [];
    const now = new Date();
    // Generate backups for the last 30 days, one per hour
    for (let i = 0; i < 30 * 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        // Simulate some hours having no backups for realism
        if (Math.random() > 0.1) {
            const size = Math.floor(Math.random() * (50 - 5 + 1) + 5) * 1024 * 1024; // 5MB to 50MB
            backups.push({ timestamp, size });
        }
    }
    return backups;
};

const BackupSettingsTab: React.FC<BackupSettingsTabProps> = ({ allAdmissions, selectedSchool }) => {
    const { showToast } = useToast();
    const [fileToRestore, setFileToRestore] = useState<File | null>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

    // State for calendar and backups
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const mockBackups = useMemo(() => generateMockBackups(), []);

    const backupsByDay = useMemo(() => {
        const map = new Map<string, { timestamp: Date; size: number }[]>();
        mockBackups.forEach(backup => {
            const dateKey = backup.timestamp.toISOString().split('T')[0];
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(backup);
        });
        return map;
    }, [mockBackups]);

    const selectedDayBackups = useMemo(() => {
        const dateKey = selectedDate.toISOString().split('T')[0];
        const dayBackups = backupsByDay.get(dateKey) || [];
        // Sort by time, most recent first
        return dayBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [selectedDate, backupsByDay]);

    const handleDateChange = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    
    const downloadBackup = (backup: { timestamp: Date; size: number }) => {
        const filteredAdmissions = selectedSchool 
            ? allAdmissions.filter(a => a.schoolId === selectedSchool.id)
            : allAdmissions;

        const dataToBackup = {
            backup_timestamp: backup.timestamp.toISOString(),
            simulated_size_bytes: backup.size,
            scope: selectedSchool ? `School: ${selectedSchool.name}` : 'Global',
            data: {
                admissions: filteredAdmissions,
                // In a real app, you would include students, classes, etc. filtered by schoolId
            }
        };

        const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const scopePrefix = selectedSchool ? selectedSchool.slug : 'global';
        a.download = `logip-backup-${scopePrefix}-${backup.timestamp.toISOString().replace(/:/g, '-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Backup file has been downloaded.', 'success');
    };

    const handleRestore = () => {
        if (!fileToRestore) return;
        console.log(`Restoring from file: ${fileToRestore.name}`);
        showToast('System data has been restored from backup.', 'success');
        setIsRestoreModalOpen(false);
        setFileToRestore(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFileToRestore(e.target.files[0]);
        }
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);
        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const dateKey = date.toISOString().split('T')[0];
            const hasBackup = backupsByDay.has(dateKey);
            const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            const isFuture = date > today;

            return (
                <div key={day} className="relative">
                    <button
                        onClick={() => handleDateChange(day)}
                        className={`w-10 h-10 flex items-center justify-center rounded-full text-sm transition-colors ${
                            isSelected ? 'bg-blue-600 text-white font-semibold' :
                            isToday ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' :
                            isFuture ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-border'
                        }`}
                        disabled={isFuture}
                    >
                        {day}
                    </button>
                    {hasBackup && <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />}
                </div>
            );
        });

        return [...blanks, ...days];
    };

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="bg-logip-white dark:bg-dark-surface p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <h3 className="text-xl font-bold text-logip-text-header dark:text-dark-text-primary">Backup History</h3>
                <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Hourly backups are stored for 30 days. Select a date to view and download backups.</p>
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => changeMonth(-1)} className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border"><span className="material-symbols-outlined">chevron_left</span></button>
                            <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
                            <button onClick={() => changeMonth(1)} className="p-1 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-border"><span className="material-symbols-outlined">chevron_right</span></button>
                        </div>
                        <div className="grid grid-cols-7 gap-y-2 place-items-center">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-xs font-medium text-logip-text-subtle">{d}</div>)}
                            {renderCalendar()}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary mb-3">
                            Backups for {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto no-scrollbar pr-2 -mr-2">
                            {selectedDayBackups.length > 0 ? (
                                selectedDayBackups.map(backup => (
                                    <div key={backup.timestamp.toISOString()} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-blue-500">history</span>
                                            <div>
                                                <p className="font-semibold text-sm text-logip-text-header dark:text-dark-text-primary">{backup.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-xs text-logip-text-subtle">{(backup.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => downloadBackup(backup)} className="px-3 py-1 text-sm font-semibold rounded-md bg-gray-200 dark:bg-dark-border text-logip-text-body dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700">Download</button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-logip-text-subtle">
                                    <span className="material-symbols-outlined text-4xl">cloud_off</span>
                                    <p className="mt-2 font-medium">No backups for this date.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-5xl text-blue-500">cloud_download</span>
                    <h4 className="mt-3 text-lg font-semibold text-logip-text-header dark:text-dark-text-primary">Manual Backup</h4>
                    <p className="mt-1 text-sm text-logip-text-subtle dark:text-dark-text-secondary flex-1">Download a current snapshot of {selectedSchool ? `data for ${selectedSchool.name}` : 'all system data'}.</p>
                    <button onClick={() => downloadBackup({ timestamp: new Date(), size: 0 })} className="mt-4 w-full px-6 py-2 text-base font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                        Download Current Data
                    </button>
                </div>
                <div className="p-6 rounded-lg bg-logip-white dark:bg-dark-surface border border-logip-border dark:border-dark-border flex flex-col items-center text-center">
                    <span className="material-symbols-outlined text-5xl text-green-500">cloud_upload</span>
                    <h4 className="mt-3 text-lg font-semibold text-logip-text-header dark:text-dark-text-primary">Restore from File</h4>
                    <p className="mt-1 text-sm text-logip-text-subtle dark:text-dark-text-secondary flex-1">Upload a previously created backup file to restore the system state.</p>
                    <button onClick={() => setIsRestoreModalOpen(true)} className="mt-4 w-full px-6 py-2 text-base font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700">
                        Restore Data
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isRestoreModalOpen}
                onClose={() => setIsRestoreModalOpen(false)}
                onConfirm={handleRestore}
                title="Restore from Backup"
                confirmButtonClass="bg-green-600 hover:bg-green-700"
            >
                <div className="text-left space-y-4">
                    <p className="p-3 text-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-semibold">
                        <span className="font-bold">Warning:</span> Restoring from a backup will overwrite current data {selectedSchool ? `for ${selectedSchool.name}` : 'globally'}. This action cannot be undone.
                    </p>
                    <p>Please select a valid backup JSON file to proceed.</p>
                    <div>
                        <label htmlFor="restore-file" className="block text-sm font-medium text-logip-text-body dark:text-dark-text-secondary mb-1">Backup File</label>
                        <input
                            id="restore-file"
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="w-full text-sm text-logip-text-body dark:text-dark-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                        />
                    </div>
                </div>
            </ConfirmationModal>
        </div>
    );
};

export default BackupSettingsTab;