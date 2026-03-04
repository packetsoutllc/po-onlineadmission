
import React, { useState } from 'react';
import { Staff, Role } from '../types';
import { ROLE_COLORS } from '../constants';
import { UserPlus, Trash2, Shield, Mail, Briefcase, Clock, X } from 'lucide-react';

interface StaffManagerProps {
  staff: Staff[];
  onAddStaff: (staff: Staff) => void;
  onRemoveStaff: (id: string) => void;
  isAdmin: boolean;
}

const StaffManager: React.FC<StaffManagerProps> = ({ staff, onAddStaff, onRemoveStaff, isAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    role: Role.NURSE,
    color: '#3b82f6',
    qualifications: [],
    maxHoursPerWeek: 40
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaff.name && newStaff.email) {
      onAddStaff({
        id: crypto.randomUUID(),
        name: newStaff.name,
        role: newStaff.role as Role,
        email: newStaff.email,
        color: newStaff.color || '#3b82f6',
        qualifications: newStaff.qualifications || [],
        maxHoursPerWeek: Number(newStaff.maxHoursPerWeek) || 40
      });
      setIsAdding(false);
      setNewStaff({ role: Role.NURSE, color: '#3b82f6', maxHoursPerWeek: 40 });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Staff Directory</h2>
          <p className="text-slate-500 mt-1">Manage personnel, roles, and qualifications.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:translate-y-[-2px]"
          >
            <UserPlus size={18} />
            <span className="font-medium">Add Member</span>
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl relative animate-in zoom-in-95 duration-200">
          <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
          <h3 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <UserPlus size={18} />
            </div>
            New Team Member
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Full Name</label>
              <input
                required
                type="text"
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={newStaff.name || ''}
                onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="e.g. Dr. Jane Smith"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <input
                required
                type="email"
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={newStaff.email || ''}
                onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="jane@hospital.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Role</label>
              <div className="relative">
                <select
                  className="w-full border border-slate-200 rounded-xl p-3 appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  // FIX: Explicitly cast enum value to string to satisfy type constraints.
                  value={newStaff.role as string}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value as Role })}
                >
                  {Object.values(Role).map(role => (
                    // FIX: Explicitly cast enum values to string for option key and value.
                    <option key={role as string} value={role as string}>{role as string}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-500">
                  <Briefcase size={16} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Max Hours/Week</label>
              <input
                type="number"
                className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={newStaff.maxHoursPerWeek}
                onChange={e => setNewStaff({ ...newStaff, maxHoursPerWeek: parseInt(e.target.value) })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-medium transition-all"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {staff.map(person => (
          <div key={person.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
            
            {/* Decorative bg blob */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg`} style={{ backgroundColor: person.color }}>
                  {person.name.charAt(0)}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onRemoveStaff(person.id)}
                    className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                    title="Remove Staff"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-lg text-slate-900 leading-tight mb-1">{person.name}</h3>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md border ${ROLE_COLORS[person.role]}`}>
                  {person.role}
                </span>
              </div>
              
              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{person.email}</span>
                </div>
                 <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 p-2 rounded-lg">
                  <Clock size={16} className="text-slate-400" />
                  <span>Max: {person.maxHoursPerWeek}hrs/wk</span>
                </div>
              </div>

              {person.qualifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {person.qualifications.map(q => (
                    <span key={q} className="text-[10px] font-semibold bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 shadow-sm">
                      {q}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffManager;
