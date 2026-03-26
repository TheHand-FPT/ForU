import React from 'react';
import { Shield, Info } from 'lucide-react';
import { Level } from '../types';

interface HeaderProps {
  lives: number;
  money: number;
  wave: number;
  showGraph: boolean;
  setShowGraph: (show: boolean) => void;
  levels: Level[];
  currentLevelIdx: number;
  setCurrentLevelIdx: (idx: number) => void;
  setEnemyCount: React.Dispatch<React.SetStateAction<number>>;
}

export function Header({
  lives,
  money,
  wave,
  showGraph,
  setShowGraph,
  levels,
  currentLevelIdx,
  setCurrentLevelIdx,
  setEnemyCount
}: HeaderProps) {
  return (
    <div className="w-full max-w-5xl flex justify-between items-end mb-8 border-b border-[#3b82f633] pb-4">
      <div>
        <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none glow-text text-white flex items-center gap-3">
          <Shield className="text-blue-500" size={32} />
          MAZE DEFENDER <span className="text-blue-500/50 text-xl font-mono not-italic">v3.0</span>
        </h1>
        <p className="text-[10px] opacity-60 mt-2 uppercase tracking-[0.3em] text-[#3b82f6]">Labyrinth Protocol Active // Node Integrity: {lives > 5 ? 'STABLE' : 'CRITICAL'}</p>
        <div className="flex items-center gap-2 mt-3 text-blue-400/80">
          <Info size={14} />
          <span className="text-[10px] uppercase tracking-widest font-mono italic">Strategy: Place towers on walls to defend the labyrinth path.</span>
        </div>
      </div>
      <div className="flex gap-8 text-right">
        <div>
          <p className="text-[10px] opacity-50 uppercase tracking-widest">Capital</p>
          <p className="text-2xl font-bold text-[#10b981]">${money}</p>
        </div>
        <div>
          <p className="text-[10px] opacity-50 uppercase tracking-widest">Integrity</p>
          <p className="text-2xl font-bold text-[#ef4444]">{lives}</p>
        </div>
        <div>
          <p className="text-[10px] opacity-50 uppercase tracking-widest">Sequence</p>
          <p className="text-2xl font-bold text-[#3b82f6]">#{wave}</p>
        </div>
        <div className="flex flex-col gap-1">
          <button 
            onClick={() => {
              setShowGraph(!showGraph);
              // Force a re-render to update the graph display
              setEnemyCount(prev => prev);
            }}
            className={`px-4 py-1 border border-[#3b82f666] text-[10px] font-bold uppercase transition-all ${showGraph ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-[#3b82f6] hover:bg-[#3b82f622]'}`}
          >
            Graph Mode
          </button>
          <div className="flex gap-1">
            {levels.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setCurrentLevelIdx(i)}
                className={`w-6 h-6 border border-[#3b82f666] text-[10px] font-bold flex items-center justify-center transition-all ${currentLevelIdx === i ? 'bg-[#3b82f6] text-white' : 'text-[#3b82f6] hover:bg-[#3b82f622]'}`}
              >
                {l.id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
