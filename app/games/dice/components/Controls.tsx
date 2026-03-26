import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Cpu, Shield, Sword, Crosshair, ChevronRight } from 'lucide-react';
import { DiceIcon } from './DiceIcon';
import { ActiveItem } from '../types';

interface ControlsProps {
  turn: 'player' | 'bot' | 'bot2';
  inventory: ActiveItem[];
  extraRolls: number;
  rollCount: number;
  targetRolls: number;
  message: string;
  diceValue: number | null;
  isRolling: boolean;
  isMoving: boolean;
  gameOver: boolean;
  onRoll: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  turn, inventory, extraRolls, rollCount, targetRolls, message, diceValue, isRolling, isMoving, gameOver, onRoll
}) => {
  return (
    <div className="w-full max-w-xs flex flex-col gap-6">
      <div className="bg-zinc-50 p-6 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className={`flex flex-col gap-1 ${turn === 'player' ? 'text-black' : 'text-zinc-400'}`}>
            <div className="flex items-center gap-2">
              <User size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Player</span>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {inventory.map((item, idx) => (
                <div key={idx} className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                  item.type === 'shield' ? 'text-blue-500 border-blue-100 bg-blue-50' :
                  item.type === 'sword' ? 'text-pink-500 border-pink-100 bg-pink-50' :
                  item.type === 'gun' ? 'text-purple-500 border-purple-100 bg-purple-50' : ''
                } ${idx === 0 ? 'ring-1 ring-black/10' : 'opacity-60 scale-90'}`}>
                  {item.type === 'shield' && <Shield size={12} />}
                  {item.type === 'sword' && <Sword size={12} />}
                  {item.type === 'gun' && <Crosshair size={12} />}
                  <span className="text-[10px] font-bold">{item.turns}</span>
                </div>
              ))}
              {extraRolls > 0 && <div className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">+{extraRolls} Roll</div>}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Rolls</span>
            <span className="text-sm font-mono font-bold">{rollCount} / {targetRolls}</span>
          </div>
          <div className={`flex items-center gap-2 ${turn === 'bot' ? 'text-black' : 'text-zinc-400'}`}>
            <Cpu size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Bot</span>
          </div>
        </div>

        <div className="h-12 flex items-center justify-center mb-6">
          <p className="text-sm text-center font-medium leading-tight opacity-80 italic">
            {message}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={diceValue || 'rolling'}
              initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
              className="w-20 h-20 dice-face"
            >
              {isRolling ? (
                <motion.div
                  animate={{ rotate: [0, 90, 180, 270, 360] }}
                  transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                >
                  <DiceIcon value={1} size={40} />
                </motion.div>
              ) : (
                diceValue ? <DiceIcon value={diceValue} size={40} /> : <div className="w-4 h-4 bg-zinc-800 rounded-full opacity-20" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={onRoll}
          disabled={turn !== 'player' || isRolling || isMoving || diceValue !== null || gameOver}
          className={`
            w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all
            ${(turn === 'player' && !isRolling && !isMoving && diceValue === null && !gameOver)
              ? 'bg-black text-white hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}
          `}
        >
          <span className="font-bold uppercase tracking-widest text-sm">Roll Dice</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-2 opacity-40 text-[10px] uppercase tracking-[0.2em] font-medium">
        <div className="flex justify-between">
          <span>Grid System</span>
          <span>10x10 Matrix</span>
        </div>
        <div className="flex justify-between">
          <span>AI Logic</span>
          <span>BFS Shortest Path</span>
        </div>
        <div className="flex justify-between">
          <span>Visual Style</span>
          <span>Minimal Light</span>
        </div>
      </div>
    </div>
  );
};
