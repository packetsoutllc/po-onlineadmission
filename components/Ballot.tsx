import React, { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_CANDIDATES } from '../services/mockData';
import { Candidate } from '../types';

interface BallotProps {
  onVoteComplete: () => void;
}

const Ballot: React.FC<BallotProps> = ({ onVoteComplete }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group candidates by position
  const positions = Array.from(new Set(MOCK_CANDIDATES.map(c => c.position)));

  const handleVote = () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    
    // Simulate network request
    setTimeout(() => {
        setIsSubmitting(false);
        onVoteComplete();
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto pt-24 pb-12 px-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Cast Your Vote</h2>
        <p className="text-slate-400">Select your preferred candidate. This action cannot be undone.</p>
      </div>

      <div className="space-y-12">
        {positions.map((position) => (
          <div key={position}>
            <h3 className="text-xl font-bold text-cyan-400 mb-4 border-b border-slate-700 pb-2 uppercase tracking-wider">
              {position}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_CANDIDATES.filter(c => c.position === position).map((candidate) => (
                <div 
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate.id)}
                  className={`
                    relative group cursor-pointer rounded-2xl p-4 transition-all duration-300 border
                    ${selectedCandidate === candidate.id 
                      ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/20 transform scale-[1.02]' 
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
                  `}
                >
                  <div className="absolute top-4 right-4">
                    {selectedCandidate === candidate.id && (
                        <CheckCircle2 className="w-6 h-6 text-cyan-400 animate-bounce" />
                    )}
                  </div>
                  
                  <div className="aspect-square w-full rounded-xl overflow-hidden mb-4 bg-slate-900">
                    <img 
                      src={candidate.photoUrl} 
                      alt={candidate.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  <h4 className="text-lg font-bold text-white mb-1">{candidate.name}</h4>
                  <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                    "{candidate.manifestoShort}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Footer for Action */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-lg border-t border-slate-700 p-4 z-40">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="text-slate-300 text-sm hidden sm:block">
                {selectedCandidate ? (
                    <span className="text-cyan-400 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Candidate selected
                    </span>
                ) : (
                    <span className="text-slate-500 flex items-center gap-2">
                         <AlertCircle className="w-4 h-4" />
                         Please select a candidate
                    </span>
                )}
            </div>
            <button
                disabled={!selectedCandidate || isSubmitting}
                onClick={handleVote}
                className={`
                    px-8 py-3 rounded-xl font-bold text-slate-900 transition-all duration-300
                    ${selectedCandidate 
                        ? 'bg-cyan-400 hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                        : 'bg-slate-700 cursor-not-allowed opacity-50'}
                `}
            >
                {isSubmitting ? 'Securing Vote...' : 'SUBMIT VOTE'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Ballot;