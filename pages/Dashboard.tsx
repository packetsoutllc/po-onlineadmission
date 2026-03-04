import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock Applications
  const applications = [
    { id: 1, schoolName: 'Evergreen International Academy', status: 'Under Review', date: '2023-10-24', color: 'text-yellow-600 bg-yellow-50' },
    { id: 2, schoolName: 'TechHorizon Charter School', status: 'Accepted', date: '2023-10-10', color: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
            <Link to="/browse" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Apply to New School
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium mb-1">Total Applications</div>
                <div className="text-3xl font-bold text-gray-900">2</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium mb-1">Accepted</div>
                <div className="text-3xl font-bold text-green-600">1</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="text-gray-500 text-sm font-medium mb-1">Pending Actions</div>
                <div className="text-3xl font-bold text-yellow-600">0</div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">Recent Activity</h3>
                <div className="text-sm text-primary-600 cursor-pointer hover:underline">View History</div>
            </div>
            <div className="divide-y divide-gray-100">
                {applications.map(app => (
                    <div key={app.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${app.status === 'Accepted' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                {app.status === 'Accepted' ? <CheckCircle className="w-6 h-6 text-green-600" /> : <Clock className="w-6 h-6 text-yellow-600" />}
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">{app.schoolName}</h4>
                                <p className="text-sm text-gray-500">Submitted on {app.date}</p>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${app.color}`}>
                            {app.status}
                        </div>
                    </div>
                ))}
                
                {applications.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
                        <p className="text-gray-500 mt-2 mb-6">Start exploring schools to submit your first application.</p>
                        <Link to="/browse" className="text-primary-600 font-medium hover:underline">
                            Browse Schools &rarr;
                        </Link>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
                <h4 className="text-blue-900 font-semibold mb-1">Tip from EduBot</h4>
                <p className="text-blue-800 text-sm">
                    Did you know you can improve your admission chances by submitting a strong personal essay? 
                    Use our AI assistant in the application form to get real-time feedback on your writing!
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;