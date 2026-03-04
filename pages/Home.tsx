import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Search } from 'lucide-react';
import SchoolCard from '../components/SchoolCard';
import { MOCK_SCHOOLS } from '../constants';

const Home: React.FC = () => {
  const featuredSchools = MOCK_SCHOOLS.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-70"></div>
             {/* Decorative blob */}
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
              Find the <span className="text-primary-600">Perfect School</span> for Your Future
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
              Explore top-rated institutions, get AI-driven recommendations, and manage your applications all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/browse" 
                className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Browse Schools
              </Link>
              <Link 
                to="/dashboard" 
                className="w-full sm:w-auto px-8 py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-primary-600 rounded-lg font-semibold shadow-sm hover:shadow transition-all"
              >
                Check Status
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Verified Schools
                </div>
                <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" /> AI Assistant
                </div>
                <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" /> Instant Updates
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Schools</h2>
                <p className="text-gray-500 mt-2">Top picks for this academic year</p>
            </div>
            <Link to="/browse" className="text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredSchools.map(school => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      </section>

      {/* AI Promo Section */}
      <section className="bg-gray-900 py-16 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1 space-y-6">
                <h2 className="text-3xl font-bold">Unsure where to apply?</h2>
                <p className="text-gray-300 text-lg">
                    Our integrated Gemini AI can analyze your preferences, budget, and academic goals to suggest the best schools for you. It can even review your admission essay!
                </p>
                <Link to="/browse" className="inline-block bg-primary-500 hover:bg-primary-400 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    Try AI Matchmaker
                </Link>
            </div>
            <div className="flex-1 flex justify-center">
                <div className="relative w-full max-w-md aspect-video bg-gray-800 rounded-xl border border-gray-700 shadow-2xl p-6 flex flex-col gap-4">
                    <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold">U</div>
                        <div className="bg-gray-700 rounded-lg rounded-tl-none p-3 text-sm text-gray-200">I want a school with strong robotics and swimming, under $30k.</div>
                    </div>
                    <div className="flex gap-3 items-start self-end">
                         <div className="bg-primary-900/50 border border-primary-500/30 rounded-lg rounded-tr-none p-3 text-sm text-gray-200">
                            Based on that, I recommend <strong>Future Leaders Prep</strong> and <strong>Sunshine Valley Public</strong>. Would you like to see their robotics curriculum?
                        </div>
                        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold">AI</div>
                    </div>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
};

export default Home;