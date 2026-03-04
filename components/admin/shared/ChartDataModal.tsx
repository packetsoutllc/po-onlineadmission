
import React from 'react';
import AdminModal from './AdminModal';
import { AdminStudent } from '../pages/StudentsPage';

interface ChartDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  students: AdminStudent[];
}

const ChartDataModal: React.FC<ChartDataModalProps> = ({ isOpen, onClose, title, students }) => {
  if (!isOpen) return null;

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="max-h-96 overflow-y-auto no-scrollbar -mx-4 px-4">
        {students.length > 0 ? (
          <ul className="divide-y divide-logip-border dark:divide-dark-border">
            {students.map(s => (
                <li key={s.id} className="py-3 flex justify-between items-center">
                    <div>
                        <p className="font-semibold text-logip-text-header dark:text-dark-text-primary">{s.name}</p>
                        <p className="text-sm text-logip-text-subtle font-mono">{s.indexNumber}</p>
                    </div>
                    <p className="text-sm text-logip-text-body dark:text-dark-text-secondary">{s.programme}</p>
                </li>
            ))}
          </ul>
        ) : <p className="text-center py-8 text-logip-text-subtle">No students to display for this period.</p>}
      </div>
      <div className="pt-6 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-base font-semibold rounded-lg border border-logip-border dark:border-dark-border text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">Close</button>
      </div>
    </AdminModal>
  );
};

export default ChartDataModal;
