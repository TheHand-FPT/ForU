import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

export function GameOverOverlay() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0a] text-[#e0e0e0] flex flex-col items-center justify-center p-8 text-center z-30">
      <motion.h2 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-6xl font-black italic mb-4 glow-text text-[#ef4444]"
      >
        SYSTEM FAILURE
      </motion.h2>
      <p className="mb-8 opacity-70 uppercase tracking-widest text-xs">The graph has been compromised. All nodes offline.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-4 bg-[#3b82f6] text-white font-bold uppercase tracking-widest hover:bg-[#2563eb] transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2"
      >
        <RotateCcw size={20} /> Re-Initialize
      </button>
    </div>
  );
}
