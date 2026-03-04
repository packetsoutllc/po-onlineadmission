import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, BookOpen, DollarSign, ArrowLeft, CheckCircle } from 'lucide-react';
import { MOCK_SCHOOLS } from '../constants';

const SchoolDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const school = MOCK_SCHOOLS.find(s => s.id === id);

  if (!school) {
    return <div className="p-10 text-center">School not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header Image */}
      <div className="h-64 md:h-80 w-full relative">
        <img src={school.image} alt={school.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute top-6 left-4 md:left-8 z-10">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all"
            >
                <ArrowLeft className="w-5 h-5" /> Back
            </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 md:p-8 text-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{school.name}</h1>
                        <div className="flex items-center gap-4 text-sm md:text-base text-gray-200">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {school.location}</span>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" /> {school.rating} Rating</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium">{school.type}</span>
                         <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium">{school.curriculum}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">About the School</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        {school.description}
                    </p>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {school.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-gray-700 p-3 bg-gray-50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Academic Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 border border-gray-100 rounded-lg">
                            <Users className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                            <div className="text-sm text-gray-500">Grades</div>
                            <div className="font-semibold text-gray-900">{school.grades}</div>
                        </div>
                        <div className="text-center p-4 border border-gray-100 rounded-lg">
                            <BookOpen className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                            <div className="text-sm text-gray-500">Curriculum</div>
                            <div className="font-semibold text-gray-900">{school.curriculum}</div>
                        </div>
                        <div className="text-center p-4 border border-gray-100 rounded-lg">
                            <DollarSign className="w-8 h-8 text-primary-500 mx-auto mb-2" />
                            <div className="text-sm text-gray-500">Annual Tuition</div>
                            <div className="font-semibold text-gray-900">
                                {school.tuition === 0 ? 'Free' : `$${school.tuition.toLocaleString()}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Admissions Open</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Applications for the upcoming academic year are closing soon. Secure your spot today.
                    </p>
                    
                    <div className="space-y-3">
                        <Link 
                            to={`/apply/${school.id}`}
                            className="block w-full bg-primary-600 hover:bg-primary-700 text-white text-center font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                            Apply Now
                        </Link>
                        <button className="block w-full bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-600 text-gray-700 font-medium py-3 rounded-lg transition-all">
                            Download Brochure
                        </button>
                        <button className="block w-full bg-white border border-gray-300 hover:border-primary-500 hover:text-primary-600 text-gray-700 font-medium py-3 rounded-lg transition-all">
                            Schedule Tour
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Need help applying?</h4>
                        <p className="text-xs text-gray-500">
                            Use our AI assistant in the bottom right corner to ask questions about admission requirements.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetail;