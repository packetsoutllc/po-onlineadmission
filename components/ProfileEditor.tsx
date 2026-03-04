import React from 'react';
import { UserProfile } from '../types';
import { User, CreditCard, MapPin, Briefcase } from 'lucide-react';

interface ProfileEditorProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onChange }) => {
  const handleChange = (key: keyof UserProfile, value: string) => {
    onChange({ ...profile, [key]: value });
  };

  return (
    <div className="bg-agent-800 border-t border-agent-700 p-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <User className="w-4 h-4 text-agent-400" />
        Active Persona
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase">Full Name</label>
          <input
            type="text"
            className="w-full bg-agent-900 border border-agent-700 rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-agent-500 transition-colors"
            value={profile.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase">Email</label>
          <input
            type="text"
            className="w-full bg-agent-900 border border-agent-700 rounded px-2 py-1 text-gray-200 focus:outline-none focus:border-agent-500 transition-colors"
            value={profile.email}
            onChange={(e) => handleChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase">Job Title</label>
          <div className="flex items-center bg-agent-900 border border-agent-700 rounded px-2">
            <Briefcase className="w-3 h-3 text-gray-500 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent py-1 text-gray-200 focus:outline-none"
              value={profile.jobTitle}
              onChange={(e) => handleChange('jobTitle', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase">City</label>
          <div className="flex items-center bg-agent-900 border border-agent-700 rounded px-2">
             <MapPin className="w-3 h-3 text-gray-500 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent py-1 text-gray-200 focus:outline-none"
              value={profile.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-gray-400 text-xs uppercase">Credit Card (Mock)</label>
          <div className="flex items-center bg-agent-900 border border-agent-700 rounded px-2">
            <CreditCard className="w-3 h-3 text-gray-500 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent py-1 text-gray-200 focus:outline-none font-mono"
              value={profile.creditCard}
              onChange={(e) => handleChange('creditCard', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};