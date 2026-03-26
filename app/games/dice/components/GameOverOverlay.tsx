import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';

interface GameOverOverlayProps {
  gameOver: boolean;
  message: string;
  onReset: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({ gameOver, message, onReset }) => {
  return (
    <AnimatePresence>
      {gameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            className="text-center"
          >
            <h2 className={`text-6xl md:text-8xl font-black mb-4 tracking-tighter ${message.includes('WIN') ? 'text-green-400' : 'text-red-500'}`}>
              {message.includes('WIN') ? 'YOU WIN' : 'GAME OVER'}
            </h2>
            <p className="text-white/60 text-lg mb-12 font-medium max-w-md mx-auto">
              {message}
            </p>
            
            <button
              onClick={onReset}
              className="group relative px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="relative z-10 flex items-center gap-3">
                <RotateCcw size={20} />
                Play Again
              </div>
              <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
