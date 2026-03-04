
import React, { useState, useEffect } from 'react';
import { SimulatedBrowser } from '../../SimulatedBrowser';
import { AgentTerminal } from '../../AgentTerminal';
import { ProfileEditor } from '../../ProfileEditor';
import { UserProfile, SimulatedSite, FormField, AgentLog, AgentStatus } from '../../../types';
import { getAgentInstructions } from '../../../services/geminiService';
import { Sparkles, Layout, Database, Terminal } from 'lucide-react';

const MOCK_SITES: SimulatedSite[] = [
  {
    id: 'admission',
    name: 'Peki SHS Admission Portal',
    url: 'https://peki-shs.edu.gh/admission',
    description: 'The official student registration form for Peki Senior High School.',
    submitButtonText: 'Submit Application',
    fields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true, value: '' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, value: '' },
      { id: 'jobTitle', label: 'Previous Qualification/Title', type: 'text', value: '' },
      { id: 'city', label: 'Current City', type: 'text', value: '' },
      { id: 'terms', label: 'Accept Terms', type: 'checkbox', value: false }
    ]
  },
  {
    id: 'waec',
    name: 'WAEC Result Checker',
    url: 'https://ghana.waecdirect.org/',
    description: 'WAEC Result checking and voucher purchase portal.',
    submitButtonText: 'Check Results',
    fields: [
      { id: 'indexNo', label: 'Index Number', type: 'text', required: true, value: '' },
      { id: 'userEmail', label: 'Confirmation Email', type: 'email', value: '' },
      { id: 'phone', label: 'Phone Number', type: 'tel', value: '' }
    ]
  },
  {
    id: 'vouchers',
    name: 'SwiftServe Vouchers',
    url: 'https://swiftserve.gh/vouchers',
    description: 'Purchase university and security service application vouchers.',
    submitButtonText: 'Pay Now',
    fields: [
      { id: 'buyerName', label: 'Full Name', type: 'text', required: true, value: '' },
      { id: 'buyerEmail', label: 'Email for Voucher', type: 'email', required: true, value: '' },
      { id: 'cardInfo', label: 'Credit Card Number', type: 'text', value: '' }
    ]
  }
];

const AgentPlaygroundPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: 'KWAME NKRUMAH JNR',
    email: 'kwame.jr@example.gh',
    jobTitle: 'Aspiring Engineer',
    city: 'Accra',
    creditCard: '4242 4242 4242 4242'
  });

  const [activeSite, setActiveSite] = useState<SimulatedSite>(MOCK_SITES[0]);
  const [currentFields, setCurrentFields] = useState<FormField[]>(MOCK_SITES[0].fields);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [htmlContent, setHtmlContent] = useState('');

  const addLog = (type: AgentLog['type'], message: string, details?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(),
      details
    }]);
  };

  const handleSiteChange = (siteId: string) => {
    const site = MOCK_SITES.find(s => s.id === siteId);
    if (site) {
      setActiveSite(site);
      setCurrentFields(site.fields);
      setLogs([]);
      setStatus('idle');
    }
  };

  const handleFieldChange = (fieldId: string, value: string | boolean) => {
    setCurrentFields(prev => prev.map(f => f.id === fieldId ? { ...f, value } : f));
  };

  const runAgent = async () => {
    if (status === 'analyzing' || status === 'acting') return;

    setStatus('analyzing');
    setLogs([]);
    addLog('system', 'Agent initialized. Accessing page DOM...');
    
    try {
      addLog('thought', 'Reasoning about the form structure using Gemini Flash 3...');
      
      const instructions = await getAgentInstructions(htmlContent, profile);
      
      addLog('thought', instructions.thoughts);
      setStatus('acting');

      // Fill fields sequentially with a small delay for visual effect
      for (const action of instructions.actions) {
        await new Promise(r => setTimeout(r, 600));
        handleFieldChange(action.fieldId, action.value);
        addLog('action', `Filled ${action.fieldId}`, action.reason);
      }

      if (instructions.submitButtonId) {
        await new Promise(r => setTimeout(r, 1000));
        addLog('action', 'Clicking submit button...');
        // Simulate click
        setStatus('completed');
        addLog('success', 'Form filled and submitted successfully by the autonomous agent.');
      } else {
        setStatus('completed');
        addLog('success', 'Form filled. Manual submission required as no button was identified.');
      }

    } catch (error) {
      console.error(error);
      setStatus('failed');
      addLog('error', 'Agent encountered a reasoning failure.', (error as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-agent-950 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-indigo-600 p-4 flex items-center justify-between text-white shadow-lg z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
             <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Autonomous AI Agent Playground</h1>
            <p className="text-xs text-indigo-100 font-medium">Demonstrating autonomous form filling & online task execution</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold opacity-70">Target Admission</span>
              <span className="text-xs font-mono">ALL_SITES_GENERAL</span>
           </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Configuration & Site Selection */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-agent-800 bg-agent-900 overflow-y-auto no-scrollbar">
           <div className="p-6 space-y-8">
              {/* Site Selection */}
              <section>
                <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Layout className="w-3 h-3" /> Target Environment
                </h3>
                <div className="space-y-2">
                  {MOCK_SITES.map(site => (
                    <button
                      key={site.id}
                      onClick={() => handleSiteChange(site.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all border ${
                        activeSite.id === site.id 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                          : 'bg-agent-800 border-agent-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <p className="font-bold text-sm">{site.name}</p>
                      <p className="text-[10px] opacity-70 truncate mt-0.5">{site.url}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Data Context */}
              <section>
                 <h3 className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Database className="w-3 h-3" /> Data Source Context
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  The agent uses this persona to fulfill form requirements detected in the DOM.
                </p>
                <div className="p-3 bg-black/30 rounded-lg border border-agent-800 font-mono text-[10px] text-indigo-300">
                   {JSON.stringify(profile, null, 2)}
                </div>
              </section>
           </div>
        </div>

        {/* Middle: Browser View */}
        <div className="flex-1 flex flex-col p-6 bg-agent-950 overflow-hidden">
           <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-mono text-gray-400">REMOTE_VIEW_PORT_ACTIVE</span>
              </div>
              <div className="text-[10px] font-mono text-gray-600">RESOLUTION: 1280x800</div>
           </div>
           <div className="flex-1 min-h-0">
              <SimulatedBrowser 
                site={activeSite} 
                currentFields={currentFields}
                onFieldChange={handleFieldChange}
                onSubmit={() => addLog('success', 'Form submitted manually.')}
                setHtmlContent={setHtmlContent}
              />
           </div>
        </div>

        {/* Right: Agent Terminal */}
        <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden">
           <AgentTerminal 
            logs={logs} 
            status={status} 
            onStart={runAgent}
            onStop={() => setStatus('idle')}
           />
        </div>
      </div>

      {/* Profile Editor (Footer style) */}
      <ProfileEditor profile={profile} onChange={setProfile} />
      
      <style>{`
        .bg-agent-950 { background-color: #050508; }
        .bg-agent-900 { background-color: #0a0a0f; }
        .bg-agent-800 { background-color: #12121c; }
        .bg-agent-700 { background-color: #1e1e2d; }
        .border-agent-800 { border-color: #1e1e2d; }
        .border-agent-700 { border-color: #2a2a3d; }
        .text-agent-400 { color: #a0a0c0; }
        .bg-agent-500 { background-color: #6366f1; }
        .terminal-scroll::-webkit-scrollbar { width: 4px; }
        .terminal-scroll::-webkit-scrollbar-thumb { background: #2a2a3d; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default AgentPlaygroundPage;
