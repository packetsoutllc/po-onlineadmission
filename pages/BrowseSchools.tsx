import React, { useState } from 'react';
import { Search, Filter, Sparkles, X } from 'lucide-react';
import SchoolCard from '../components/SchoolCard';
import { MOCK_SCHOOLS } from '../constants';
import { getSchoolRecommendations } from '../services/geminiService';

const BrowseSchools: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState(MOCK_SCHOOLS);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  
  // Basic local filter
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (!term) {
        setSchools(MOCK_SCHOOLS);
        setAiExplanation(null);
        return;
    }
    
    const filtered = MOCK_SCHOOLS.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.location.toLowerCase().includes(term) ||
      s.type.toLowerCase().includes(term)
    );
    setSchools(filtered);
  };

  // AI Matcher
  const handleAiMatch = async () => {
    if (!searchTerm.trim()) return;
    setIsAiLoading(true);
    setAiExplanation(null);

    const { recommendations, explanation } = await getSchoolRecommendations(searchTerm, MOCK_SCHOOLS);
    
    if (recommendations.length > 0) {
        const matchedSchools = MOCK_SCHOOLS.filter(s => recommendations.includes(s.id));
        setSchools(matchedSchools);
    } else {
        // If AI fails to return IDs, just keep current view or show all
        // But we show the explanation
    }
    
    setAiExplanation(explanation);
    setIsAiLoading(false);
  };

  const resetFilters = () => {
      setSearchTerm('');
      setSchools(MOCK_SCHOOLS);
      setAiExplanation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Schools</h1>
          <p className="text-gray-500 mt-2">Discover institutions that match your academic goals.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, location, or describe what you want (e.g., 'Cheap IB school with sports')..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleAiMatch}
                    disabled={isAiLoading || !searchTerm}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all text-white shadow-sm 
                        ${isAiLoading || !searchTerm ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow'}`}
                >
                    {isAiLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Sparkles className="w-5 h-5" />
                    )}
                    AI Match
                </button>
                {(searchTerm || aiExplanation) && (
                     <button 
                        onClick={resetFilters}
                        className="px-4 py-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>
          </div>
          
          {/* AI Explanation Box */}
          {aiExplanation && (
              <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                      <h4 className="text-sm font-bold text-indigo-900 mb-1">Gemini Recommendation</h4>
                      <p className="text-sm text-indigo-800 leading-relaxed">{aiExplanation}</p>
                  </div>
                  <button onClick={() => setAiExplanation(null)} className="ml-auto text-indigo-400 hover:text-indigo-600">
                      <X className="w-4 h-4" />
                  </button>
              </div>
          )}
        </div>

        {/* Grid */}
        {schools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schools.map(school => (
                <SchoolCard key={school.id} school={school} />
            ))}
            </div>
        ) : (
            <div className="text-center py-20">
                <div className="bg-gray-100 inline-flex p-4 rounded-full mb-4">
                    <Filter className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No schools found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search terms.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default BrowseSchools;