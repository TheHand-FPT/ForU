import React from 'react';
import { Play, Activity } from 'lucide-react';
import { TOWER_TYPES } from '../constants';
import { Point } from '../types';

interface SidebarControlsProps {
  isWaveActive: boolean;
  enemyCount: number;
  startWave: () => void;
  selectedTowerType: keyof typeof TOWER_TYPES;
  setSelectedTowerType: (type: keyof typeof TOWER_TYPES) => void;
  currentPathLength: number;
}

export function SidebarControls({
  isWaveActive,
  enemyCount,
  startWave,
  selectedTowerType,
  setSelectedTowerType,
  currentPathLength
}: SidebarControlsProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Wave Control */}
      <button
        onClick={startWave}
        disabled={isWaveActive && enemyCount > 0}
        className={`w-full py-6 flex items-center justify-center gap-3 font-bold uppercase tracking-widest transition-all rounded-lg
          ${isWaveActive && enemyCount > 0 
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
            : 'bg-[#3b82f6] text-white hover:bg-[#2563eb] active:translate-y-1 shadow-[0_0_20px_rgba(59,130,246,0.2)]'}`}
      >
        <Play size={24} fill="currentColor" />
        {isWaveActive && enemyCount > 0 ? 'Processing...' : 'Execute Wave'}
      </button>

      {/* Tower Selection */}
      <div className="space-y-3">
        <p className="text-[10px] opacity-50 uppercase font-bold tracking-[0.2em] text-[#3b82f6]">Available Nodes</p>
        {(Object.entries(TOWER_TYPES) as [keyof typeof TOWER_TYPES, typeof TOWER_TYPES.basic][]).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setSelectedTowerType(type)}
            className={`w-full p-4 border transition-all flex justify-between items-center rounded-lg
              ${selectedTowerType === type 
                ? 'bg-[#3b82f622] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                : 'bg-[#141414] border-transparent opacity-60 hover:opacity-100 hover:border-[#3b82f633]'}`}
          >
            <div>
              <p className="font-bold uppercase text-xs tracking-wider">{type} node</p>
              <p className="text-[9px] opacity-50 mt-1">DMG: {config.damage} | RNG: {config.range}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#10b981]">${config.cost}</p>
              <div className="w-2 h-2 rounded-full ml-auto mt-1 shadow-[0_0_8px_currentColor]" style={{ backgroundColor: config.color, color: config.color }} />
            </div>
          </button>
        ))}
      </div>

      {/* Info Panel */}
      <div className="mt-auto p-4 border border-[#3b82f622] bg-[#141414] rounded-lg text-[11px] space-y-2">
        <div className="flex items-center gap-2 font-bold uppercase mb-2 text-[#3b82f6]">
          <Activity size={14} />
          <span className="tracking-widest">Graph Metrics</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40 uppercase text-[9px]">Algorithm:</span>
          <span className="text-[#3b82f6]">A* (Manhattan)</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40 uppercase text-[9px]">Path Length:</span>
          <span>{currentPathLength} nodes</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40 uppercase text-[9px]">Active Entities:</span>
          <span className={enemyCount > 0 ? 'text-[#ef4444]' : ''}>{enemyCount}</span>
        </div>
        <div className="pt-2 border-t border-[#3b82f611] text-[9px] leading-relaxed opacity-40 uppercase tracking-tight">
          Enemies dynamically recalculate the shortest path to the red goal node using the A* algorithm. Placing towers modifies the graph topology.
        </div>
      </div>
    </div>
  );
}
