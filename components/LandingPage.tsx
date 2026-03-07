import React from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Select } from './FormControls';
import PacketsOutArrowIcon from './PacketsOutArrowIcon';
import Icon from './admin/shared/Icons';
import { initialSchools, initialAdmissions, School, Admission, type AdmissionPortalStatus } from './admin/pages/SettingsPage';
import PacketsOutLogo from './PacketsOutLogo';

interface LandingPageProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ toggleTheme, isDarkMode }) => {
  const [schools] = useLocalStorage<School[]>('admin_schools', initialSchools);
  const [admissions] = useLocalStorage<Admission[]>('admin_admissions', initialAdmissions);

  const activeSchools = schools.filter((s) => s.status === 'Active');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [regionFilter, setRegionFilter] = React.useState<string>('All regions');

  const regions = React.useMemo(
    () =>
      Array.from(
        new Set(
          activeSchools
            .map((s) => s.homeRegion)
            .filter((r): r is string => !!r)
        )
      ).sort(),
    [activeSchools]
  );

  const filteredSchools = React.useMemo(
    () =>
      activeSchools.filter((school) => {
        const matchesRegion =
          regionFilter === 'All regions' || school.homeRegion === regionFilter;
        const term = searchTerm.trim().toLowerCase();
        if (!term) return matchesRegion;
        const haystack = `${school.name} ${school.homeRegion || ''}`.toLowerCase();
        return matchesRegion && haystack.includes(term);
      }),
    [activeSchools, regionFilter, searchTerm]
  );

  const hasFilter =
    searchTerm.trim().length > 0 || regionFilter !== 'All regions';

  const schoolsWithAdmission = React.useMemo(
    () =>
      filteredSchools.filter((school) =>
        admissions.some((a) => a.schoolId === school.id && a.status === 'Active')
      ),
    [filteredSchools, admissions]
  );

  const getPortalStatus = (a: Admission): AdmissionPortalStatus => {
    if (a.portalStatus) return a.portalStatus;
    return a.status === 'Active' ? 'opened' : 'closed';
  };

  const portalStatusConfig: Record<'opened' | 'closed' | 'yet_to_open', { label: string; className: string }> = {
    opened: { label: 'Admission opened', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' },
    closed: { label: 'Admission Closed', className: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 border-red-200 dark:border-red-500/30' },
    yet_to_open: { label: 'Admission yet to be opened', className: 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-gray-300 dark:border-gray-500/30' },
  };

  const renderedSchools = hasFilter
    ? schoolsWithAdmission.map((school) => {
        const schoolAdmissions = admissions.filter(
          (a) => a.schoolId === school.id && a.status === 'Active'
        );
        const primaryAdmission = schoolAdmissions[0] || null;
        const status = primaryAdmission ? getPortalStatus(primaryAdmission) : 'closed';
        const config = portalStatusConfig[status];
        const canNavigate = status === 'opened';

        return (
          <button
            key={school.id}
            onClick={() => canNavigate && primaryAdmission && navigateToPortal(school, primaryAdmission)}
            className={`w-full text-left group flex items-center gap-3 px-3 py-3 rounded-xl border border-logip-border/70 dark:border-report-border transition-all ${canNavigate ? 'hover:border-logip-primary hover:bg-blue-50/60 dark:hover:border-logip-primary dark:hover:bg-blue-500/10 cursor-pointer' : 'cursor-default opacity-90'}`}
          >
            <div className="w-10 h-10 rounded-lg bg-logip-border/40 dark:bg-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {school.logo ? (
                <img
                  src={school.logo}
                  alt={school.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Icon name="apartment" className="w-5 h-5 text-logip-text-subtle dark:text-dark-text-secondary" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="font-semibold text-sm sm:text-base text-logip-text-header dark:text-dark-text-primary break-words">
                {school.name}
              </p>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-[11px] text-logip-text-subtle/90 dark:text-dark-text-secondary truncate">{primaryAdmission ? primaryAdmission.title : 'No active admission'}</span>
                <span className={`flex-shrink-0 px-2 py-1 rounded-md text-[10px] font-semibold border whitespace-nowrap ${config.className} border-current`}>
                  {config.label}
                </span>
              </div>
            </div>
          </button>
        );
      })
    : null;

  const navigateToPortal = (school: School, admission: Admission | null) => {
    if (!admission) return;
    window.location.href = `/${school.slug}/${admission.slug}`;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-50 dark:from-background-dark dark:via-dark-bg dark:to-report-dark flex flex-col items-center justify-start px-4 pt-8 pb-10">
      <header className="w-full max-w-6xl flex items-center justify-between mb-10">
        <PacketsOutLogo
          size="md"
          className="text-logip-text-header dark:text-dark-text-primary"
          textClassName="font-extrabold"
        />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
          aria-label="Toggle theme"
        >
          <Icon name={isDarkMode ? 'light_mode' : 'dark_mode'} className="w-5 h-5" />
        </button>
      </header>

      <main className="w-full max-w-6xl grid lg:grid-cols-[1.25fr,1.2fr] gap-10 items-start mt-28">
        <section>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-logip-text-header dark:text-dark-text-primary mb-4">
            <span className="block whitespace-nowrap">Seamless Online Admission</span>
            <span className="block whitespace-nowrap">for Senior High Schools.</span>
          </h1>
          <p className="text-sm sm:text-base text-logip-text-body/80 dark:text-dark-text-secondary max-w-xl mb-6">
            A secure and modern online admission system for schools across Ghana.
            Simply search for your school, enter your index number to verify your placement, complete the online admission form, and download your admission documents.
          </p>
          <div className="flex flex-col gap-2 text-xs sm:text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-10">
            <span className="inline-flex items-center gap-1">
              <Icon name="verified_user" className="text-base text-emerald-500" />
              Self-Service System
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="cloud_done" className="text-base text-sky-500" />
              Secure data protection
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="chat" className="text-base text-violet-500" />
              Built-in Live chat support
            </span>
          </div>
        </section>

        <section className="bg-logip-white/90 dark:bg-report-dark/90 border border-logip-border/60 dark:border-report-border rounded-2xl shadow-xl p-5 sm:p-6 lg:p-7 backdrop-blur">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-logip-text-header dark:text-dark-text-primary">
              Select a School
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100 dark:border-blue-500/30">
              {activeSchools.length} active portals
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 min-w-0">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Icon name="search" className="w-4 h-4 flex-shrink-0" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by school or region"
                className="w-full h-10 min-w-0 pl-9 pr-3 py-2 text-sm rounded-lg border border-logip-border dark:border-report-border bg-white dark:bg-dark-bg text-logip-text-header dark:text-dark-text-primary placeholder:text-logip-text-subtle/80 dark:placeholder:text-dark-text-secondary/80 focus:outline-none focus:ring-2 focus:ring-logip-primary/70"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                name="regionFilter"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="All regions">All regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
            {!hasFilter && (
              <div className="text-center text-sm text-logip-text-subtle dark:text-dark-text-secondary py-10 px-4">
                Search for your school by entering your school's <span className="font-semibold">name</span> or selecting your school's <span className="font-semibold">region</span>.
              </div>
            )}

            {renderedSchools}

            {hasFilter && schoolsWithAdmission.length === 0 && (
              <div className="text-center text-sm text-logip-text-subtle dark:text-dark-text-secondary py-8">
                No schools match your filters. Try clearing the search or region.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-full pointer-events-none max-lg:hidden">
        <p className="text-xs text-gray-500/80 dark:text-gray-400/60 flex items-center justify-center gap-1.5">
          Powered by
          <PacketsOutLogo size="sm" className="ml-1 text-gray-700 dark:text-gray-200" />
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

