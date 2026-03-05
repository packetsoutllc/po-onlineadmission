import React from 'react';
import { SortConfig } from '../../hooks/useSortableData';
import Icon from './Icons';

interface SortableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  sortConfig: SortConfig | null;
  requestSort: (key: string) => void;
  className?: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  children,
  sortKey,
  sortConfig,
  requestSort,
  className = 'p-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider',
}) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  const getIcon = () => {
    if (!isSorted) {
      return 'unfold_more';
    }
    return direction === 'ascending' ? 'expand_less' : 'expand_more';
  };
  
  const baseClassName = 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-colors select-none';

  return (
    <th className={`${className} ${baseClassName}`} onClick={() => requestSort(sortKey)}>
      <div className="flex items-center gap-1">
        {children}
        <Icon name={getIcon()} className="w-4 h-4 no-print" />
      </div>
    </th>
  );
};

export default SortableHeader;
