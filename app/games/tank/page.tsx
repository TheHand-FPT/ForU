"use client";

import React, { useState } from 'react';
import { Game } from './game/Game';
import { GameOver } from './components/GameOver';

export default function App() {
  const [gameKey, setGameKey] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setIsGameOver(true);
  };

  const restartGame = () => {
    setGameKey(prev => prev + 1);
    setIsGameOver(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f4] text-[#0a0a0a] font-sans selection:bg-black selection:text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <Game key={gameKey} onGameOver={handleGameOver} />

      <GameOver 
        isGameOver={isGameOver} 
        finalScore={finalScore} 
        onRestart={restartGame} 
      />

      {/* Global Grain/Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
}
