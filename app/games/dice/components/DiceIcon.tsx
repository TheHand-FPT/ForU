import React from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

export const DiceIcon = ({ value, size = 32 }: { value: number; size?: number }) => {
  switch (value) {
    case 1: return <Dice1 size={size} />;
    case 2: return <Dice2 size={size} />;
    case 3: return <Dice3 size={size} />;
    case 4: return <Dice4 size={size} />;
    case 5: return <Dice5 size={size} />;
    case 6: return <Dice6 size={size} />;
    default: return <Dice1 size={size} />;
  }
};
