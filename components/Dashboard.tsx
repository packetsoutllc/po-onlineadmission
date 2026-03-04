import React from 'react';
import { AppState, ShiftType, Role } from '../types';
import { Users, Calendar, Activity, Clock, Sun, Moon, Coffee, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS_CHART = ['#3b82f6', '#f97316', '#6366f1', '#f43f5e'];

interface DashboardProps {
  state: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const { staff, schedule, currentUser } = state;
  const totalStaff = staff.length;
  
  // Stats Calculation
  const shiftsByType = schedule.reduce((acc, curr) => {
    acc[curr.shiftType] = (acc[curr.shiftType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { name: 'Morning', value: shiftsByType[ShiftType.MORNING] || 0 },
    { name: 'Afternoon', value: shiftsByType[ShiftType.AFTERNOON] || 0 },
    { name: 'Night', value: shiftsByType[ShiftType.NIGHT] || 0 },
    { name: 'On Call', value: shiftsByType[ShiftType.ON_CALL] || 0 },
  ].filter(d => d.value > 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = schedule.filter(s => s.date === todayStr);

  // My Upcoming Shifts
  const myShifts = currentUser 
    ? schedule
        .filter(s => s.staffId === currentUser.id && new Date(s.date) >= new Date(todayStr))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3)
    : [];

  const getShiftIcon = (type: ShiftType) => {
    switch (type) {
      case ShiftType.MORNING: return <Sun size={18} className="text-sky-500" />;
      case ShiftType.AFTERNOON: return <Coffee size={18} className="text-orange-500" />;
      case ShiftType.NIGHT: return <Moon size={18} className="text-indigo-500" />;
      default: return <Activity size={18} className="text-rose-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {currentUser?.name}</h2>
          <p className="text-blue-100 max-w-xl">
            You have {state.unsyncedChanges} unsynced changes. 
            {state.unsyncedChanges > 0 ? " Connect to internet to sync." : " System is up to date."}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Staff', value: totalStaff, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Scheduled Shifts', value: schedule.length, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Today', value: todayShifts.length, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Pending Sync', value: state.unsyncedChanges, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Today's Roster */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                  Today's Active Staff
                </h3>
                <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
             </div>

             {todayShifts.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Coffee size={32} className="mb-2 opacity-50" />
                  <p>No shifts scheduled for today.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {todayShifts.map(shift => {
                   const person = staff.find(p => p.id === shift.staffId);
                   if (!person) return null;
                   return (
                     <div key={shift.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm group-hover:scale-105 transition-transform" style={{backgroundColor: person.color}}>
                             {person.name.charAt(0)}
                           </div>
                           <div>
                             <p className="font-bold text-slate-800">{person.name}</p>
                             <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">{person.role}</span>
                                {shift.shiftType === ShiftType.ON_CALL && (
                                   <span className="text-[10px] flex items-center gap-1 text-rose-500 font-bold uppercase tracking-wider">
                                     <AlertCircle size={10} /> Urgent
                                   </span>
                                )}
                             </div>
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                             shift.shiftType === 'Morning' ? 'bg-sky-50 text-sky-700' : 
                             shift.shiftType === 'Afternoon' ? 'bg-orange-50 text-orange-700' : 
                             'bg-indigo-50 text-indigo-700'
                          }`}>
                            {getShiftIcon(shift.shiftType)}
                            {shift.shiftType}
                          </span>
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>

        {/* Side Column */}
        <div className="space-y-8">
          
          {/* My Upcoming Shifts */}
          {myShifts.length > 0 && (
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">My Upcoming Shifts</h3>
                <div className="space-y-3 relative z-10">
                   {myShifts.map((shift, i) => (
                      <div key={shift.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                         <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${i === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white border border-slate-200 text-slate-600'}`}>
                            <span className="text-xs font-bold uppercase">{new Date(shift.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(shift.date).getDate()}</span>
                         </div>
                         <div>
                            <p className="font-semibold text-slate-900">{shift.shiftType} Shift</p>
                            <p className="text-xs text-slate-500">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {/* Stats Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Shift Distribution</h3>
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="grid grid-cols-2 gap-2 mt-2">
                {chartData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-slate-600">
                     <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS_CHART[i % COLORS_CHART.length]}} />
                     <span>{d.name} ({d.value})</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
