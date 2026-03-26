"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Position, Item, ItemType, ActiveItem } from './types';
import { GRID_SIZE } from './constants';
import { isSamePos, findShortestPath, getReachableTiles } from './utils/gameUtils';
import { StartMenu } from './components/StartMenu';
import { FullscreenDice } from './components/FullscreenDice';
import { GameOverOverlay } from './components/GameOverOverlay';
import { GameBoard } from './components/GameBoard';
import { Controls } from './components/Controls';

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
  const [rollCount, setRollCount] = useState(0);
  const [lastRollTime, setLastRollTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState<1 | 2>(1);
  const [targetRolls, setTargetRolls] = useState(0);
  const [showFullscreenDice, setShowFullscreenDice] = useState(false);
  const [diceAnimationValue, setDiceAnimationValue] = useState<number | null>(null);
  const [menuStep, setMenuStep] = useState<'level' | 'rolls'>('level');
  const [extraRolls, setExtraRolls] = useState(0);

  const playerShield = inventory[0]?.type === 'shield';
  const playerSword = inventory[0]?.type === 'sword';
  const playerGun = inventory[0]?.type === 'gun';

  // --- Map Definition ---
  const walkableTiles = useMemo(() => {
    const tiles: Position[] = [];
    const paths = [0, 3, 7, 11, 14];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
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

  // Dynamic Item Spawning
  const playerPosRef = useRef(playerPos);
  const botPosRef = useRef(botPos);
  const bot2PosRef = useRef(bot2Pos);
  const itemsRef = useRef(items);

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
        const shuffled = [...availableTiles].sort(() => Math.random() - 0.5);
        const count = Math.floor(Math.random() * 2) + 6;
        const newItems: Item[] = [];
        
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
          const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
          newItems.push({ pos: shuffled[i], type: randomType, createdAt: Date.now() });
        }
        
        setItems(prev => [...prev, ...newItems]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [walkableTiles, gameOver, gameStarted, level]);

  // Item Expiration Logic
  useEffect(() => {
    if (gameOver || !gameStarted) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(item => now - item.createdAt < 30000));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, gameStarted]);

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
          next.shift();
          return next;
        });
        setMessage('Shield used! Bot pushed back.');
        const startPos = isBot2 ? { x: 0, y: GRID_SIZE - 1 } : { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
        const backPath = findShortestPath(b, startPos, walkableTiles).slice(0, 1);
        if (backPath.length > 0) {
          if (isBot2) setBot2Pos(backPath[0]);
          else setBotPos(backPath[0]);
        }
      } else if (playerSword) {
        setInventory(prev => {
          const next = [...prev];
          next.shift();
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

  const rollDice = useCallback(() => {
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
          
          setRollCount(prev => {
            const next = prev + 1;
            if (targetRolls > 0 && next >= targetRolls) {
              setGameOver(true);
              setMessage(`YOU SURVIVED ${targetRolls} ROLLS! YOU WIN!`);
            } else {
              setMessage(`You rolled a ${val}. Choose where to move!`);
            }
            return next;
          });
        }, 1500);
      } else {
        setDiceValue(val);
        setIsRolling(false);
        setMessage(`Bot rolled a ${val}. It's moving...`);
      }
    }, 800);
  }, [isRolling, isMoving, gameOver, gameStarted, turn, targetRolls]);

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

        if (nextTurn === 'player' && inventory.length > 0) {
          setInventory(prevInv => {
            const next = [...prevInv];
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
        if (nextTurn === 'bot' || nextTurn === 'bot2') setMessage('Bots are moving...');
        else setMessage('Your turn. Roll the dice!');
        return 0;
      }
    });
  }, [turn, checkWinCondition, level, inventory.length, rollDice]);

  const animatePath = useCallback(async (path: Position[], setPos: React.Dispatch<React.SetStateAction<any>>) => {
    setIsMoving(true);
    for (const step of path) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setPos(step);
    }
    setIsMoving(false);
  }, []);

  const handleItemEffect = useCallback(async (type: ItemType, currentPos: Position, isPlayer: boolean, lastPath: Position[]) => {
    let nextPos = currentPos;
    let effectMessage = '';
    let setPos = isPlayer ? setPlayerPos : (turn === 'bot' ? setBotPos : setBot2Pos);
    const startPos = isPlayer ? { x: 0, y: 0 } : (turn === 'bot' ? { x: GRID_SIZE - 1, y: GRID_SIZE - 1 } : { x: 0, y: GRID_SIZE - 1 });
    const goalPos = isPlayer ? { x: GRID_SIZE - 1, y: GRID_SIZE - 1 } : { x: 0, y: 0 };
    const entityName = isPlayer ? 'You' : (turn === 'bot' ? 'Bot 1' : 'Bot 2');

    const getBacktrackPath = (steps: number) => {
      const reversed = [...lastPath].reverse();
      if (reversed.length > 0 && isSamePos(reversed[0], currentPos)) reversed.shift();
      let backPath = reversed.slice(0, steps);
      if (backPath.length < steps) {
        const remainingSteps = steps - backPath.length;
        const currentBackPos = backPath.length > 0 ? backPath[backPath.length - 1] : currentPos;
        const extraPath = findShortestPath(currentBackPos, startPos, walkableTiles).slice(0, remainingSteps);
        backPath = [...backPath, ...extraPath];
      }
      return backPath;
    };

    switch (type) {
      case 'plus2':
        effectMessage = `${entityName} got +2 steps forward!`;
        const path2 = findShortestPath(currentPos, goalPos, walkableTiles).slice(0, 2);
        if (path2.length > 0) { await animatePath(path2, setPos); nextPos = path2[path2.length - 1]; }
        break;
      case 'plus3':
        effectMessage = `${entityName} got +3 steps forward!`;
        const path3 = findShortestPath(currentPos, goalPos, walkableTiles).slice(0, 3);
        if (path3.length > 0) { await animatePath(path3, setPos); nextPos = path3[path3.length - 1]; }
        break;
      case 'minus2':
        effectMessage = `${entityName} hit -2! Backtracking...`;
        const backPath2 = getBacktrackPath(2);
        if (backPath2.length > 0) { await animatePath(backPath2, setPos); nextPos = backPath2[backPath2.length - 1]; }
        break;
      case 'minus5':
        effectMessage = `${entityName} hit -5! Backtracking way back...`;
        const backPath5 = getBacktrackPath(5);
        if (backPath5.length > 0) { await animatePath(backPath5, setPos); nextPos = backPath5[backPath5.length - 1]; }
        break;
      case 'shield':
        if (isPlayer) {
          effectMessage = 'Shield acquired! Blocks one bot attack.';
          setInventory(prev => prev.length >= 1 ? prev : [...prev, { type: 'shield', turns: 4 }]);
        } else effectMessage = 'Bot got a shield! (No effect for bot)';
        break;
      case 'sword':
        if (isPlayer) {
          effectMessage = 'Sword acquired! You can attack bots.';
          setInventory(prev => prev.length >= 1 ? prev : [...prev, { type: 'sword', turns: 4 }]);
        } else effectMessage = 'Bot got a sword! (No effect for bot)';
        break;
      case 'gun':
        if (isPlayer) {
          effectMessage = 'Gun acquired! Auto-attacks bots within 5 tiles.';
          setInventory(prev => prev.length >= 1 ? prev : [...prev, { type: 'gun', turns: 4 }]);
        } else effectMessage = 'Bot got a gun! (No effect for bot)';
        break;
      case 'extraRoll':
        effectMessage = `${entityName} got an extra roll!`;
        setExtraRolls(prev => prev + 1);
        break;
    }

    setMessage(effectMessage);
    setTimeout(async () => {
      if (isPlayer) finalizeTurn(nextPos, botPos, bot2Pos);
      else {
        if (turn === 'bot') finalizeTurn(playerPos, nextPos, bot2Pos);
        else finalizeTurn(playerPos, botPos, nextPos);
      }
    }, 500);
  }, [turn, finalizeTurn, walkableTiles, animatePath, botPos, bot2Pos, playerPos]);

  const handlePlayerMove = async (target: Position) => {
    if (turn !== 'player' || diceValue === null || isRolling || isMoving) return;
    const path = findShortestPath(playerPos, target, walkableTiles);
    if (path.length > 0) {
      await animatePath(path, setPlayerPos);
      let nextBotPos = botPos;
      let nextBot2Pos = bot2Pos;

      if (playerGun) {
        if (Math.abs(target.x - botPos.x) + Math.abs(target.y - botPos.y) <= 5) {
          setMessage('Gun auto-attacked Bot 1!');
          nextBotPos = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };
          setBotPos(nextBotPos);
        }
        if (bot2Pos && Math.abs(target.x - bot2Pos.x) + Math.abs(target.y - bot2Pos.y) <= 5) {
          setMessage('Gun auto-attacked Bot 2!');
          nextBot2Pos = { x: 0, y: GRID_SIZE - 1 };
          setBot2Pos(nextBot2Pos);
        }
      }

      const itemIndex = items.findIndex(item => isSamePos(item.pos, target));
      if (itemIndex !== -1) {
        const item = items[itemIndex];
        const isInventoryItem = ['shield', 'sword', 'gun'].includes(item.type);
        if (isInventoryItem && inventory.length >= 1) finalizeTurn(target, nextBotPos, nextBot2Pos);
        else {
          setItems(prev => prev.filter((_, i) => i !== itemIndex));
          handleItemEffect(item.type, target, true, path);
        }
      } else finalizeTurn(target, nextBotPos, nextBot2Pos);
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
      const itemIndex = items.findIndex(item => isSamePos(item.pos, finalPos));
      if (itemIndex !== -1) {
        const item = items[itemIndex];
        setItems(prev => prev.filter((_, i) => i !== itemIndex));
        handleItemEffect(item.type, finalPos, false, movePath);
      } else finalizeTurn(playerPos, turn === 'bot' ? finalPos : botPos, turn === 'bot2' ? finalPos : bot2Pos);
    } else {
      setDiceValue(null);
      setTurn('player');
    }
  }, [botPos, bot2Pos, playerPos, diceValue, turn, isRolling, isMoving, gameOver, walkableTiles, items, animatePath, handleItemEffect, finalizeTurn]);

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
    setRollCount(0);
    setGameStarted(false);
    setMenuStep('level');
  };

  useEffect(() => {
    if ((turn === 'bot' || turn === 'bot2') && !gameOver && !isRolling && !isMoving && diceValue === null) {
      const timer = setTimeout(rollDice, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, gameOver, isRolling, isMoving, diceValue, rollDice]);

  useEffect(() => {
    if ((turn === 'bot' || turn === 'bot2') && diceValue !== null && !isRolling && !isMoving && !gameOver) {
      const timer = setTimeout(botMove, 600);
      return () => clearTimeout(timer);
    }
  }, [turn, diceValue, isRolling, isMoving, gameOver, botMove]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden text-black">
      <StartMenu 
        gameStarted={gameStarted} 
        menuStep={menuStep} 
        level={level} 
        setLevel={setLevel} 
        setMenuStep={setMenuStep} 
        onStart={(rolls) => {
          setTargetRolls(rolls);
          setRollCount(0);
          setBot2Pos(level === 2 ? { x: 0, y: GRID_SIZE - 1 } : null);
          setGameStarted(true);
        }}
      />

      <FullscreenDice show={showFullscreenDice} animationValue={diceAnimationValue} />
      <GameOverOverlay gameOver={gameOver} message={message} onReset={resetGame} />

      <div className="flex flex-col lg:flex-row gap-8 items-center justify-center w-full max-w-6xl">
        <GameBoard 
          walkableTiles={walkableTiles} 
          reachableTiles={reachableTiles} 
          playerPos={playerPos} 
          botPos={botPos} 
          bot2Pos={bot2Pos} 
          items={items} 
          onTileClick={handlePlayerMove}
          inventory={inventory}
        />

        <Controls 
          turn={turn} 
          inventory={inventory} 
          extraRolls={extraRolls} 
          rollCount={rollCount} 
          targetRolls={targetRolls} 
          message={message} 
          diceValue={diceValue} 
          isRolling={isRolling} 
          isMoving={isMoving} 
          gameOver={gameOver} 
          onRoll={rollDice}
        />
      </div>
    </div>
  );
}
