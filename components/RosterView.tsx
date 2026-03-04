
import React, { useState } from 'react';
import { Staff, ScheduleEntry, ShiftType, Role } from '../types';
import { SHIFT_COLORS } from '../constants';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Loader2, Filter, AlertTriangle, Calendar as CalendarIcon, Save } from 'lucide-react';
import { generateRosterWithAI } from '../services/geminiService';

interface RosterViewProps {
  staff: Staff[];
  schedule: ScheduleEntry[];
  onUpdateSchedule: (newSchedule: ScheduleEntry[]) => void;
  currentUserRole?: Role;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RosterView: React.FC<RosterViewProps> = ({ staff, schedule, onUpdateSchedule, currentUserRole }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<Role | 'All'>('All');

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayShifts = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return schedule.filter(s => s.date === dateStr);
  };

  const handleAIAutoFill = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const newEntries = await generateRosterWithAI(staff, year, month, schedule);
      const filteredNew = newEntries.filter(n => 
        !schedule.some(s => s.date === n.date && s.staffId === n.staffId)
      );
      onUpdateSchedule([...schedule, ...filteredNew]);
    } catch (err) {
        setErrorMsg("AI Generation failed. Please check connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddShift = (staffId: string, shiftType: ShiftType, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const newEntry: ScheduleEntry = {
      id: crypto.randomUUID(),
      staffId,
      date: dateStr,
      shiftType,
      synced: false
    };
    onUpdateSchedule([...schedule, newEntry]);
    setSelectedDay(null);
  };

  const handleRemoveShift = (entryId: string) => {
    onUpdateSchedule(schedule.filter(s => s.id !== entryId));
  };

  const filteredStaff = filterRole === 'All' ? staff : staff.filter(s => s.role === filterRole);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm gap-6">
        <div className="flex items-center gap-6">
           <div className="bg-slate-50 p-2 rounded-xl flex items-center border border-slate-200">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
               <ChevronLeft size={20} />
             </button>
             <h2 className="text-lg font-bold text-slate-800 w-40 text-center flex items-center justify-center gap-2">
               <CalendarIcon size={18} className="text-blue-500" />
               {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
             </h2>
             <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600">
               <ChevronRight size={20} />
             </button>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
             <Filter size={16} />
             <span className="font-medium mr-1">Filter Role:</span>
             <select 
               className="bg-transparent outline-none font-semibold text-slate-800 cursor-pointer"
               // FIX: Cast enum/union type to string to satisfy selection value constraints.
               value={filterRole as string}
               onChange={(e) => setFilterRole(e.target.value as Role | 'All')}
             >
               <option value="All">All Staff</option>
               {Object.values(Role).map(r => (
                 // FIX: Explicitly cast enum values to string for option key and value.
                 <option key={r as string} value={r as string}>{r as string}</option>
               ))}
             </select>
           </div>
        </div>

        <div className="flex gap-3 w-full xl:w-auto">
          {currentUserRole === Role.ADMIN && (
            <button 
              onClick={handleAIAutoFill}
              disabled={isGenerating}
              className="flex-1 xl:flex-none justify-center flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span className="font-medium">AI Auto-Schedule</span>
            </button>
          )}
        </div>
      </div>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2 animate-in slide-in-from-top-2">
           <AlertTriangle size={18} />
           {errorMsg}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
          {DAYS.map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-slate-50/30">
          {/* Empty cells for padding */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/30 border-b border-r border-slate-100" />
          ))}

          {/* Actual Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const allShifts = getDayShifts(day);
            const visibleShifts = filterRole === 'All' 
              ? allShifts 
              : allShifts.filter(s => staff.find(st => st.id === s.staffId)?.role === filterRole);
            
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
              <div 
                key={day} 
                className={`min-h-[120px] p-2 border-b border-r border-slate-100 hover:bg-white transition-colors relative group flex flex-col ${isToday ? 'bg-blue-50/30' : ''}`}
                onClick={() => currentUserRole === Role.ADMIN && setSelectedDay(day)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 group-hover:text-slate-700'}`}>
                    {day}
                  </span>
                  {currentUserRole === Role.ADMIN && (
                    <button 
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-all transform hover:scale-110"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[150px] pr-1 scrollbar-hide">
                  {visibleShifts.map(shift => {
                    const person = staff.find(s => s.id === shift.staffId);
                    if (!person) return null;
                    return (
                      <div 
                        key={shift.id} 
                        className={`text-[11px] p-1.5 rounded-lg border flex justify-between items-center group/shift shadow-sm transition-transform hover:translate-x-0.5 ${SHIFT_COLORS[shift.shiftType]}`}
                        title={`${person.name} - ${shift.shiftType}`}
                      >
                         <div className="flex items-center gap-1.5 overflow-hidden">
                           <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{backgroundColor: person.color}}></div>
                           <span className="truncate font-semibold">{person.name.split(' ').pop()}</span>
                         </div>
                         <div className="flex items-center">
                            <span className="opacity-75 uppercase text-[9px] font-bold tracking-tighter mr-1">{shift.shiftType.substring(0,3)}</span>
                            {currentUserRole === Role.ADMIN && (
                              <button 
                                  onClick={(e) => { e.stopPropagation(); handleRemoveShift(shift.id); }}
                                  className="text-current opacity-0 group-hover/shift:opacity-100 hover:text-red-600 hover:bg-red-50 rounded p-0.5 transition-all"
                              >
                                &times;
                              </button>
                            )}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Shift Modal */}
      {selectedDay !== null && currentUserRole === Role.ADMIN && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                Schedule Duty <span className="text-slate-400 font-normal">| {currentDate.toLocaleString('default', { month: 'short' })} {selectedDay}</span>
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <AlertTriangle className="rotate-45" size={20} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {staff.map(person => (
                <div key={person.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm" style={{backgroundColor: person.color}}>
                        {person.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">{person.name}</p>
                        <p className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1">{person.role as string}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                     {[ShiftType.MORNING, ShiftType.AFTERNOON, ShiftType.NIGHT].map(type => (
                         <button
                            key={type as string}
                            onClick={() => handleAddShift(person.id, type, selectedDay)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[10px] font-bold uppercase transition-all hover:scale-110 hover:shadow-md ${SHIFT_COLORS[type]}`}
                            title={`Assign ${type as string}`}
                         >
                            {(type as string)[0]}
                         </button>
                     ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterView;
