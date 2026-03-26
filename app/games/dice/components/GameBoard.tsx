import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, Crosshair, Zap, User } from 'lucide-react';
import { Position, Item } from '../types';
import { GRID_SIZE, TILE_SIZE } from '../constants';

interface GameBoardProps {
  walkableTiles: Position[];
  reachableTiles: Position[];
  playerPos: Position;
  botPos: Position;
  bot2Pos: Position | null;
  items: Item[];
  onTileClick: (pos: Position) => void;
  inventory: any[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  walkableTiles, reachableTiles, playerPos, botPos, bot2Pos, items, onTileClick, inventory
}) => {
  return (
    <div className="relative bg-white p-2 rounded-xl border border-black/10 shadow-2xl">
      <div 
        className="grid gap-1" 
        style={{ 
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${TILE_SIZE}px)`
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          const isWalkable = walkableTiles.some(w => w.x === x && w.y === y);
          const isReachable = reachableTiles.some(r => r.x === x && r.y === y);
          const isPlayer = playerPos.x === x && playerPos.y === y;
          const isBot = botPos.x === x && botPos.y === y;
          const item = items.find(it => it.pos.x === x && it.pos.y === y);

          return (
            <div
              key={i}
              onClick={() => isReachable && onTileClick({ x, y })}
              className={`
                tile w-full h-full rounded-sm flex items-center justify-center relative
                ${isWalkable ? 'tile-walkable' : 'opacity-10'}
                ${isReachable ? 'tile-highlight cursor-pointer hover:bg-black/20' : ''}
              `}
            >
              {item && !isPlayer && !isBot && (
                <div className={`
                  ${(item.type === 'plus2' || item.type === 'plus3') ? 'text-green-500' : ''}
                  ${(item.type === 'minus2' || item.type === 'minus5') ? 'text-red-500' : ''}
                  ${item.type === 'shield' ? 'text-blue-500' : ''}
                  ${item.type === 'extraRoll' ? 'text-amber-500' : ''}
                `}>
                  {item.type === 'shield' && <Shield size={14} fill="currentColor" fillOpacity={0.2} />}
                  {item.type === 'extraRoll' && <Zap size={14} fill="currentColor" fillOpacity={0.2} />}
                  {item.type === 'sword' && <div className="text-pink-500"><Sword size={14} /></div>}
                  {item.type === 'gun' && <div className="text-purple-500"><Crosshair size={14} /></div>}
                  {item.type === 'plus2' && <div className="text-[10px] font-bold">+2</div>}
                  {item.type === 'plus3' && <div className="text-[10px] font-bold">+3</div>}
                  {item.type === 'minus2' && <div className="text-[10px] font-bold">-2</div>}
                  {item.type === 'minus5' && <div className="text-[10px] font-bold">-5</div>}
                </div>
              )}
              {isPlayer && (
                <motion.div 
                  layoutId="player"
                  className="player-token w-6 h-6 z-20 flex items-center justify-center"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <User size={16} />
                  {inventory.length > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="absolute -top-2 -right-2 w-4 h-4 bg-black text-white rounded-full flex items-center justify-center border border-white"
                    >
                      {inventory[0].type === 'shield' && <Shield size={10} />}
                      {inventory[0].type === 'sword' && <Sword size={10} />}
                      {inventory[0].type === 'gun' && <Crosshair size={10} />}
                    </motion.div>
                  )}
                </motion.div>
              )}
              {isBot && (
                <motion.div 
                  layoutId="bot"
                  className="bot-token w-5 h-5 z-10"
                  style={{ backgroundColor: 'white' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {bot2Pos && bot2Pos.x === x && bot2Pos.y === y && (
                <motion.div 
                  layoutId="bot2"
                  className="bot-token w-5 h-5 z-10"
                  style={{ backgroundColor: '#dc2626' }} // red-600
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              {isReachable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1 h-1 bg-black/30 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
