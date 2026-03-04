import React, { useEffect, useRef } from 'react';
import { SimulatedSite, FormField } from '../types';
import { Globe, Lock, RotateCw } from 'lucide-react';

interface SimulatedBrowserProps {
  site: SimulatedSite;
  currentFields: FormField[];
  onFieldChange: (fieldId: string, value: string | boolean) => void;
  onSubmit: () => void;
  setHtmlContent: (html: string) => void;
}

export const SimulatedBrowser: React.FC<SimulatedBrowserProps> = ({ 
  site, 
  currentFields, 
  onFieldChange, 
  onSubmit,
  setHtmlContent
}) => {
  const formRef = useRef<HTMLDivElement>(null);

  // Expose the "DOM" to the parent whenever it updates so the agent can "see" it
  useEffect(() => {
    if (formRef.current) {
      // We strip out React specific attributes to make it cleaner for the LLM
      // and ensure we are passing a string representation of the form structure.
      const cleanHtml = formRef.current.innerHTML.replace(/data-reactroot=""/g, '');
      // Wrap in a simplified structure for context
      const fullContent = `
        <h1>${site.name}</h1>
        <p>${site.description}</p>
        <form id="main-form">
          ${cleanHtml}
        </form>
      `;
      setHtmlContent(fullContent);
    }
  }, [site, currentFields, setHtmlContent]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
      {/* Browser Bar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center space-x-2">
        <div className="flex space-x-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 bg-white rounded-lg border border-gray-300 px-3 py-1.5 text-sm flex items-center text-gray-600 font-mono shadow-sm">
          <Lock className="w-3 h-3 mr-2 text-green-600" />
          <span className="truncate">{site.url}</span>
        </div>
        <button className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500">
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Website Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-6 h-6 text-blue-600" />
              {site.name}
            </h1>
            <p className="text-gray-500 mt-1">{site.description}</p>
          </div>

          <div ref={formRef} className="space-y-5">
            {currentFields.map((field) => (
              <div key={field.id} className="flex flex-col space-y-1.5">
                <label 
                  htmlFor={field.id} 
                  className="text-sm font-semibold text-gray-700 flex items-center"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow min-h-[100px] text-gray-800"
                    placeholder={field.placeholder}
                    value={field.value as string}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                  />
                ) : field.type === 'select' ? (
                  <select
                    id={field.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    value={field.value as string}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                  >
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="checkbox"
                      id={field.id}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={field.value as boolean}
                      onChange={(e) => onFieldChange(field.id, e.target.checked)}
                    />
                    <span className="text-sm text-gray-600">{field.label} (Click to toggle)</span>
                  </div>
                ) : (
                  <input
                    type={field.type}
                    id={field.id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-gray-800"
                    placeholder={field.placeholder}
                    value={field.value as string}
                    onChange={(e) => onFieldChange(field.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            <div className="pt-4">
              <button
                id="submit-button"
                onClick={onSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md active:transform active:scale-95"
              >
                {site.submitButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
