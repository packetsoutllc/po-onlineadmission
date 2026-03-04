import React, { useState, useMemo, useEffect } from 'react';
import { School, Admission } from './SettingsPage';
import { AdminStudent, StudentStatus } from './StudentsPage';
import PaginationControls from '../shared/PaginationControls';
import PrintButton from '../shared/PrintButton';
import { printTable } from '../shared/PrintService';
import ConfirmationModal from '../shared/ConfirmationModal';
import AdminModal from '../shared/AdminModal';
import { AdminInput, AdminSelect } from '../shared/forms';
import StatCard from '../shared/StatCard';
import BarChart from '../charts/BarChart';
import DoughnutChart from '../charts/DoughnutChart';
import { useSortableData } from '../../hooks/useSortableData';
import SortableHeader from '../shared/SortableHeader';
import { AdmissionSettings } from './SecuritySettingsTab';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AdminUser } from '../AdminLayout';

// --- TYPE DEFINITIONS ---
export interface Transaction {
    id: string;
    studentId: string;
    studentName: string;
    indexNumber: string;
    status: 'Paid' | 'Unpaid';
    docAccessStatus?: 'Paid' | 'Unpaid';
    date: string | null;
    docAccessDate?: string | null;
    serialNumber: string | null;
    pin: string | null;
    isExempt: boolean;
}

const generateCredential = (length: number, format: 'numeric' | 'alphabetic' | 'alphanumeric' | undefined): string => {
    const safeLength = (typeof length === 'number' && length > 0) ? length : 10;
    const safeFormat = format || 'numeric';
    let chars = '0123456789';
    if (safeFormat === 'alphabetic') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    else if (safeFormat === 'alphanumeric') chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < safeLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};


// --- DASHBOARD COMPONENT ---
const TransactionDashboard: React.FC<{ 
    transactions: Transaction[];
    chartTimeframe: 'hourly' | 'daily' | 'weekly' | 'monthly';
    setChartTimeframe: (timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly') => void;
}> = ({ transactions, chartTimeframe, setChartTimeframe }) => {
    const [dateOffset, setDateOffset] = useState(0);

    useEffect(() => {
        setDateOffset(0);
    }, [chartTimeframe]);

    const stats = useMemo(() => {
        const now = new Date();
        const oneHour = 60 * 60 * 1000;
        const oneDay = 24 * oneHour;
        const paidTransactions = transactions.filter(t => t.status === 'Paid' && t.date);
        const lastHour = new Date(now.getTime() - oneHour);
        const hourly = paidTransactions.filter(t => new Date(t.date!) >= lastHour).length;
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const daily = paidTransactions.filter(t => new Date(t.date!) >= todayStart).length;
        const dailyRevenue = daily * 50;
        const sevenDaysAgo = new Date(todayStart.getTime() - 6 * oneDay);
        const weekly = paidTransactions.filter(t => new Date(t.date!) >= sevenDaysAgo).length;
        const weeklyRevenue = weekly * 50;
        const thirtyDaysAgo = new Date(todayStart.getTime() - 29 * oneDay);
        const monthly = paidTransactions.filter(t => new Date(t.date!) >= thirtyDaysAgo).length;
        const monthlyRevenue = monthly * 50;
        const totalRevenue = paidTransactions.length * 50;
        const paidCount = paidTransactions.length;
        const totalCount = transactions.length;
        const paidPercentage = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
        let chartData: { label: string; value: number }[] = [];
        let chartTitle = '';

        switch (chartTimeframe) {
            case 'hourly': {
                if (dateOffset === 0) {
                    chartTitle = 'Hourly Transaction Volume (Last 24 Hours)';
                } else {
                    const startHour = dateOffset * 24;
                    const endHour = (dateOffset + 1) * 24;
                    chartTitle = `Hourly Transaction Volume (${startHour}-${endHour} Hours Ago)`;
                }
                const baseDate = new Date(now.getTime() - dateOffset * 24 * oneHour);
                chartData = Array.from({ length: 24 }).map((_, i) => {
                    const hourEnd = new Date(baseDate.getTime() - i * oneHour);
                    const hourStart = new Date(hourEnd.getTime() - oneHour);
                    const count = paidTransactions.filter(t => {
                        const transDate = new Date(t.date!);
                        return transDate >= hourStart && transDate < hourEnd;
                    }).length;
                    const showLabel = i % 3 === 0;
                    const label = showLabel ? hourEnd.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(/\s/g, '') : '';
                    return { label, value: count };
                }).reverse();
                break;
            }
            case 'monthly':
                chartTitle = 'Monthly Transaction Volume';
                const monthBaseDate = new Date(now.getFullYear(), now.getMonth() - (dateOffset * 6), 1);
                chartData = Array.from({ length: 6 }).map((_, i) => {
                    const d = new Date(monthBaseDate.getFullYear(), monthBaseDate.getMonth() - 5 + i, 1);
                    const month = d.getMonth();
                    const year = d.getFullYear();
                    const count = paidTransactions.filter(t => {
                        const transDate = new Date(t.date!);
                        return transDate.getMonth() === month && transDate.getFullYear() === year;
                    }).length;
                    return { label: d.toLocaleDateString('en-US', { month: 'short' }), value: count };
                });
                break;
            case 'weekly':
                chartTitle = 'Weekly Transaction Volume';
                const weekBaseDate = new Date(now.getTime() - (dateOffset * 4 * 7 * oneDay));
                 chartData = Array.from({ length: 4 }).map((_, i) => {
                    const weekEnd = new Date(weekBaseDate.getTime() - (i * 7 * oneDay));
                    const weekStart = new Date(weekEnd.getTime() - (6 * oneDay));
                    weekStart.setHours(0,0,0,0);
                    const count = paidTransactions.filter(t => { const d = new Date(t.date!); return d >= weekStart && d <= weekEnd; });
                    return { label: `Week of ${weekStart.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`, value: count.length };
                }).reverse();
                break;
            case 'daily':
            default:
                chartTitle = 'Daily Transaction Volume';
                const dayBaseDate = new Date(todayStart.getTime() - (dateOffset * 7 * oneDay));
                const sevenDaysAgoForPeriod = new Date(dayBaseDate.getTime() - 6 * oneDay);
                chartData = Array.from({ length: 7 }).map((_, i) => {
                    const day = new Date(sevenDaysAgoForPeriod.getTime() + i * oneDay);
                    const dayOfWeek = day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    const count = paidTransactions.filter(t => t.date && new Date(t.date).toDateString() === day.toDateString()).length;
                    return { label: dayOfWeek, value: count };
                });
                break;
        }

        return {
            hourly, daily, weekly, monthly,
            dailyRevenue, weeklyRevenue, monthlyRevenue, totalRevenue,
            paidPercentage, chartData, chartTitle 
        };
    }, [transactions, chartTimeframe, dateOffset]);
    
    const handleChartNav = (direction: 'prev' | 'next') => {
        if (direction === 'next' && dateOffset > 0) {
            setDateOffset(prev => prev - 1);
        } else if (direction === 'prev') {
            setDateOffset(prev => prev + 1);
        }
    };

    return (
        <section className="mb-6 space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="hourglass_top" title="Hourly Transactions" value={stats.hourly.toString()} iconBgClass="bg-teal-100 dark:bg-teal-50/20" iconColorClass="text-teal-600 dark:text-teal-300" />
                <StatCard icon="today" title="Daily Transactions" value={stats.daily.toString()} iconBgClass="bg-blue-100 dark:bg-blue-50/20" iconColorClass="text-blue-600 dark:text-blue-300" />
                <StatCard icon="calendar_view_week" title="Weekly Transactions" value={stats.weekly.toString()} iconBgClass="bg-blue-100 dark:bg-blue-50/20" iconColorClass="text-blue-600 dark:text-blue-300" />
                <StatCard icon="calendar_month" title="Monthly Transactions" value={stats.monthly.toString()} iconBgClass="bg-orange-100 dark:bg-orange-50/20" iconColorClass="text-orange-600 dark:text-orange-300" />
                <StatCard icon="account_balance_wallet" title="Daily Revenue" value={`GHS ${stats.dailyRevenue.toLocaleString()}`} iconBgClass="bg-sky-100 dark:bg-sky-50/20" iconColorClass="text-sky-600 dark:text-sky-300" />
                <StatCard icon="account_balance_wallet" title="Weekly Revenue" value={`GHS ${stats.weeklyRevenue.toLocaleString()}`} iconBgClass="bg-indigo-100 dark:bg-indigo-50/20" iconColorClass="text-indigo-600 dark:text-indigo-300" />
                <StatCard icon="account_balance_wallet" title="Monthly Revenue" value={`GHS ${stats.monthlyRevenue.toLocaleString()}`} iconBgClass="bg-rose-100 dark:bg-rose-50/20" iconColorClass="text-rose-600 dark:text-rose-300" />
                <StatCard icon="payments" title="Total Revenue" value={`GHS ${stats.totalRevenue.toLocaleString()}`} iconBgClass="bg-green-100 dark:bg-green-50/20" iconColorClass="text-green-600 dark:text-green-300" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <BarChart 
                        title={stats.chartTitle} 
                        data={stats.chartData}
                        showNav={true}
                        onNav={handleChartNav}
                        isNextDisabled={dateOffset === 0}
                    />
                </div>
                <div>
                    <DoughnutChart title="Payment Status" percentage={stats.paidPercentage} primaryColor="#10b981" secondaryColor="#34d399" />
                </div>
            </div>
        </section>
    );
};


// --- HELPER COMPONENTS ---
const TransactionStatusPill: React.FC<{ status: 'Paid' | 'Unpaid'; label: string; type: 'app' | 'doc' }> = ({ status, label, type }) => {
    const baseClasses = 'px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1.5';
    
    if (type === 'app') {
        return (
            <div className={`${baseClasses} ${status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-50/20 dark:text-rose-300'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'Paid' ? 'bg-emerald-50' : 'bg-rose-500'}`}></div>
                <span>{status} {label}</span>
            </div>
        );
    } else {
        return (
            <div className={`${baseClasses} ${status === 'Paid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-50/20 dark:text-orange-300'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'Paid' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                <span>{status} {label}</span>
            </div>
        );
    }
};

const ActionButton: React.FC<{ icon: string, onClick: () => void, title: string, colorClass?: string }> = ({ icon, onClick, title, colorClass = 'text-logip-text-subtle hover:text-logip-text-header dark:text-dark-text-secondary dark:hover:text-dark-text-primary' }) => (
    <button onClick={onClick} title={title} className={`p-1.5 rounded-md transition-colors ${colorClass} no-print`}>
        <span className="material-symbols-outlined text-xl">{icon}</span>
    </button>
);

// --- MAIN COMPONENT ---
interface TransactionsPageProps {
    selectedSchool?: School | null;
    selectedAdmission?: Admission | null;
    students: AdminStudent[];
    setStudents: React.Dispatch<React.SetStateAction<AdminStudent[]>>;
    permissions: Set<string>;
    isSuperAdmin: boolean;
    adminUser: AdminUser; // Added adminUser prop
}

const TransactionsPage: React.FC<TransactionsPageProps> = ({ selectedSchool, selectedAdmission, students, setStudents, permissions, isSuperAdmin, adminUser }) => {
    const userPrefix = adminUser.email;
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // PERMANENCE: Scope settings by user email
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`${userPrefix}_admin_transactions_items_per_page`, 10);
    const [showDashboard, setShowDashboard] = useLocalStorage<boolean>(`${userPrefix}_admin_transactions_show_dashboard`, false);
    const [chartTimeframe, setChartTimeframe] = useLocalStorage<'hourly' | 'daily' | 'weekly' | 'monthly'>(`${userPrefix}_admin_transactions_chart_timeframe`, 'daily');

    const [version, setVersion] = useState(0);

    const [modalState, setModalState] = useState<{ mode: 'edit' | 'regenerate' | 'delete' | null; transaction: Transaction | null }>({ mode: null, transaction: null });

    const financialsSettings = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return { docAccessFeeEnabled: false };
        const key = `financialsSettings_${selectedSchool.id}_${selectedAdmission.id}`;
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : { docAccessFeeEnabled: false };
    }, [selectedSchool, selectedAdmission]);

    // FIX: Added explicit return type Transaction[] to useMemo to fix inference errors.
    const allTransactions = useMemo((): Transaction[] => {
        if (!selectedSchool || !selectedAdmission) return [];
        const financialsKey = `financialsSettings_${selectedSchool.id}_${selectedAdmission.id}`;
        const financialsRaw = localStorage.getItem(financialsKey);
        const financials = financialsRaw ? JSON.parse(financialsRaw) : { gatewayStatus: true, requirementPolicy: 'all', targetedStudents: [], exemptedStudents: [] };
        
        return students.map(student => {
            const credentialsRaw = localStorage.getItem(`credentials_${selectedSchool.id}_${student.indexNumber}`);
            const credentials = credentialsRaw ? JSON.parse(credentialsRaw) : { serialNumber: null, pin: null };
            
            // App Fee Status logic
            let paymentRequired = financials.gatewayStatus;
            if (paymentRequired) {
                if (financials.requirementPolicy === 'selected') {
                    paymentRequired = financials.targetedStudents.includes(student.id);
                } else if (financials.requirementPolicy === 'exempted') {
                    paymentRequired = !financials.exemptedStudents.includes(student.id);
                }
            }
            const isExempt = !paymentRequired;

            // Doc Fee Status logic
            const docUnlockStatusKey = `paymentStatus_docAccess_${selectedSchool.id}_${student.indexNumber}`;
            const docAccessPaidRaw = localStorage.getItem(docUnlockStatusKey);
            const isDocPaid = docAccessPaidRaw ? JSON.parse(docAccessPaidRaw).paid : false;

            // FIX: Explicitly typed return object to match Transaction interface.
            return {
                id: `trans_${student.id}`,
                studentId: student.id,
                studentName: student.name,
                indexNumber: student.indexNumber,
                status: student.feeStatus,
                docAccessStatus: (isDocPaid ? 'Paid' : 'Unpaid') as 'Paid' | 'Unpaid',
                date: student.paymentDate || null,
                serialNumber: credentials.serialNumber,
                pin: credentials.pin,
                isExempt: isExempt
            };
        });
    }, [students, version, selectedSchool, selectedAdmission]);

    const filteredTransactions = useMemo(() => {
        if (!selectedSchool || !selectedAdmission) return [];
        const studentIdsInAdmission = students
            .filter(s => s.schoolId === selectedSchool.id && s.admissionId === selectedAdmission.id)
            .map(s => s.id);
        return allTransactions.filter(trans => {
            const isInAdmission = studentIdsInAdmission.includes(trans.studentId);
            const matchesSearch = trans.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || trans.indexNumber.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = 
                statusFilter === 'all' || 
                (statusFilter === 'app_paid' && trans.status === 'Paid') ||
                (statusFilter === 'app_unpaid' && trans.status === 'Unpaid') ||
                (statusFilter === 'doc_paid' && trans.docAccessStatus === 'Paid') ||
                (statusFilter === 'doc_unpaid' && trans.docAccessStatus === 'Unpaid');

            return isInAdmission && matchesSearch && matchesStatus;
        });
    }, [allTransactions, searchTerm, statusFilter, selectedSchool, selectedAdmission, students]);
    
    const { items: sortedTransactions, requestSort, sortConfig } = useSortableData(filteredTransactions, { key: 'date', direction: 'descending' });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, itemsPerPage, selectedSchool, selectedAdmission]);

    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, sortedTransactions.length);

    const handleOpenModal = (mode: 'edit' | 'regenerate' | 'delete', transaction: Transaction) => {
        setModalState({ mode, transaction });
    };

    const handleCloseModal = () => {
        setModalState({ mode: null, transaction: null });
    };

    const handleSaveTransaction = (updatedData: Partial<Transaction>) => {
        if (!modalState.transaction) return;
        setStudents(prevStudents => prevStudents.map(s => {
            if (s.id === modalState.transaction!.studentId) {
                const updatedStudent: AdminStudent = { ...s };
                if (updatedData.status) updatedStudent.feeStatus = updatedData.status;
                
                if (updatedData.status === 'Unpaid' && s.feeStatus === 'Paid') {
                    updatedStudent.paymentDate = null;
                    localStorage.removeItem(`credentials_${selectedSchool?.id}_${s.indexNumber}`);
                    localStorage.removeItem(`paymentStatus_${selectedSchool?.id}_${s.indexNumber}`);
                }
                
                if (updatedData.status === 'Paid' && s.feeStatus === 'Unpaid') {
                    const credentialsKey = `credentials_${selectedSchool?.id}_${s.indexNumber}`;
                    const admissionSettingsKey = `admissionSettings_${s.schoolId}_${s.admissionId}`;
                    const settingsRaw = localStorage.getItem(admissionSettingsKey);
                    const settings: Partial<AdmissionSettings> = settingsRaw ? JSON.parse(settingsRaw) : {};
                    const serialNumber = updatedData.serialNumber?.toUpperCase() || generateCredential(settings.serialNumberLength || 10, settings.serialNumberFormat);
                    const pin = updatedData.pin?.toUpperCase() || generateCredential(settings.pinLength || 5, settings.pinFormat);
                    
                    localStorage.setItem(credentialsKey, JSON.stringify({ serialNumber, pin }));
                    localStorage.setItem(`paymentStatus_${selectedSchool?.id}_${s.indexNumber}`, JSON.stringify({ paid: true }));
                    updatedStudent.paymentDate = new Date().toISOString();
                }
                return updatedStudent;
            }
            return s;
        }));

        const { serialNumber, pin, docAccessStatus } = updatedData;
        
        // Handle Doc Access status update
        if (docAccessStatus && selectedSchool) {
            const docUnlockStatusKey = `paymentStatus_docAccess_${selectedSchool.id}_${modalState.transaction.indexNumber}`;
            if (docAccessStatus === 'Paid') {
                localStorage.setItem(docUnlockStatusKey, JSON.stringify({ paid: true }));
            } else {
                localStorage.removeItem(docUnlockStatusKey);
            }
        }

        if (serialNumber !== undefined || pin !== undefined) {
             const credentialsKey = `credentials_${selectedSchool?.id}_${modalState.transaction.indexNumber}`;
             const credentialsRaw = localStorage.getItem(credentialsKey);
             const credentials = credentialsRaw ? JSON.parse(credentialsRaw) : {};
             localStorage.setItem(credentialsKey, JSON.stringify({
                 serialNumber: serialNumber !== undefined ? serialNumber.toUpperCase() : credentials.serialNumber,
                 pin: pin !== undefined ? pin.toUpperCase() : credentials.pin
             }));
        }
        setVersion(v => v + 1);
        handleCloseModal();
    };

    const handleResetPayment = () => {
        if (!modalState.transaction || !selectedSchool) return;
        setStudents(prevStudents => prevStudents.map(s => {
            if (s.id === modalState.transaction!.studentId) {
                return { ...s, feeStatus: 'Unpaid', paymentDate: null };
            }
            return s;
        }));
        localStorage.removeItem(`credentials_${selectedSchool.id}_${modalState.transaction.indexNumber}`);
        localStorage.removeItem(`paymentStatus_${selectedSchool.id}_${modalState.transaction.indexNumber}`);
        localStorage.removeItem(`paymentStatus_docAccess_${selectedSchool.id}_${modalState.transaction.indexNumber}`);
        handleCloseModal();
    };
    
    const handleRegenerateCredentials = () => {
        if (!modalState.transaction || !selectedSchool) return;
        const student = students.find(s => s.id === modalState.transaction!.studentId);
        if (!student) return;
        const admissionSettingsKey = `admissionSettings_${student.schoolId}_${student.admissionId}`;
        const settingsRaw = localStorage.getItem(admissionSettingsKey);
        const settings: Partial<AdmissionSettings> = settingsRaw ? JSON.parse(settingsRaw) : {};
        const newSerialNumber = generateCredential(settings.serialNumberLength || 10, settings.serialNumberFormat);
        const newPin = generateCredential(settings.pinLength || 5, settings.pinFormat);
        localStorage.setItem(`credentials_${selectedSchool.id}_${modalState.transaction.indexNumber}`, JSON.stringify({ serialNumber: newSerialNumber, pin: newPin }));
        setVersion(v => v + 1);
        handleCloseModal();
    };

    const handlePrint = () => {
        const printTitle = 'Transaction List';
        printTable('transactions-table', printTitle, selectedSchool, undefined, selectedAdmission?.title);
    };
    
    if (!selectedSchool || !selectedAdmission) {
        return (
            <div className="p-8 text-center text-logip-text-subtle">
                <span className="material-symbols-outlined text-6xl">source_environment</span>
                <p className="mt-4 text-xl font-semibold">No School or Admission Selected</p>
                <p>Please select a school and an admission period to view transactions.</p>
            </div>
        );
    }
    
    const canEdit = isSuperAdmin || permissions.has('icon:tx:edit');
    const canRegen = isSuperAdmin || permissions.has('icon:tx:regen');
    const canDelete = isSuperAdmin || permissions.has('icon:tx:delete');

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {showDashboard && (
                <TransactionDashboard 
                    transactions={filteredTransactions} 
                    chartTimeframe={chartTimeframe}
                    setChartTimeframe={setChartTimeframe}
                />
            )}
            
            <div className="bg-logip-white dark:bg-dark-surface p-4 sm:p-6 rounded-lg border border-logip-border dark:border-dark-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-logip-border dark:border-dark-border pb-6 no-print">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-bold text-logip-text-header dark:text-dark-text-primary">All Transactions</h2>
                        <p className="text-logip-text-subtle dark:text-dark-text-secondary mt-1">Monitor all student application fee payments.</p>
                    </div>
                    <div className="flex w-full md:w-auto items-center gap-2">
                        <PrintButton onClick={handlePrint} />
                        <button 
                            onClick={() => setShowDashboard(!showDashboard)}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined text-xl">{showDashboard ? 'visibility_off' : 'monitoring'}</span>
                            {showDashboard ? 'Hide' : 'Show'} Dashboard
                        </button>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 no-print">
                    <div className="relative w-full sm:w-auto sm:flex-1 max-sm-sm">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-logip-text-subtle dark:text-dark-text-secondary">search</span>
                        <input
                            type="text"
                            placeholder="Search by name or index no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-dark-bg border border-logip-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-base text-logip-text-header dark:text-dark-text-primary placeholder-logip-text-subtle dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-logip-primary transition-colors"
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <AdminSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">All Statuses</option>
                            <option value="app_paid">Paid App Fee</option>
                            <option value="app_unpaid">Unpaid App Fee</option>
                            <option value="doc_paid">Paid Doc Fee</option>
                            <option value="doc_unpaid">Unpaid Doc Fee</option>
                        </AdminSelect>
                    </div>
                </div>
            </div>

            <div className="mt-6 bg-logip-white dark:bg-dark-surface rounded-lg border border-logip-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[1000px]" id="transactions-table">
                        <thead className="border-b border-logip-border dark:border-dark-border bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">S/N</th>
                                <SortableHeader sortKey="studentName" sortConfig={sortConfig} requestSort={requestSort}>Name</SortableHeader>
                                <SortableHeader sortKey="indexNumber" sortConfig={sortConfig} requestSort={requestSort}>Index No.</SortableHeader>
                                <SortableHeader sortKey="status" sortConfig={sortConfig} requestSort={requestSort}>Status</SortableHeader>
                                <SortableHeader sortKey="date" sortConfig={sortConfig} requestSort={requestSort}>Date</SortableHeader>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial Number</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">PIN</th>
                                <th className="p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.map((trans, index) => (
                                <tr key={trans.id} className="border-b border-logip-border dark:border-dark-border last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">{startIndex + index + 1}</td>
                                    <td className="p-4 font-bold text-base text-gray-900 dark:text-gray-100">{trans.studentName}</td>
                                    <td className="p-4 text-base font-mono text-gray-600 dark:text-gray-400">{trans.indexNumber}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                                            <div className="flex items-center">
                                                {trans.isExempt && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-blue-600 rounded mr-2" title="Exempted from Payment">E</span>
                                                )}
                                                <TransactionStatusPill type="app" status={trans.status} label="App Fee" />
                                            </div>
                                            {financialsSettings.docAccessFeeEnabled && (
                                                <TransactionStatusPill type="doc" status={trans.docAccessStatus || 'Unpaid'} label="Doc Fee" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-base text-gray-600 dark:text-gray-400">
                                        {trans.date ? 
                                            new Date(trans.date).toLocaleString('en-GB', {
                                                day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
                                            }).replace(/\//g, '-')
                                            : 'N/A'
                                        }
                                    </td>
                                    <td className="p-4 text-base font-mono text-gray-600 dark:text-gray-400">{trans.serialNumber || 'N/A'}</td>
                                    <td className="p-4 text-base font-mono text-gray-600 dark:text-gray-400">{trans.pin || 'N/A'}</td>
                                    <td className="p-4 no-print">
                                        <div className="flex items-center gap-1">
                                            {canEdit && (
                                                <ActionButton icon="edit" onClick={() => handleOpenModal('edit', trans)} title="Edit Transaction" colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>
                                            )}
                                            {canRegen && (
                                                <ActionButton icon="autorenew" onClick={() => handleOpenModal('regenerate', trans)} title="Regenerate Credentials" colorClass="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"/>
                                            )}
                                            {canDelete && (
                                                <ActionButton icon="delete" onClick={() => handleOpenModal('delete', trans)} title="Reset Payment" colorClass="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"/>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 border-t border-logip-border dark:border-dark-border flex items-center justify-between no-print">
                     <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalItems={sortedTransactions.length}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startItem={startItem}
                        endItem={endItem}
                    />
                </div>
            </div>
            
            {/* Modals */}
             {modalState.mode === 'edit' && modalState.transaction && (
                <AdminModal isOpen={true} onClose={handleCloseModal} title={`Edit Transaction for ${modalState.transaction.studentName}`}>
                    <EditTransactionForm 
                        transaction={modalState.transaction} 
                        onSave={handleSaveTransaction} 
                        onCancel={handleCloseModal} 
                        admission={selectedAdmission}
                        docAccessEnabled={financialsSettings.docAccessFeeEnabled}
                    />
                </AdminModal>
            )}

            {modalState.mode === 'regenerate' && (
                <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleRegenerateCredentials} title="Regenerate Credentials">
                    Are you sure you want to regenerate the Serial Number and PIN for <strong>{modalState.transaction?.studentName}</strong>? The old credentials will no longer work.
                </ConfirmationModal>
            )}

            {modalState.mode === 'delete' && (
                <ConfirmationModal isOpen={true} onClose={handleCloseModal} onConfirm={handleResetPayment} title="Reset Payment Status">
                    Are you sure you want to reset the payment for <strong>{modalState.transaction?.studentName}</strong>? Their status will be set to 'Unpaid' and their credentials will be deleted.
                </ConfirmationModal>
            )}
        </div>
    );
};

const EditTransactionForm: React.FC<{ 
    transaction: Transaction; 
    onSave: (data: Partial<Transaction>) => void; 
    onCancel: () => void; 
    admission: Admission;
    docAccessEnabled: boolean;
}> = ({ transaction, onSave, onCancel, admission, docAccessEnabled }) => {
    const [serialNumber, setSerialNumber] = useState((transaction.serialNumber || '').toUpperCase());
    const [pin, setPin] = useState((transaction.pin || '').toUpperCase());
    const [status, setStatus] = useState(transaction.status);
    const [docAccessStatus, setDocAccessStatus] = useState<'Paid' | 'Unpaid'>(transaction.docAccessStatus || 'Unpaid');
    
    const handleGenerateMissing = () => {
        const admissionSettingsKey = `admissionSettings_${admission.schoolId}_${admission.id}`;
        const settingsRaw = localStorage.getItem(admissionSettingsKey);
        const settings: Partial<AdmissionSettings> = settingsRaw ? JSON.parse(settingsRaw) : {};
        
        if (!serialNumber) setSerialNumber(generateCredential(settings.serialNumberLength || 10, settings.serialNumberFormat).toUpperCase());
        if (!pin) setPin(generateCredential(settings.pinLength || 5, settings.pinFormat).toUpperCase());
        if (status === 'Unpaid') setStatus('Paid');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ serialNumber: serialNumber.toUpperCase(), pin: pin.toUpperCase(), status, docAccessStatus });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg border border-logip-border dark:border-dark-border">
                <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-logip-text-header dark:text-dark-text-primary">Student Details</h4>
                    {(!serialNumber || !pin || status === 'Unpaid') && (
                        <button 
                            type="button" 
                            onClick={handleGenerateMissing}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200"
                        >
                            Generate Instantly
                        </button>
                    )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <p className="text-logip-text-header dark:text-dark-text-primary"><span className="text-logip-text-subtle dark:text-dark-text-secondary">Name:</span> {transaction.studentName}</p>
                    <p className="text-logip-text-header dark:text-dark-text-primary"><span className="text-logip-text-subtle dark:text-dark-text-secondary">Index No:</span> {transaction.indexNumber}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Application Fee Status</label>
                    <AdminSelect value={status} onChange={e => setStatus(e.target.value as 'Paid' | 'Unpaid')}>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                    </AdminSelect>
                </div>
                {docAccessEnabled && (
                    <div>
                        <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Doc Access Fee Status</label>
                        <AdminSelect value={docAccessStatus} onChange={e => setDocAccessStatus(e.target.value as 'Paid' | 'Unpaid')}>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </AdminSelect>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">Serial Number</label>
                <AdminInput value={serialNumber} onChange={e => setSerialNumber(e.target.value.toUpperCase())} placeholder="Serial Number" className="uppercase placeholder:normal-case" />
            </div>
            <div>
                <label className="block text-sm font-bold text-logip-text-header dark:text-dark-text-primary mb-2">PIN</label>
                <AdminInput value={pin} onChange={e => setPin(e.target.value.toUpperCase())} placeholder="PIN" className="uppercase placeholder:normal-case" />
            </div>
            <div className="pt-4 flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-base font-semibold rounded-lg bg-logip-primary text-white hover:opacity-90">Save Changes</button>
            </div>
        </form>
    );
};

export default TransactionsPage;