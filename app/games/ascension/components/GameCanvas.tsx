import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/Engine';
import { GameState } from '../game/types';
import { GAME_CONSTANTS } from '../game/constants';
import { Heart, Zap, Crosshair, Package, Shield, Clock, Plane, Skull, Sword } from 'lucide-react';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, (state) => {
      // Throttle state updates for React performance if needed, but for now just update
      setGameState({ ...state });
    });
    
    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
    };
  }, []);

  const handleStart = () => {
    engineRef.current?.startGame();
  };

  const handleInteract = () => {
    engineRef.current?.interact();
  };

  const handleUseItem = (index: number) => {
    engineRef.current?.useItem(index);
  };

  const handleSwitchWeapon = (weapon: 'PISTOL' | 'KATANA' | 'AK47') => {
    engineRef.current?.switchWeapon(weapon);
  };

  return (
    <div className="relative w-full h-screen bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-mono">
      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        width={1024}
        height={768}
        className="border-4 border-neutral-800 rounded-lg shadow-2xl shadow-cyan-900/20"
        style={{ cursor: 'crosshair' }}
      />

      {!gameState ? (
        <div className="absolute inset-0 flex items-center justify-center text-white bg-neutral-950 z-50">Đang tải...</div>
      ) : (
      <>
      {/* Overlays */}
      {gameState.phase === 'MENU' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
          <h1 className="text-6xl font-black text-cyan-400 mb-4 tracking-tighter">ASCENSION: EARTH 3618</h1>
          <p className="text-neutral-400 mb-8 max-w-md text-center">
            Trái đất đã bị diệt vong bởi virus ngoài hành tinh. Thu thập tài nguyên, nâng cấp tàu và sống sót qua 3 màn chơi để thoát khỏi địa ngục này.
          </p>
          <button 
            onClick={handleStart}
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xl transition-colors uppercase tracking-widest"
          >
            Bắt đầu sinh tồn
          </button>
        </div>
      )}

      {gameState.phase === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 p-8">
          <Skull className="w-24 h-24 text-red-500 mb-4" />
          <h1 className="text-6xl font-black text-red-500 mb-2 tracking-tighter">BẠN ĐÃ CHẾT</h1>
          
          <div className="bg-black/50 border border-red-900/50 p-6 rounded-lg mb-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-4 border-b border-red-900/30 pb-2 uppercase tracking-widest">Thống kê trận đấu</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Kẻ địch đã hạ:</span>
                <span className="text-2xl font-bold text-white">{gameState.totalKills}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Thời gian sinh tồn:</span>
                <span className="text-2xl font-bold text-white">{Math.floor(gameState.totalTime / 60)}p {Math.floor(gameState.totalTime % 60)}s</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-red-900/30">
                <span className="text-neutral-400 font-bold">XẾP HẠNG:</span>
                <span className="text-4xl font-black text-red-500">F</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xl transition-colors uppercase tracking-widest"
          >
            Chơi lại
          </button>
        </div>
      )}

      {gameState.phase === 'VICTORY' && (
        <div className="absolute inset-0 bg-green-950/90 flex flex-col items-center justify-center z-50 p-8">
          <Plane className="w-24 h-24 text-green-500 mb-4" />
          <h1 className="text-6xl font-black text-green-500 mb-2 tracking-tighter">THOÁT KHỎI TRÁI ĐẤT</h1>
          <p className="text-green-300 mb-6 text-xl">Bạn đã sống sót thành công!</p>

          <div className="bg-black/50 border border-green-900/50 p-6 rounded-lg mb-8 w-full max-w-md">
            <h2 className="text-xl font-bold text-green-400 mb-4 border-b border-green-900/30 pb-2 uppercase tracking-widest">Bảng điểm vinh danh</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Kẻ địch đã hạ:</span>
                <span className="text-2xl font-bold text-white">{gameState.totalKills}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Tổng thời gian:</span>
                <span className="text-2xl font-bold text-white">{Math.floor(gameState.totalTime / 60)}p {Math.floor(gameState.totalTime % 60)}s</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-green-900/30">
                <span className="text-neutral-400 font-bold">XẾP HẠNG:</span>
                {(() => {
                  const score = Math.floor((gameState.totalKills * 1000) / (gameState.totalTime / 60 + 1));
                  let rank = 'D';
                  let color = 'text-neutral-400';
                  if (score > 5000) { rank = 'S'; color = 'text-yellow-400 animate-pulse'; }
                  else if (score > 3500) { rank = 'A'; color = 'text-green-400'; }
                  else if (score > 2000) { rank = 'B'; color = 'text-cyan-400'; }
                  else if (score > 1000) { rank = 'C'; color = 'text-blue-400'; }
                  return <span className={`text-5xl font-black ${color}`}>{rank}</span>;
                })()}
              </div>
            </div>
          </div>

          <button 
            onClick={handleStart}
            className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-xl transition-colors uppercase tracking-widest"
          >
            Chơi lại
          </button>
        </div>
      )}

      {/* HUD */}
      {(gameState.phase === 'GROUND' || gameState.phase === 'FLIGHT' || gameState.phase === 'TAKEOFF' || gameState.phase === 'LANDING') && (
        <>
          {/* Top Bar: Stage & Phase Info */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-neutral-900/80 border border-neutral-700 px-6 py-2 rounded-full flex items-center gap-6 backdrop-blur-sm">
            <div className="text-cyan-400 font-bold">MÀN {gameState.stage} / {GAME_CONSTANTS.WIN_STAGES}</div>
            <div className="w-px h-4 bg-neutral-700"></div>
            <div className={`font-bold ${gameState.phase === 'FLIGHT' ? 'text-orange-400 animate-pulse' : 'text-green-400'}`}>
              {gameState.phase === 'GROUND' ? 'THU THẬP TÀI NGUYÊN' : 
               gameState.phase === 'TAKEOFF' ? 'CẤT CÁNH' :
               gameState.phase === 'LANDING' ? 'HẠ CÁNH' : 'BẢO VỆ TÀU'}
            </div>
            {(gameState.phase === 'FLIGHT' || gameState.phase === 'TAKEOFF' || gameState.phase === 'LANDING') && (
              <>
                <div className="w-px h-4 bg-neutral-700"></div>
                <div className="flex items-center gap-2 text-orange-400">
                  <Clock className="w-4 h-4" />
                  {Math.ceil(gameState.flightTimer)}s
                </div>
              </>
            )}
          </div>

          {/* Ship Stats (Top Right) */}
          <div className="absolute top-4 right-4 bg-neutral-900/80 border border-neutral-700 p-4 rounded-lg backdrop-blur-sm w-64">
            <div className="flex items-center gap-2 mb-2 text-neutral-300 font-bold border-b border-neutral-700 pb-2">
              <Plane className="w-5 h-5 text-cyan-400" />
              TÀU KHÔNG GIAN
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1 text-neutral-400">
                  <span>HP</span>
                  <span>{Math.ceil(gameState.ship.hp)}/{gameState.ship.maxHp}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${(gameState.ship.hp / gameState.ship.maxHp) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 text-neutral-400">
                  <span>Giáp</span>
                  <span>{Math.ceil(gameState.ship.armor)}/{gameState.ship.maxArmor}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${(gameState.ship.armor / gameState.ship.maxArmor) * 100}%` }}></div>
                </div>
              </div>
              {gameState.ship.hasMachineGun && (
                <div className="text-xs text-orange-400 flex items-center gap-1 mt-2">
                  <Crosshair className="w-3 h-3" /> Đã trang bị Súng máy
                </div>
              )}
            </div>
          </div>

          {/* Player Stats (Bottom Left) */}
          <div className="absolute bottom-4 left-4 bg-neutral-900/80 border border-neutral-700 p-4 rounded-lg backdrop-blur-sm w-64">
            <div className="space-y-3">
              {/* HP */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-red-400 font-bold">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> HP</span>
                  <span>{Math.ceil(gameState.player.hp)}/{gameState.player.maxHp}</span>
                </div>
                <div className="h-3 bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${(gameState.player.hp / gameState.player.maxHp) * 100}%` }}></div>
                </div>
              </div>
              {/* Stamina */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-yellow-400 font-bold">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Thể lực</span>
                  <span>{Math.ceil(gameState.player.stamina)}/{gameState.player.maxStamina}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{ width: `${(gameState.player.stamina / gameState.player.maxStamina) * 100}%` }}></div>
                </div>
              </div>
              {/* Hunger */}
              <div>
                <div className="flex justify-between text-xs mb-1 text-orange-400 font-bold">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Độ đói</span>
                  <span>{Math.ceil(gameState.player.hunger)}/{gameState.player.maxHunger}</span>
                </div>
                <div className="h-2 bg-neutral-800 rounded overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${(gameState.player.hunger / gameState.player.maxHunger) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Weapons & Ammo (Bottom Center) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/80 border border-neutral-700 p-2 rounded-lg backdrop-blur-sm flex gap-2">
            <button 
              onClick={() => handleSwitchWeapon('PISTOL')}
              className={`p-3 rounded flex flex-col items-center gap-1 min-w-[80px] ${gameState.player.weapon === 'PISTOL' ? 'bg-cyan-900/50 border border-cyan-500' : 'bg-neutral-800 border border-transparent'}`}
            >
              <Crosshair className="w-5 h-5 text-neutral-300" />
              <span className="text-xs text-neutral-400">Súng lục</span>
              <span className="text-sm font-bold text-cyan-400">{gameState.player.ammo.PISTOL}</span>
            </button>
            <button 
              onClick={() => handleSwitchWeapon('AK47')}
              className={`p-3 rounded flex flex-col items-center gap-1 min-w-[80px] ${gameState.player.weapon === 'AK47' ? 'bg-cyan-900/50 border border-cyan-500' : 'bg-neutral-800 border border-transparent'}`}
            >
              <Crosshair className="w-5 h-5 text-neutral-300" />
              <span className="text-xs text-neutral-400">AK-47</span>
              <span className="text-sm font-bold text-cyan-400">{gameState.player.ammo.AK47}</span>
            </button>
            <button 
              onClick={() => handleSwitchWeapon('KATANA')}
              className={`p-3 rounded flex flex-col items-center gap-1 min-w-[80px] ${gameState.player.weapon === 'KATANA' ? 'bg-cyan-900/50 border border-cyan-500' : 'bg-neutral-800 border border-transparent'}`}
            >
              <Sword className="w-5 h-5 text-neutral-300" />
              <span className="text-xs text-neutral-400">Katana</span>
              <span className="text-sm font-bold text-cyan-400">∞</span>
            </button>
          </div>

          {/* Inventory (Bottom Right) */}
          <div className="absolute bottom-4 right-4 bg-neutral-900/80 border border-neutral-700 p-4 rounded-lg backdrop-blur-sm w-64 max-h-[300px] overflow-y-auto">
            <div className="text-xs text-neutral-400 font-bold mb-2 border-b border-neutral-700 pb-2">TÚI ĐỒ (Click để dùng)</div>
            {gameState.player.inventory.length === 0 ? (
              <div className="text-neutral-600 text-sm text-center py-4">Trống</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gameState.player.inventory.map((item, idx) => {
                  const itemData = GAME_CONSTANTS.ITEMS[item.type as keyof typeof GAME_CONSTANTS.ITEMS];
                  if (!itemData) return null;
                  return (
                    <button 
                      key={item.id}
                      onClick={() => handleUseItem(idx)}
                      className="bg-neutral-800 hover:bg-neutral-700 p-2 rounded text-left border border-neutral-700 flex flex-col"
                    >
                      <span className="text-xs text-neutral-300 truncate w-full" title={(itemData as any).name}>{(itemData as any).name}</span>
                      <span className="text-cyan-400 font-bold text-sm">x{item.count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interaction Prompt */}
          {gameState.phase === 'GROUND' && Math.hypot(gameState.player.pos.x - gameState.ship.pos.x, gameState.player.pos.y - gameState.ship.pos.y) < gameState.ship.radius + 100 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32">
              <button 
                onClick={handleInteract}
                className="px-6 py-3 bg-cyan-600/80 hover:bg-cyan-500 text-white font-bold rounded-full text-sm transition-colors border border-cyan-400 backdrop-blur-sm shadow-[0_0_15px_rgba(6,182,212,0.5)] animate-bounce"
              >
                LÊN TÀU (Bắt đầu bay)
              </button>
            </div>
          )}

          {/* Controls Hint */}
          <div className="absolute top-4 left-4 text-xs text-neutral-500">
            WASD: Di chuyển | Chuột: Ngắm/Bắn | Shift: Chạy nhanh
          </div>
        </>
      )}
      </>
      )}
    </div>
  );
}
