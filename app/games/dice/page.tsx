/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, 
  RotateCcw, User, Cpu, ChevronRight, Gift, 
  Shield, Plus, Minus, Zap, Sword, Crosshair,
  Clock
} from 'lucide-react';

// --- Constants & Types ---

const GRID_SIZE = 15;
const TILE_SIZE = 30;

type Position = { x: number; y: number };
type ItemType = 'plus2' | 'plus3' | 'shield' | 'minus2' | 'minus5' | 'extraRoll' | 'sword' | 'gun';
type Item = { pos: Position; type: ItemType; createdAt: number };

interface ActiveItem {
  type: ItemType;
  turns: number;
}

// --- Utilities ---

const isSamePos = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

const getNeighbors = (pos: Position, walkable: Position[]) => {
  const dirs = [
    { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
  ];
  return dirs
    .map(d => ({ x: pos.x + d.x, y: pos.y + d.y }))
    .filter(p => walkable.some(w => isSamePos(w, p)));
};

// BFS to find shortest path
const findShortestPath = (start: Position, target: Position, walkable: Position[]): Position[] => {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (isSamePos(pos, target)) return path;

    for (const neighbor of getNeighbors(pos, walkable)) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ pos: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return [];
};

// Get all reachable tiles within N steps
const getReachableTiles = (start: Position, steps: number, walkable: Position[]): Position[] => {
  const reachable = new Set<string>();
  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;
    if (dist > 0) reachable.add(`${pos.x},${pos.y}`);
    if (dist < steps) {
      for (const neighbor of getNeighbors(pos, walkable)) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ pos: neighbor, dist: dist + 1 });
        }
      }
    }
  }
  return Array.from(reachable).map(s => {
    const [x, y] = s.split(',').map(Number);
    return { x, y };
  });
};

// --- Components ---

const DiceIcon = ({ value }: { value: number }) => {
  switch (value) {
    case 1: return <Dice1 size={32} />;
    case 2: return <Dice2 size={32} />;
    case 3: return <Dice3 size={32} />;
    case 4: return <Dice4 size={32} />;
    case 5: return <Dice5 size={32} />;
    case 6: return <Dice6 size={32} />;
    default: return <Dice1 size={32} />;
  }
};

export default function App() {
  // --- Game State ---
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [botPos, setBotPos] = useState<Position>({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
  const [bot2Pos, setBot2Pos] = useState<Position | null>(null);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [turn, setTurn] = useState<'player' | 'bot' | 'bot2'>('player');
  const [message, setMessage] = useState('Your turn. Roll the dice!');
  const [gameOver, setGameOver] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [inventory, setInventory] = useState<ActiveItem[]>([]);
  const [gameTime, setGameTime] = useState(0);
  const [lastRollTime, setLastRollTime] = useState<number>(Date.now());
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState<1 | 2>(1);
  const [initialTime, setInitialTime] = useState(0); // 0 means infinite/count up
  const [showFullscreenDice, setShowFullscreenDice] = useState(false);
  const [diceAnimationValue, setDiceAnimationValue] = useState<number | null>(null);
  const [menuStep, setMenuStep] = useState<'level' | 'time'>('level');

  const playerShield = inventory[0]?.type === 'shield';
  const shieldTurns = playerShield ? inventory[0].turns : 0;
  const playerSword = inventory[0]?.type === 'sword';
  const swordTurns = playerSword ? inventory[0].turns : 0;
  const playerGun = inventory[0]?.type === 'gun';
  const gunTurns = playerGun ? inventory[0].turns : 0;
  const [extraRolls, setExtraRolls] = useState(0);

  // --- Map Definition ---
  const walkableTiles = useMemo(() => {
    const tiles: Position[] = [];
    const paths = [0, 3, 7, 11, 14];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        // Create a grid of paths with many intersections
        if (paths.includes(x) || paths.includes(y)) {
          tiles.push({ x, y });
        }
      }
    }
    return tiles;
  }, []);

  // Initialize items
  useEffect(() => {
    const generateItems = () => {
      const newItemList: Item[] = [];
      const itemTypes: ItemType[] = ['plus2', 'plus3', 'shield', 'minus2', 'minus5', 'extraRoll'];
      const availableTiles = walkableTiles.filter(t => 
        !(t.x === 0 && t.y === 0) && 
        !(t.x === GRID_SIZE - 1 && t.y === GRID_SIZE - 1)
      );
      
      // Place 8-12 random items
      const count = Math.floor(Math.random() * 5) + 8;
      const shuffled = [...availableTiles].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        newItemList.push({
          pos: shuffled[i],
          type: itemTypes[Math.floor(Math.random() * itemTypes.length)],
          createdAt: Date.now()
        });
      }
      setItems(newItemList);
    };
    
    if (walkableTiles.length > 0 && items.length === 0) {
      generateItems();
    }
  }, [walkableTiles, items.length]);

  // Game Timer
  useEffect(() => {
    if (gameOver || !gameStarted) return;
    const interval = setInterval(() => {
      // Pause timer if player is idle for more than 30 seconds
      if (Date.now() - lastRollTime > 30000) return;

      setGameTime(prev => {
        if (initialTime > 0) {
          if (prev <= 1) {
            setGameOver(true);
            setMessage('TIME UP! You survived the bot. YOU WIN!');
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, gameStarted, initialTime]);

  // Dynamic Item Spawning
  const playerPosRef = React.useRef(playerPos);
  const botPosRef = React.useRef(botPos);
  const bot2PosRef = React.useRef(bot2Pos);
  const itemsRef = React.useRef(items);

  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { botPosRef.current = botPos; }, [botPos]);
  useEffect(() => { bot2PosRef.current = bot2Pos; }, [bot2Pos]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    if (gameOver || !gameStarted) return;
    
    const interval = setInterval(() => {
      const standardItems: ItemType[] = ['plus2', 'plus3', 'shield', 'minus2', 'minus5', 'extraRoll'];
      const level2Items: ItemType[] = ['sword', 'gun'];
      const itemTypes = level === 2 ? [...standardItems, ...level2Items] : standardItems;

      const availableTiles = walkableTiles.filter(t => 
        !isSamePos(t, playerPosRef.current) && 
        !isSamePos(t, botPosRef.current) &&
        (!bot2PosRef.current || !isSamePos(t, bot2PosRef.current)) &&
        !itemsRef.current.some(it => isSamePos(it.pos, t))
      );
      
      if (availableTiles.length > 0) {
        // Shuffle available tiles and pick 6-7
        const shuffled = [...availableTiles].sort(() => Math.random() - 0.5);
        const count = Math.floor(Math.random() * 2) + 6; // 6 or 7
        const newItems: Item[] = [];
        
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
          const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          newItems.push({ pos: shuffled[i], type: randomType, createdAt: Date.now() });
        }
        
        setItems(prev => [...prev, ...newItems]);
      }
    }, 3000); // 3 seconds spawn rate

    return () => clearInterval(interval);
  }, [walkableTiles, gameOver, gameStarted, level]);

  // Item Expiration Logic
  useEffect(() => {
    if (gameOver || !gameStarted) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(item => now - item.createdAt < 30000)); // Expire after 30s
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, gameStarted]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const reachableTiles = useMemo(() => {
    if (turn === 'player' && diceValue !== null && !isRolling && !isMoving) {
      return getReachableTiles(playerPos, diceValue, walkableTiles);
    }
    return [];
  }, [playerPos, diceValue, turn, isRolling, isMoving, walkableTiles]);

  // --- Actions ---

  const checkWinCondition = useCallback((p: Position, b: Position, isBot2 = false) => {
    if (isSamePos(p, b)) {
      if (playerShield) {
        setInventory(prev => {
          const next = [...prev];
          next.shift(); // Remove shield
          return next;
        });
        setMessage('Shield used! Bot pushed back.');
        
        // Push bot back 1 tile
        const startPos = isBot2 ? { x: 0, y: GRID_SIZE - 1 } : { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
        const backPath = findShortestPath(b, startPos, walkableTiles).slice(0, 1);
        if (backPath.length > 0) {
          if (isBot2) setBot2Pos(backPath[0]);
          else setBotPos(backPath[0]);
        }
      } else if (playerSword) {
        setInventory(prev => {
          const next = [...prev];
          next.shift(); // Remove sword after use
          return next;
        });
        setMessage('You attacked the bot with your sword!');
        const startPos = isBot2 ? { x: 0, y: GRID_SIZE - 1 } : { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
        if (isBot2) setBot2Pos(startPos);
        else setBotPos(startPos);
      } else {
        setGameOver(true);
        setMessage('GAME OVER. The bot caught you!');
      }
    }
  }, [playerShield, playerSword, walkableTiles]);

  const finalizeTurn = useCallback((p: Position, b: Position, b2: Position | null) => {
    checkWinCondition(p, b);
    if (b2) checkWinCondition(p, b2, true);
    setDiceValue(null);
    
    setExtraRolls(prev => {
      if (prev > 0) {
        const nextCount = prev - 1;
        setMessage(turn === 'player' ? 'Extra roll! Rolling...' : 'Extra roll for bot!');
        setTimeout(rollDice, 300);
        return nextCount;
      } else {
        let nextTurn: 'player' | 'bot' | 'bot2' = 'player';
        if (turn === 'player') nextTurn = 'bot';
        else if (turn === 'bot') {
          if (level === 2) nextTurn = 'bot2';
          else nextTurn = 'player';
        } else if (turn === 'bot2') {
          nextTurn = 'player';
        }

        // Decrement item turns only after a full round (when it returns to player)
        if (nextTurn === 'player' && inventory.length > 0) {
          setInventory(prev => {
            const next = [...prev];
            if (next[0]) {
              next[0].turns -= 1;
              if (next[0].turns <= 0) {
                setMessage(`${next[0].type} expired!`);
                next.shift();
              }
            }
            return next;
          });
        }

        setTurn(nextTurn);
        if (nextTurn === 'bot' || nextTurn === 'bot2') {
          setMessage('Bots are moving...');
        } else {
          setMessage('Your turn. Roll the dice!');
        }
        return 0;
      }
    });
  }, [turn, checkWinCondition, level]);

  const animatePath = async (path: Position[], setPos: React.Dispatch<React.SetStateAction<Position>>) => {
    setIsMoving(true);
    for (const step of path) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setPos(step);
    }
    setIsMoving(false);
  };

  const handleItemEffect = useCallback(async (type: ItemType, currentPos: Position, isPlayer: boolean, lastPath: Position[]) => {
    let nextPos = currentPos;
    let effectMessage = '';
    
    let setPos = setPlayerPos;
    if (!isPlayer) {
      setPos = turn === 'bot' ? setBotPos : setBot2Pos;
    }

    const startPos = isPlayer ? { x: 0, y: 0 } : (turn === 'bot' ? { x: GRID_SIZE - 1, y: GRID_SIZE - 1 } : { x: 0, y: GRID_SIZE - 1 });
    const goalPos = isPlayer ? { x: GRID_SIZE - 1, y: GRID_SIZE - 1 } : { x: 0, y: 0 };
    const entityName = isPlayer ? 'You' : (turn === 'bot' ? 'Bot 1' : 'Bot 2');

    // Helper to get backtrack path along the path just taken
    const getBacktrackPath = (steps: number) => {
      // lastPath is [step1, step2, ..., currentPos]
      const reversed = [...lastPath].reverse();
      // Remove currentPos from the start of reversed path if it's there
      if (reversed.length > 0 && isSamePos(reversed[0], currentPos)) {
        reversed.shift();
      }
      
      let backPath = reversed.slice(0, steps);
      
      // If we need more steps (e.g. moved only 1 step but hit -5), use shortest path to start
      if (backPath.length < steps) {
        const remainingSteps = steps - backPath.length;
        const currentBackPos = backPath.length > 0 ? backPath[backPath.length - 1] : currentPos;
        const extraPath = findShortestPath(currentBackPos, startPos, walkableTiles).slice(0, remainingSteps);
        backPath = [...backPath, ...extraPath];
      }
      return backPath;
    };

    let pathTaken: Position[] = lastPath;

    switch (type) {
      case 'plus2':
        effectMessage = `${entityName} got +2 steps forward!`;
        const path2 = findShortestPath(currentPos, goalPos, walkableTiles).slice(0, 2);
        if (path2.length > 0) {
          await animatePath(path2, setPos);
          nextPos = path2[path2.length - 1];
          pathTaken = path2;
        }
        break;
      case 'plus3':
        effectMessage = `${entityName} got +3 steps forward!`;
        const path3 = findShortestPath(currentPos, goalPos, walkableTiles).slice(0, 3);
        if (path3.length > 0) {
          await animatePath(path3, setPos);
          nextPos = path3[path3.length - 1];
          pathTaken = path3;
        }
        break;
      case 'minus2':
        effectMessage = `${entityName} hit -2! Backtracking...`;
        const backPath2 = getBacktrackPath(2);
        if (backPath2.length > 0) {
          await animatePath(backPath2, setPos);
          nextPos = backPath2[backPath2.length - 1];
          pathTaken = backPath2;
        }
        break;
      case 'minus5':
        effectMessage = `${entityName} hit -5! Backtracking way back...`;
        const backPath5 = getBacktrackPath(5);
        if (backPath5.length > 0) {
          await animatePath(backPath5, setPos);
          nextPos = backPath5[backPath5.length - 1];
          pathTaken = backPath5;
        }
        break;
      case 'shield':
        if (isPlayer) {
          effectMessage = 'Shield acquired! Blocks one bot attack.';
          setInventory(prev => {
            if (prev.length >= 1) return prev;
            return [...prev, { type: 'shield', turns: 4 }];
          });
        } else {
          effectMessage = 'Bot got a shield! (No effect for bot)';
        }
        break;
      case 'sword':
        if (isPlayer) {
          effectMessage = 'Sword acquired! You can attack bots.';
          setInventory(prev => {
            if (prev.length >= 1) return prev;
            return [...prev, { type: 'sword', turns: 4 }];
          });
        } else {
          effectMessage = 'Bot got a sword! (No effect for bot)';
        }
        break;
      case 'gun':
        if (isPlayer) {
          effectMessage = 'Gun acquired! Auto-attacks bots within 5 tiles.';
          setInventory(prev => {
            if (prev.length >= 1) return prev;
            return [...prev, { type: 'gun', turns: 4 }];
          });
        } else {
          effectMessage = 'Bot got a gun! (No effect for bot)';
        }
        break;
      case 'extraRoll':
        effectMessage = `${entityName} got an extra roll!`;
        setExtraRolls(prev => prev + 1);
        break;
    }

    setMessage(effectMessage);
    
    setTimeout(async () => {
      if (isPlayer) {
        finalizeTurn(nextPos, botPos, bot2Pos);
      } else {
        if (turn === 'bot') {
          finalizeTurn(playerPos, nextPos, bot2Pos);
        } else {
          finalizeTurn(playerPos, botPos, nextPos);
        }
      }
    }, 500);
  }, [playerPos, botPos, bot2Pos, turn, finalizeTurn, walkableTiles, animatePath]);

  const rollDice = () => {
    if (isRolling || isMoving || gameOver || !gameStarted) return;
    setLastRollTime(Date.now());
    setIsRolling(true);
    setMessage('Rolling...');
    
    if (turn === 'player') {
      setShowFullscreenDice(true);
      setDiceAnimationValue(null);
    }

    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      
      if (turn === 'player') {
        setDiceAnimationValue(val);
        setTimeout(() => {
          setShowFullscreenDice(false);
          setDiceValue(val);
          setIsRolling(false);
          setMessage(`You rolled a ${val}. Choose where to move!`);
        }, 1500);
      } else {
        setDiceValue(val);
        setIsRolling(false);
        setMessage(`Bot rolled a ${val}. It's moving...`);
      }
    }, 800);
  };

  const handlePlayerMove = async (target: Position) => {
    if (turn !== 'player' || diceValue === null || isRolling || isMoving) return;
    
    const path = findShortestPath(playerPos, target, walkableTiles);
    if (path.length > 0) {
      await animatePath(path, setPlayerPos);
      
      let nextBotPos = botPos;
      let nextBot2Pos = bot2Pos;

      // Gun effect: Attack bots within 5 tiles
      if (playerGun) {
        const distToBot1 = Math.abs(target.x - botPos.x) + Math.abs(target.y - botPos.y);
        if (distToBot1 <= 5) {
          setMessage('Gun auto-attacked Bot 1!');
          nextBotPos = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
          setBotPos(nextBotPos);
        }
        if (bot2Pos) {
          const distToBot2 = Math.abs(target.x - bot2Pos.x) + Math.abs(target.y - bot2Pos.y);
          if (distToBot2 <= 5) {
            setMessage('Gun auto-attacked Bot 2!');
            nextBot2Pos = { x: 0, y: GRID_SIZE - 1 };
            setBot2Pos(nextBot2Pos);
          }
        }
      }

      // Check for items
      const itemIndex = items.findIndex(item => isSamePos(item.pos, target));
      if (itemIndex !== -1) {
        const item = items[itemIndex];
        // If it's an inventory item and inventory is full, don't pick it up
        const isInventoryItem = ['shield', 'sword', 'gun'].includes(item.type);
        if (isInventoryItem && inventory.length >= 1) {
          finalizeTurn(target, nextBotPos, nextBot2Pos);
        } else {
          setItems(prev => prev.filter((_, i) => i !== itemIndex));
          handleItemEffect(item.type, target, true, path);
        }
      } else {
        finalizeTurn(target, nextBotPos, nextBot2Pos);
      }
    }
  };

  const botMove = useCallback(async () => {
    if (turn === 'player' || diceValue === null || isRolling || isMoving || gameOver) return;

    const currentBotPos = turn === 'bot' ? botPos : bot2Pos!;
    const setPos = turn === 'bot' ? setBotPos : setBot2Pos;
    
    const fullPath = findShortestPath(currentBotPos, playerPos, walkableTiles);
    if (fullPath.length > 0) {
      const stepsToTake = Math.min(diceValue, fullPath.length);
      const movePath = fullPath.slice(0, stepsToTake);
      
      await animatePath(movePath, setPos);
      
      const finalPos = movePath[movePath.length - 1];
      
      // Check for items for Bot too
      const itemIndex = items.findIndex(item => isSamePos(item.pos, finalPos));
      if (itemIndex !== -1) {
        const item = items[itemIndex];
        setItems(prev => prev.filter((_, i) => i !== itemIndex));
        handleItemEffect(item.type, finalPos, false, movePath);
      } else {
        finalizeTurn(playerPos, turn === 'bot' ? finalPos : botPos, turn === 'bot2' ? finalPos : bot2Pos);
      }
    } else {
      setDiceValue(null);
      setTurn('player');
    }
  }, [botPos, bot2Pos, playerPos, diceValue, turn, isRolling, isMoving, gameOver, walkableTiles, checkWinCondition, items, level]);

  const resetGame = () => {
    setPlayerPos({ x: 0, y: 0 });
    setBotPos({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 });
    setBot2Pos(level === 2 ? { x: 0, y: GRID_SIZE - 1 } : null);
    setDiceValue(null);
    setIsRolling(false);
    setIsMoving(false);
    setTurn('player');
    setMessage('Your turn. Roll the dice!');
    setGameOver(false);
    setItems([]);
    setInventory([]);
    setExtraRolls(0);
    setGameTime(initialTime);
    setGameStarted(false);
    setMenuStep('level');
  };

  // Bot Turn Logic
  useEffect(() => {
    if ((turn === 'bot' || turn === 'bot2') && !gameOver && !isRolling && !isMoving && diceValue === null) {
      const timer = setTimeout(rollDice, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, gameOver, isRolling, isMoving, diceValue]);

  useEffect(() => {
    if ((turn === 'bot' || turn === 'bot2') && diceValue !== null && !isRolling && !isMoving && !gameOver) {
      const timer = setTimeout(botMove, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, diceValue, isRolling, isMoving, gameOver, botMove]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden text-black">
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
                        onClick={() => { setLevel(1); setMenuStep('time'); }}
                        className="p-6 bg-white border border-black/10 rounded-2xl hover:border-black transition-colors group"
                      >
                        <div className="text-2xl font-black mb-1 group-hover:scale-110 transition-transform">1</div>
                        <div className="text-[10px] font-bold uppercase opacity-40">1 Bot</div>
                      </button>
                      <button
                        onClick={() => { setLevel(2); setMenuStep('time'); }}
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
                      <label className="text-xs font-bold uppercase tracking-widest opacity-40 block text-left">Set Time Limit (HH:MM:SS)</label>
                      <div className="flex gap-2 justify-center">
                        {['h', 'm', 's'].map((unit, idx) => (
                          <div key={unit} className="flex flex-col gap-1">
                            <input
                              type="number"
                              min="0"
                              max={unit === 'h' ? '23' : '59'}
                              defaultValue="0"
                              id={`time-${unit}`}
                              className="w-16 h-16 bg-white border border-black/10 rounded-xl text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                            />
                            <span className="text-[10px] font-bold uppercase opacity-30">{unit === 'h' ? 'Hours' : unit === 'm' ? 'Mins' : 'Secs'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setMenuStep('level')}
                        className="flex-1 py-4 border border-black/10 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-black/5"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => {
                          const h = parseInt((document.getElementById('time-h') as HTMLInputElement).value) || 0;
                          const m = parseInt((document.getElementById('time-m') as HTMLInputElement).value) || 0;
                          const s = parseInt((document.getElementById('time-s') as HTMLInputElement).value) || 0;
                          const totalSecs = h * 3600 + m * 60 + s;
                          setInitialTime(totalSecs);
                          setGameTime(totalSecs);
                          setBot2Pos(level === 2 ? { x: 0, y: GRID_SIZE - 1 } : null);
                          setGameStarted(true);
                        }}
                        className="flex-[2] py-4 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                      >
                        Start Game
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullscreenDice && (
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
                {!diceAnimationValue ? (
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
                    <DiceIcon value={diceAnimationValue} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-6xl">
        {/* Game Board */}
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
                  onClick={() => isReachable && handlePlayerMove({ x, y })}
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
                      className="player-token w-6 h-6 z-10 relative"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      {inventory.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1.2 }}
                          className={`absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border ${
                            inventory[0].type === 'shield' ? 'text-blue-500 border-blue-200' :
                            inventory[0].type === 'sword' ? 'text-pink-500 border-pink-200' :
                            inventory[0].type === 'gun' ? 'text-purple-500 border-purple-200' : ''
                          }`}
                        >
                          {inventory[0].type === 'shield' && <Shield size={10} fill="currentColor" />}
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

        {/* Controls Panel */}
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
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Time</span>
                <span className="text-sm font-mono font-bold">{formatTime(gameTime)}</span>
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
                      <Dice1 size={40} />
                    </motion.div>
                  ) : (
                    diceValue ? <DiceIcon value={diceValue} /> : <div className="w-4 h-4 bg-zinc-800 rounded-full opacity-20" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <button
              onClick={rollDice}
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
      </div>

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
                onClick={resetGame}
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
    </div>
  );
}
