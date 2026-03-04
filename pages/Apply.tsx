
import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SCHOOLS } from '../constants';
import { improveEssay } from '../services/geminiService';
import { Sparkles, Save, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { AIResponse } from '../types';

const Apply: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const school = SCHOOLS.find((s) => s.id === id);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gpa: '',
    personalStatement: ''
  });

  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAIImprovement = async () => {
    if (!school) return;
    setError(null);
    setIsAnalyzing(true);
    setAiResponse(null);

    try {
      const response = await improveEssay(formData.personalStatement, school.name);
      setAiResponse(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze essay.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAcceptAI = () => {
    if (aiResponse) {
      setFormData(prev => ({ ...prev, personalStatement: aiResponse.improvedText }));
      setAiResponse(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
        setIsSubmitting(false);
        setSuccess(true);
    }, 1500);
  };

  if (!school) {
    return <div className="p-8 text-center">School not found.</div>;
  }

  if (success) {
      return (
          <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                  <p className="text-gray-600 mb-8">
                      Your application to <span className="font-semibold text-gray-900">{school.name}</span> has been received successfully.
                  </p>
                  <button 
                    onClick={() => navigate('/')}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                      Return Home
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Schools
        </button>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 px-8 py-6 text-white flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Application for Admission</h1>
              <p className="text-blue-100 mt-1">{school.name}</p>
            </div>
            <img 
                src={school.image} 
                alt="School Logo" 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
            />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Personal Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current GPA</label>
                  <input
                    type="number"
                    name="gpa"
                    step="0.01"
                    min="0"
                    max="4.0"
                    required
                    value={formData.gpa}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  />
                </div>
              </div>
            </div>

            {/* Essay Section with AI */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-gray-900">Personal Statement</h2>
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Assistant Enabled
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-600 mb-4">
                <strong>Prompt:</strong> Why do you want to attend {school.name} and how will you contribute to our community?
              </div>

              <div className="relative">
                <textarea
                  name="personalStatement"
                  rows={8}
                  required
                  value={formData.personalStatement}
                  onChange={handleInputChange}
                  placeholder="Draft your essay here..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border resize-y"
                />
                
                <div className="mt-3 flex justify-end">
                    <button
                        type="button"
                        onClick={handleAIImprovement}
                        disabled={isAnalyzing || formData.personalStatement.length < 20}
                        className={`
                            inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                            ${isAnalyzing || formData.personalStatement.length < 20 ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                            transition-colors
                        `}
                    >
                        {isAnalyzing ? (
                            <>
                                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="-ml-1 mr-2 h-4 w-4" />
                                Improve with AI
                            </>
                        )}
                    </button>
                </div>
              </div>

              {/* AI Response Area */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {aiResponse && (
                <div className="mt-6 bg-indigo-50 rounded-xl p-6 border border-indigo-100 animate-fade-in">
                  <h3 className="font-semibold text-indigo-900 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2 text-indigo-600" />
                    AI Suggestions
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Feedback</h4>
                    <p className="text-sm text-indigo-800 italic">"{aiResponse.feedback}"</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1">Improved Version</h4>
                    <div className="bg-white p-4 rounded-md border border-indigo-200 text-sm text-gray-800 whitespace-pre-wrap">
                        {aiResponse.improvedText}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleAcceptAI}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Replace My Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => setAiResponse(null)}
                        className="flex-1 bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Discard Suggestions
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="pt-6 border-t flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                {!isSubmitting && <Save className="ml-2 -mr-1 h-5 w-5" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Apply;
