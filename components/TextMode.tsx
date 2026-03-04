import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import { Loader2, Send, Wand2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TextMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const result = await generateText(prompt);
      setResponse(result);
    } catch (err) {
      setError("Failed to generate text. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:p-6 gap-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Wand2 size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Text Generation</h2>
          <p className="text-slate-500 text-sm">Ask anything and get instant answers powered by Gemini 2.5 Flash.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
          Your Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Explain quantum computing to a 5-year-old..."
          className="w-full h-32 p-3 text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send size={18} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {response && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-medium text-slate-700">
            Output
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="markdown-body text-slate-800 leading-relaxed">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextMode;