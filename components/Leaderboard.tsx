import React from 'react';
import { ScoreEntry } from '../types';

interface LeaderboardProps {
  scores: ScoreEntry[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ scores }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg w-full max-w-md">
      <h2 className="text-xl text-emerald-400 font-arcade mb-4 tracking-widest text-center uppercase border-b border-slate-700 pb-2">
        High Scores
      </h2>
      
      {scores.length === 0 ? (
        <div className="text-slate-500 text-center py-4 italic">No scores yet. Be the first!</div>
      ) : (
        <ul className="space-y-3">
          {scores.map((entry, index) => (
            <li key={index} className="flex justify-between items-center text-sm bg-slate-700/30 p-2 rounded hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center space-x-3">
                <span className={`
                  flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs
                  ${index === 0 ? 'bg-yellow-500 text-yellow-900' : 
                    index === 1 ? 'bg-slate-300 text-slate-900' : 
                    index === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-600 text-slate-300'}
                `}>
                  {index + 1}
                </span>
                <span className="text-slate-300">{entry.date}</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-lg">{entry.score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Leaderboard;