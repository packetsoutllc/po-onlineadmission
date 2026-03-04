import React from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { initialSchools, initialAdmissions, School, Admission } from './admin/pages/SettingsPage';

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

  const renderedSchools = hasFilter
    ? filteredSchools.map((school) => {
        const schoolAdmissions = admissions.filter(
          (a) => a.schoolId === school.id && a.status === 'Active'
        );
        const primaryAdmission = schoolAdmissions[0] || null;

        return (
          <button
            key={school.id}
            onClick={() => navigateToPortal(school, primaryAdmission)}
            className="w-full text-left group flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-logip-border/70 dark:border-report-border hover:border-logip-primary hover:bg-blue-50/60 dark:hover:border-logip-primary dark:hover:bg-blue-500/10 transition-all"
            disabled={!primaryAdmission}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-logip-border/40 dark:bg-dark-border flex items-center justify-center overflow-hidden flex-shrink-0">
                {school.logo ? (
                  <img
                    src={school.logo}
                    alt={school.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <span className="material-symbols-outlined text-xl text-logip-text-subtle dark:text-dark-text-secondary">
                    apartment
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base text-logip-text-header dark:text-dark-text-primary truncate">
                  {school.name}
                </p>
                <p className="text-[11px] text-logip-text-subtle/90 dark:text-dark-text-secondary truncate">
                  {school.homeRegion || 'Region not set'}
                </p>
                <p className="text-[11px] text-logip-text-subtle/90 dark:text-dark-text-secondary truncate">
                  {primaryAdmission ? primaryAdmission.title : 'No active admission'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {primaryAdmission ? (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  Open portal
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Coming soon
                </span>
              )}
              <span className="material-symbols-outlined text-xl text-logip-text-subtle group-hover:text-logip-primary dark:text-dark-text-secondary">
                arrow_forward_ios
              </span>
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
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5">
            <div className="w-2 h-6 bg-logip-text-header dark:bg-gray-100 rounded-full"></div>
            <div className="w-2 h-4 bg-logip-text-header dark:bg-gray-100 rounded-full"></div>
            <svg
              className="w-5 h-5 text-sky-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 11L10.5 4H21L13.5 11H3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.5 11L21 4V14L13.5 21V11Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 11L13.5 11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-logip-text-header dark:text-dark-text-primary tracking-tight">
              Packets Out
            </p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 dark:text-gray-300 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>
      </header>

      <main className="w-full max-w-6xl grid lg:grid-cols-[1.25fr,1.2fr] gap-10 items-start mt-28">
        <section>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live admissions platform
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-logip-text-header dark:text-dark-text-primary mb-4">
            <span className="block whitespace-nowrap">Seamless Online Admissions</span>
            <span className="block whitespace-nowrap">for Senior High Schools.</span>
          </h1>
          <p className="text-base sm:text-lg text-logip-text-body/80 dark:text-dark-text-secondary max-w-xl mb-6">
            Secure, modern online admission portals for schools across Ghana.
            Choose your school to verify placement, complete forms, and download admission documents.
          </p>
          <div className="flex flex-col gap-2 text-xs sm:text-sm text-logip-text-subtle dark:text-dark-text-secondary mb-10">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-emerald-500">verified_user</span>
              Secure student verification
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-sky-500">cloud_done</span>
              Cloud-based records
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-violet-500">chat</span>
              Built-in support connect
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
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <span className="material-symbols-outlined text-base">search</span>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by school or region"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-logip-border dark:border-report-border bg-white dark:bg-dark-bg text-logip-text-header dark:text-dark-text-primary placeholder:text-logip-text-subtle/80 dark:placeholder:text-dark-text-secondary/80 focus:outline-none focus:ring-2 focus:ring-logip-primary/70"
              />
            </div>
            <div>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 text-sm rounded-lg border border-logip-border dark:border-report-border bg-white dark:bg-dark-bg text-logip-text-header dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-logip-primary/70"
              >
                <option value="All regions">All regions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
            {!hasFilter && (
              <div className="text-center text-sm text-logip-text-subtle dark:text-dark-text-secondary py-10 px-4">
                Search for your school by entering your school's <span className="font-semibold">name</span> or selecting your school's <span className="font-semibold">region</span>.
              </div>
            )}

            {renderedSchools}

            {hasFilter && filteredSchools.length === 0 && (
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
          <span className="inline-flex items-center gap-0.5">
            <span className="w-1.5 h-4 bg-current rounded-full opacity-80" />
            <span className="w-1.5 h-3 bg-current rounded-full opacity-80" />
            <svg className="w-3.5 h-3.5 text-sky-500" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M3 11L10.5 4H21L13.5 11H3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.5 11L21 4V14L13.5 21V11Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 11L13.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Packets Out
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

