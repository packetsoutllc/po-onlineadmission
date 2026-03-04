import React, { useEffect, useRef } from 'react';
import { AgentLog, AgentStatus } from '../types';
import { Play, Square, Terminal as TerminalIcon, Cpu, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AgentTerminalProps {
  logs: AgentLog[];
  status: AgentStatus;
  onStart: () => void;
  onStop: () => void;
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({ logs, status, onStart, onStop }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const isRunning = status === 'analyzing' || status === 'acting';

  return (
    <div className="flex flex-col h-full bg-agent-900 border-l border-agent-700 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-agent-700 flex items-center justify-between bg-agent-800">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <h2 className="font-mono font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-agent-400" />
            AGENT_CONTROLLER
          </h2>
        </div>
        <div className="flex space-x-2">
           {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center space-x-1 px-3 py-1.5 bg-agent-500 hover:bg-blue-600 text-white text-xs font-bold rounded uppercase tracking-wider transition-all"
            >
              <Play className="w-3 h-3" />
              <span>Initialize</span>
            </button>
           ) : (
            <button
              onClick={onStop}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider transition-all"
            >
              <Square className="w-3 h-3" />
              <span>Halt</span>
            </button>
           )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-black/30 px-4 py-2 flex items-center space-x-4 text-xs font-mono text-agent-400 border-b border-agent-700">
        <span className="uppercase">Status:</span>
        <span className={`font-bold ${
          status === 'analyzing' ? 'text-yellow-400' :
          status === 'acting' ? 'text-blue-400' :
          status === 'completed' ? 'text-green-400' :
          status === 'failed' ? 'text-red-400' : 'text-gray-400'
        }`}>
          {status === 'idle' ? 'STANDBY' : status.toUpperCase()}
          {status === 'analyzing' && '...'}
        </span>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm terminal-scroll bg-agent-900">
        {logs.length === 0 && (
          <div className="text-gray-500 italic text-center mt-10 opacity-50">
            <TerminalIcon className="w-12 h-12 mx-auto mb-2" />
            <p>System ready. Awaiting initialization command.</p>
          </div>
        )}
        
        {logs.map((log) => (
          <div key={log.id} className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="mt-1 flex-shrink-0">
               {log.type === 'thought' && <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />}
               {log.type === 'action' && <TerminalIcon className="w-4 h-4 text-blue-400" />}
               {log.type === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
               {log.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
               {log.type === 'system' && <Cpu className="w-4 h-4 text-gray-500" />}
            </div>
            <div className="flex-1 overflow-hidden break-words">
              <div className="flex items-baseline justify-between mb-1">
                <span className={`text-xs font-bold uppercase tracking-wide ${
                  log.type === 'thought' ? 'text-yellow-500' :
                  log.type === 'action' ? 'text-blue-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-500' : 'text-gray-500'
                }`}>
                  {log.type}
                </span>
                <span className="text-[10px] text-gray-600">
                  {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className={`whitespace-pre-wrap leading-relaxed ${
                log.type === 'thought' ? 'text-gray-300 italic' :
                log.type === 'error' ? 'text-red-300' :
                'text-gray-200'
              }`}>
                {log.message}
              </p>
              {log.details && (
                <div className="mt-2 p-2 bg-black/40 rounded border border-agent-700 text-xs text-agent-400 font-mono overflow-x-auto">
                  {log.details}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};