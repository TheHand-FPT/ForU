
import React from 'react';

interface GameHudProps {
  score: number;
}

export const GameHud: React.FC<GameHudProps> = ({ score }) => {
  return (
    <div className="w-full max-w-[672px] flex justify-center mb-2">
      <div className="text-6xl font-black tracking-tighter leading-none">
        {score.toString().padStart(6, '0')}
      </div>
    </div>
  );
};
