
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface GameOverProps {
  isGameOver: boolean;
  finalScore: number;
  onRestart: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({ isGameOver, finalScore, onRestart }) => {
  return (
    <AnimatePresence>
      {isGameOver && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm text-white p-8"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="text-center space-y-8 max-w-md w-full"
          >
            <h1 className="text-7xl font-bold tracking-tighter uppercase leading-none">
              System<br />Failure
            </h1>
            
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Final Score</p>
              <p className="text-6xl font-bold tracking-tighter italic">
                {finalScore.toString().padStart(6, '0')}
              </p>
            </div>

            <button
              onClick={onRestart}
              className="w-full py-4 bg-white text-black text-sm uppercase tracking-widest font-bold hover:invert transition-all rounded-none"
            >
              Re-Initialize Protocol
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
