import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dice1 } from 'lucide-react';
import { DiceIcon } from './DiceIcon';

interface FullscreenDiceProps {
  show: boolean;
  animationValue: number | null;
}

export const FullscreenDice: React.FC<FullscreenDiceProps> = ({ show, animationValue }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ y: 400, rotate: -720, scale: 0.2 }}
            animate={{ 
              y: [400, -100, 0], 
              rotate: [0, 360, 720, 1080],
              scale: [0.2, 1.5, 1]
            }}
            transition={{ 
              duration: 1.2,
              times: [0, 0.6, 1],
              ease: "easeOut"
            }}
            className="w-40 h-40 bg-white rounded-3xl shadow-2xl flex items-center justify-center border-4 border-black"
          >
            <AnimatePresence mode="wait">
              {!animationValue ? (
                <motion.div
                  key="rolling"
                  animate={{ rotate: [0, 90, 180, 270, 360] }}
                  transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                  className="text-black"
                >
                  <Dice1 size={80} />
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-black"
                >
                  <DiceIcon value={animationValue} size={80} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
