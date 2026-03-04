import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, ChevronRight, FileText, Sparkles, Loader2 } from 'lucide-react';
import { MOCK_SCHOOLS } from '../constants';
import { reviewAdmissionEssay } from '../services/geminiService';

const AdmissionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const school = MOCK_SCHOOLS.find(s => s.id === id);
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentName: '',
    dob: '',
    gradeApplying: '',
    parentName: '',
    email: '',
    phone: '',
    essay: '',
  });

  // AI Review State
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  if (!school) return <div className="p-10">School not found</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  const handleEssayReview = async () => {
      if (!formData.essay || formData.essay.length < 20) return;
      setIsReviewing(true);
      const feedback = await reviewAdmissionEssay(formData.essay);
      setAiReview(feedback);
      setIsReviewing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Application for {school.name}</h1>
            <p className="text-gray-500 mt-1">Complete the steps below to submit your application.</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between items-center mb-8 px-4 md:px-16 relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 md:mx-16"></div>
            {[1, 2, 3].map((num) => (
                <div key={num} className={`flex flex-col items-center bg-gray-50 px-2 z-10`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${step >= num ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-400 border-gray-300'}`}>
                        {step > num ? <Check className="w-5 h-5" /> : num}
                    </div>
                    <span className="text-xs mt-1 font-medium text-gray-500">
                        {num === 1 ? 'Student' : num === 2 ? 'Parent' : 'Essay'}
                    </span>
                </div>
            ))}
        </div>

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <form onSubmit={handleSubmit} className="p-6 md:p-8">
                
                {/* Step 1: Student Info */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Student Information</h2>
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input required type="text" name="studentName" value={formData.studentName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                    <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade Applying For</label>
                                    <select name="gradeApplying" value={formData.gradeApplying} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                                        <option value="">Select Grade</option>
                                        <option value="K">Kindergarten</option>
                                        <option value="1">Grade 1</option>
                                        <option value="6">Grade 6</option>
                                        <option value="9">Grade 9</option>
                                        <option value="10">Grade 10</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Parent Info */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">Guardian Information</h2>
                         <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                                <input required type="text" name="parentName" value={formData.parentName} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Essay & Documents */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                         <h2 className="text-xl font-semibold text-gray-800 mb-4">Statement of Purpose</h2>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Why do you want to join {school.name}?
                            </label>
                            <textarea 
                                required 
                                name="essay" 
                                rows={8} 
                                value={formData.essay} 
                                onChange={handleChange} 
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none text-sm leading-relaxed"
                                placeholder="Write at least 100 words..."
                            />
                            
                            <div className="mt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleEssayReview}
                                    disabled={isReviewing || formData.essay.length < 20}
                                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                                >
                                    {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Get AI Feedback
                                </button>
                            </div>

                            {aiReview && (
                                <div className="mt-4 bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-gray-800">
                                    <div className="flex items-center gap-2 font-semibold text-indigo-700 mb-2">
                                        <Sparkles className="w-4 h-4" /> AI Suggestion:
                                    </div>
                                    <div className="whitespace-pre-line leading-relaxed">{aiReview}</div>
                                </div>
                            )}
                         </div>

                         <div className="pt-4 border-t border-gray-100">
                             <label className="block text-sm font-medium text-gray-700 mb-2">Previous Report Card</label>
                             <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                         </div>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between">
                    {step > 1 ? (
                        <button type="button" onClick={handleBack} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                            Back
                        </button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button type="button" onClick={handleNext} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2">
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-70">
                             {isSubmitting ? 'Submitting...' : 'Submit Application'}
                             {!isSubmitting && <FileText className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionForm;