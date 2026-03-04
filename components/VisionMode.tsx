import React, { useState, useRef } from 'react';
import { analyzeImage, fileToGenerativePart } from '../services/geminiService';
import { Image as ImageIcon, Upload, Loader2, X, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const VisionMode: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Please select an image under 5MB.");
        return;
      }
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setResult(''); // Clear previous result
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setResult('');

    try {
      const base64Data = await fileToGenerativePart(selectedImage);
      const analysisPrompt = prompt.trim() || "Describe this image in detail.";
      
      const text = await analyzeImage(base64Data, selectedImage.type, analysisPrompt);
      setResult(text);
    } catch (error) {
      console.error(error);
      setResult("Error processing image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6 gap-6">
       <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
          <Eye size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Vision Analysis</h2>
          <p className="text-slate-500 text-sm">Upload an image and ask Gemini to analyze, describe, or extract text from it.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* Left Column: Input */}
        <div className="flex flex-col gap-4">
          {/* Drop area / Image Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px] flex flex-col">
            {!imagePreview ? (
              <div 
                className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 m-4 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="bg-purple-50 p-4 rounded-full mb-4">
                  <Upload size={32} className="text-purple-600" />
                </div>
                <p className="text-slate-900 font-medium">Click to upload image</p>
                <p className="text-slate-500 text-sm mt-1">PNG, JPG, WEBP up to 5MB</p>
              </div>
            ) : (
              <div className="relative flex-1 bg-slate-900 flex items-center justify-center">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-[400px] w-full object-contain"
                />
                <button 
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Prompt Input */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Prompt (Optional)</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., What ingredients do I need to cook this?"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 text-sm"
            />
            <button
              onClick={handleAnalyze}
              disabled={!selectedImage || isLoading}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ImageIcon size={18} />
                  Analyze Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[400px]">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-medium text-slate-700">
            Analysis Result
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {result ? (
               <div className="markdown-body text-slate-800 leading-relaxed">
               <ReactMarkdown>{result}</ReactMarkdown>
             </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ImageIcon size={48} className="mb-4 opacity-20" />
                <p>Upload an image to see the analysis here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisionMode;