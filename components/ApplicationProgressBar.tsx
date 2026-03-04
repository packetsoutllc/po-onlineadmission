import React, { useMemo } from 'react';

interface ApplicationProgressBarProps {
  currentPage: string;
  hasDisability: boolean;
  isApplicationSubmitted: boolean;
  hasOtherInfoData: boolean;
  enableRoomManagement: boolean;
}

const ApplicationProgressBar: React.FC<ApplicationProgressBarProps> = ({ currentPage, hasDisability, isApplicationSubmitted, hasOtherInfoData, enableRoomManagement }) => {
  const allSectionsRaw = useMemo(() => [
    { id: 'personal_info', name: 'Personal Info', weight: 15, color: 'bg-blue-500' },
    { id: 'academic_info', name: 'Aca Info', weight: 15, color: 'bg-cyan-400' },
    { id: 'housing', name: 'Housing', weight: 5, color: 'bg-lime-500' },
    { id: 'dorm_allocation', name: 'Dorm/Room', weight: 5, color: 'bg-sky-500' },
    { id: 'other_info', name: 'Other Info', weight: 10, color: 'bg-blue-600' },
    { id: 'parents_info', name: 'Parents Info', weight: 10, color: 'bg-teal-500' },
    { id: 'documents', name: 'Adm Doc', weight: 5, color: 'bg-amber-500' },
    { id: 'submit', name: 'Submission', weight: 5, color: 'bg-orange-500' },
    { id: 'admission_docs', name: 'Adm Doc', weight: 5, color: 'bg-pink-500' }
  ], []);

  const sections = useMemo(() => {
    const visibleSections = allSectionsRaw.filter(section => {
        if (section.id === 'documents' && !hasDisability) return false;
        if (section.id === 'other_info' && isApplicationSubmitted && !hasOtherInfoData) return false;
        if (section.id === 'admission_docs' && !isApplicationSubmitted) return false;
        if (section.id === 'dorm_allocation' && !enableRoomManagement) return false;
        return true;
    });

    const totalWeight = visibleSections.reduce((sum, section) => sum + section.weight, 0);
    if (totalWeight === 0) return [];

    return visibleSections.map(section => ({
        ...section,
        percentage: (section.weight / totalWeight) * 100,
    }));
  }, [allSectionsRaw, hasDisability, isApplicationSubmitted, hasOtherInfoData, enableRoomManagement]);

  const activePageIndex = sections.findIndex(section => section.id === currentPage);
  const currentPageIndex = activePageIndex === -1 ? (isApplicationSubmitted ? sections.length - 1 : 0) : activePageIndex;

  let totalCompleteWeight = sections
    .slice(0, currentPageIndex + 1)
    .reduce((acc, section) => acc + section.weight, 0);

  // If on the submit page but not yet submitted, don't count the 'submit' step as complete.
  if (currentPage === 'submit' && !isApplicationSubmitted) {
      totalCompleteWeight -= sections[currentPageIndex]?.weight || 0;
  }
  
  const totalPossibleWeight = sections.reduce((acc, section) => acc + section.weight, 0);
  const totalCompletePercentage = totalPossibleWeight > 0 ? (totalCompleteWeight / totalPossibleWeight) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-sm text-black dark:text-gray-100">Application Progress</span>
        <span className="font-semibold text-sm text-black dark:text-gray-100">{Math.round(totalCompletePercentage)}%</span>
      </div>

      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3.5 flex overflow-hidden">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`${index <= currentPageIndex ? section.color : 'bg-transparent'} h-full transition-all duration-700 ease-out`}
              style={{ width: `${section.percentage}%` }}
              role="progressbar"
              aria-valuenow={index <= currentPageIndex ? section.percentage : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${section.name} progress`}
            ></div>
          ))}
        </div>
        
        {(() => {
          let cumulativePercentage = 0;
          return sections.slice(0, -1).map((section, index) => {
            cumulativePercentage += section.percentage;
            const isDividerActive = index < currentPageIndex;
            return (
              <div
                key={`divider-${index}`}
                className={`absolute top-full mt-0.5 h-2 border-l-2 border-dotted ${isDividerActive ? 'border-gray-400 dark:border-gray-500' : 'border-gray-300 dark:border-gray-600'} transition-colors duration-700`}
                style={{ left: `${cumulativePercentage}%` }}
                aria-hidden="true"
              ></div>
            );
          });
        })()}
      </div>
      
      <div className="flex w-full mt-4 h-4">
        {sections.map((section, index) => {
            const isComplete = index <= currentPageIndex;
            let cumulativePercentage = 0;
            for (let i = 0; i < index; i++) {
                cumulativePercentage += sections[i].percentage;
            }
            const centerPosition = cumulativePercentage + (section.percentage / 2);

            return (
                <div 
                    key={index} 
                    className="absolute"
                    style={{ left: `${centerPosition}%`, transform: 'translateX(-50%)', width: `${section.percentage}%` }}
                >
                    <p className={`text-[10px] text-center truncate transition-colors duration-700 ${isComplete ? 'font-bold text-black dark:text-gray-100' : 'font-medium text-black dark:text-gray-500'}`} title={section.name}>{section.name}</p>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default ApplicationProgressBar;