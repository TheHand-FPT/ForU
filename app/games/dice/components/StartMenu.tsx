import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GRID_SIZE } from '../constants';

interface StartMenuProps {
  gameStarted: boolean;
  menuStep: 'level' | 'rolls';
  level: 1 | 2;
  setLevel: (l: 1 | 2) => void;
  setMenuStep: (s: 'level' | 'rolls') => void;
  onStart: (rolls: number) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ 
  gameStarted, menuStep, level, setLevel, setMenuStep, onStart 
}) => {
  return (
    <AnimatePresence>
      {!gameStarted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6"
        >
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-black uppercase tracking-tighter">Bot Chase</h1>
              <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Survival Strategy Game</p>
            </div>

            <div className="bg-zinc-50 p-8 rounded-3xl border border-black/5 space-y-6">
              {menuStep === 'level' ? (
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-40 block text-left">Select Level</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => { setLevel(1); setMenuStep('rolls'); }}
                      className="p-6 bg-white border border-black/10 rounded-2xl hover:border-black transition-colors group"
                    >
                      <div className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform">1</div>
                      <div className="text-[10px] font-bold uppercase opacity-40">1 Bot</div>
                    </button>
                    <button
                      onClick={() => { setLevel(2); setMenuStep('rolls'); }}
                      className="p-6 bg-white border border-black/10 rounded-2xl hover:border-black transition-colors group"
                    >
                      <div className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform">2</div>
                      <div className="text-[10px] font-bold uppercase opacity-40">2 Bots + Weapons</div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-40 block text-left">Set Target Rolls</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[10, 20, 30, 50].map((num) => (
                        <button
                          key={num}
                          onClick={() => onStart(num)}
                          className="py-4 bg-white border border-black/10 rounded-xl font-bold hover:border-black transition-all"
                        >
                          {num} Rolls
                        </button>
                      ))}
                    </div>
                    <div className="pt-2">
                      <label className="text-[10px] font-bold uppercase opacity-40 block text-left mb-2">Or Custom Amount</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          id="custom-rolls"
                          placeholder="Enter rolls..."
                          className="flex-1 px-4 py-3 bg-white border border-black/10 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                        <button
                          onClick={() => {
                            const val = parseInt((document.getElementById('custom-rolls') as HTMLInputElement).value) || 20;
                            onStart(val);
                          }}
                          className="px-6 py-3 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setMenuStep('level')}
                    className="w-full py-4 border border-black/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/5"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
