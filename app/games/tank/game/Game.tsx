
import React, { useEffect, useRef, useState } from 'react';
import { Maze } from './logic/Maze';
import { 
  Point, 
  Player, 
  Bot, 
  Bullet, 
  LootBox, 
  PlacedBomb,
  Particle, 
  LootType 
} from '../types/game';
import { 
  MAZE_SIZE, 
  CELL_SIZE, 
  BOT_SPAWN_INTERVAL, 
  BOT_PATH_UPDATE_INTERVAL, 
  LOOT_SPAWN_INTERVAL, 
  FIRE_RATE_LIMIT, 
  MIN_PLAYER_SPEED, 
  MAX_PLAYER_SPEED, 
  SPEED_SCALING_FACTOR, 
  BULLET_CONFIG, 
  LOOT_CONFIG 
} from '../constants/game';
import { GameHud } from './components/GameHud';

export const Game: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uiState, setUiState] = useState({ hp: 100, score: 0 });
  const [gojoEffect, setGojoEffect] = useState(false);
  
  // Game state in refs for performance
  const mazeRef = useRef(new Maze(MAZE_SIZE, MAZE_SIZE));
  const playerRef = useRef<Player>({
    x: Math.floor(MAZE_SIZE / 2) + 0.5,
    y: Math.floor(MAZE_SIZE / 2) + 0.5,
    radius: 0.3,
    color: '#000',
    hp: 100,
    score: 0,
    activePowerUp: null,
    powerUpShots: 0,
  });
  const botsRef = useRef<Bot[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const lootRef = useRef<LootBox[]>([]);
  const bombsRef = useRef<PlacedBomb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const aimTargetRef = useRef<Point>({ x: 0, y: 0 });
  const lastBotSpawnRef = useRef<number>(0);
  const lastLootSpawnRef = useRef<number>(0);
  const lastFireTimeRef = useRef<number>(0);
  const displayedHpRef = useRef(100);
  const requestRef = useRef<number>();

  const createParticles = (x: number, y: number, color: string, count: number, speed: number = 0.1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const s = Math.random() * speed;
      particlesRef.current.push({
        x,
        y,
        radius: 0.05 + Math.random() * 0.05,
        color,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s,
        life: 1.0,
        maxLife: 1.0,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      
      if (key === ' ') {
        const p = playerRef.current;
        const bots = botsRef.current;
        
        if (bots.length > 0) {
          // Find nearest bot
          let nearestBot = bots[0];
          let minDist = Math.hypot(bots[0].x - p.x, bots[0].y - p.y);
          
          for (let i = 1; i < bots.length; i++) {
            const d = Math.hypot(bots[i].x - p.x, bots[i].y - p.y);
            if (d < minDist) {
              minDist = d;
              nearestBot = bots[i];
            }
          }
          
          // Snap aim to bot
          aimTargetRef.current = { x: nearestBot.x, y: nearestBot.y };
          fire(aimTargetRef.current);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      const newPos = {
        x: ((e.clientX - rect.left) * scaleX) / CELL_SIZE,
        y: ((e.clientY - rect.top) * scaleY) / CELL_SIZE,
      };
      mousePosRef.current = newPos;
      aimTargetRef.current = newPos; // Revert aim to mouse on move
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left click
      fire(mousePosRef.current);
    };

    const fire = (target: Point) => {
      const now = performance.now();
      if (now - lastFireTimeRef.current < FIRE_RATE_LIMIT) return;
      
      const p = playerRef.current;
      
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist < 0.01) return; // Too close to player

      const bulletType = p.activePowerUp || 'NORMAL';
      const config = BULLET_CONFIG[bulletType];

      if (bulletType === 'BOMB') {
        bombsRef.current.push({
          id: Math.random().toString(36).substr(2, 9),
          x: p.x,
          y: p.y,
          radius: config.radius,
          color: config.color,
        });
        p.powerUpShots--;
        if (p.powerUpShots <= 0) {
          p.activePowerUp = null;
        }
        createParticles(p.x, p.y, config.color, 10, 0.05);
        lastFireTimeRef.current = now;
        return;
      }

      let path: Point[] | undefined = undefined;
      let bulletTarget: Point | undefined = undefined;
      if (bulletType === 'ROCKET') {
        bulletTarget = { x: target.x, y: target.y };
      }

      if (bulletType === 'HOLLOW_PURPLE') {
        setGojoEffect(true);
        setTimeout(() => setGojoEffect(false), 500);
      }

      bulletsRef.current.push({
        x: p.x,
        y: p.y,
        radius: config.radius,
        color: config.color,
        vx: (dx / dist) * config.speed,
        vy: (dy / dist) * config.speed,
        type: bulletType,
        damage: config.damage,
        bounces: config.bounces,
        path: path,
        target: bulletTarget,
        trail: bulletType === 'LASER' ? [{ x: p.x, y: p.y }] : undefined,
      });

      if (p.activePowerUp) {
        p.powerUpShots--;
        if (p.powerUpShots <= 0) {
          p.activePowerUp = null;
        }
      }

      // Particle on fire
      createParticles(p.x, p.y, config.color, 5, 0.05);
      lastFireTimeRef.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const explodeRocket = (x: number, y: number) => {
    const explosionRadius = 3.5; // Increased radius
    createParticles(x, y, '#FF4500', 40, 0.3);
    createParticles(x, y, '#FFD700', 20, 0.2);
    
    botsRef.current.forEach(bot => {
      const dist = Math.hypot(bot.x - x, bot.y - y);
      if (dist < explosionRadius + bot.radius) {
        if (bot.type === 'black' || bot.type === 'blue') {
          bot.hp = 0;
        } else if (bot.type === 'red') {
          bot.hp -= bot.maxHp / 2;
        } else if (bot.type === 'yellow') {
          bot.hp -= bot.maxHp / 3;
        }
        createParticles(bot.x, bot.y, bot.color, 5, 0.05);
      }
    });
  };

  const explodeBomb = (x: number, y: number) => {
    const explosionSize = 2; // Half of 4x4 matrix
    createParticles(x, y, '#8B4513', 60, 0.4);
    createParticles(x, y, '#FF4500', 40, 0.3);
    
    // Visual matrix effect
    for (let i = -2; i <= 2; i += 0.5) {
      for (let j = -2; j <= 2; j += 0.5) {
        if (Math.random() > 0.7) {
          createParticles(x + i, y + j, '#8B4513', 2, 0.1);
        }
      }
    }

    botsRef.current.forEach(bot => {
      const dx = Math.abs(bot.x - x);
      const dy = Math.abs(bot.y - y);
      // Square area check for 4x4 matrix
      if (dx <= explosionSize && dy <= explosionSize) {
        if (bot.type === 'black' || bot.type === 'blue' || bot.type === 'red') {
          bot.hp = 0;
        } else if (bot.type === 'yellow') {
          bot.hp -= bot.maxHp / 2;
        }
        createParticles(bot.x, bot.y, bot.color, 10, 0.08);
      }
    });
  };

  const update = (time: number) => {
    const maze = mazeRef.current;
    const player = playerRef.current;
    const keys = keysRef.current;

    // Player movement
    let dx = 0;
    let dy = 0;
    const currentSpeed = Math.min(MAX_PLAYER_SPEED, MIN_PLAYER_SPEED + player.score * SPEED_SCALING_FACTOR);
    if (keys.has('w')) dy -= currentSpeed;
    if (keys.has('s')) dy += currentSpeed;
    if (keys.has('a')) dx -= currentSpeed;
    if (keys.has('d')) dx += currentSpeed;

    const r = player.radius;
    
    // Check X movement
    let nx = player.x + dx;
    if (!maze.isWall(nx - r, player.y - r) && 
        !maze.isWall(nx + r, player.y - r) && 
        !maze.isWall(nx - r, player.y + r) && 
        !maze.isWall(nx + r, player.y + r)) {
      player.x = nx;
    }

    // Check Y movement
    let ny = player.y + dy;
    if (!maze.isWall(player.x - r, ny - r) && 
        !maze.isWall(player.x + r, ny - r) && 
        !maze.isWall(player.x - r, ny + r) && 
        !maze.isWall(player.x + r, ny + r)) {
      player.y = ny;
    }

    // Bot spawning
    if (time - lastBotSpawnRef.current > BOT_SPAWN_INTERVAL) {
      const emptyCells: Point[] = [];
      for (let y = 1; y < MAZE_SIZE - 1; y++) {
        for (let x = 1; x < MAZE_SIZE - 1; x++) {
          if (maze.grid[y][x] === 0) {
            // Don't spawn too close to player (at least 6 cells away)
            const dist = Math.hypot(x + 0.5 - player.x, y + 0.5 - player.y);
            if (dist > 6) {
              emptyCells.push({ x: x + 0.5, y: y + 0.5 });
            }
          }
        }
      }

      if (emptyCells.length > 0) {
        const spawn = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        // Determine bot type based on score
        const s = player.score;
        const weights = {
          black: 100,
          blue: Math.min(60, s / 5),
          red: Math.min(40, s / 15),
          yellow: Math.min(20, s / 40),
        };
        
        const totalWeight = weights.black + weights.blue + weights.red + weights.yellow;
        let random = Math.random() * totalWeight;
        let type: 'red' | 'yellow' | 'blue' | 'black' = 'black';
        
        if (random < weights.yellow) type = 'yellow';
        else if (random < weights.yellow + weights.red) type = 'red';
        else if (random < weights.yellow + weights.red + weights.blue) type = 'blue';
        else type = 'black';

        const botProps = {
          black: { radius: 0.2, hp: 1, speed: 0.04, color: '#000' },
          blue: { radius: 0.25, hp: 2, speed: 0.07, color: '#0000FF' },
          red: { radius: 0.4, hp: 6, speed: 0.06, color: '#FF0000' },
          yellow: { radius: 0.6, hp: 15, speed: 0.02, color: '#FFD700' },
        }[type];

        botsRef.current.push({
          ...spawn,
          ...botProps,
          maxHp: botProps.hp,
          type,
          path: [],
          lastPathUpdate: 0,
        });
      }
      lastBotSpawnRef.current = time;
    }

    // Loot spawning
    if (time - lastLootSpawnRef.current > LOOT_SPAWN_INTERVAL) {
      const emptyCells: Point[] = [];
      for (let y = 1; y < MAZE_SIZE - 1; y++) {
        for (let x = 1; x < MAZE_SIZE - 1; x++) {
          if (maze.grid[y][x] === 0) {
            emptyCells.push({ x: x + 0.5, y: y + 0.5 });
          }
        }
      }

      if (emptyCells.length > 0) {
        const spawn = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const types: LootType[] = ['BIG', 'PIERCE', 'LASER', 'HOLLOW_PURPLE', 'ROCKET', 'BOMB'];
        // Make Hollow Purple rarer
        let type: LootType;
        const rand = Math.random();
        if (rand < 0.1) type = 'HOLLOW_PURPLE';
        else if (rand < 0.2) type = 'BOMB';
        else if (rand < 0.35) type = 'ROCKET';
        else if (rand < 0.55) type = 'BIG';
        else if (rand < 0.75) type = 'PIERCE';
        else type = 'LASER';
        
        lootRef.current.push({
          ...spawn,
          radius: type === 'HOLLOW_PURPLE' ? 0.45 : 0.3,
          color: LOOT_CONFIG[type].color,
          type,
        });
      }
      lastLootSpawnRef.current = time;
    }

    // Bot movement
    botsRef.current.forEach((bot) => {
      if (time - bot.lastPathUpdate > BOT_PATH_UPDATE_INTERVAL) {
        const path = maze.findPath(
          { x: Math.floor(bot.x), y: Math.floor(bot.y) },
          { x: Math.floor(player.x), y: Math.floor(player.y) }
        );
        if (path) bot.path = path;
        bot.lastPathUpdate = time;
      }

      if (bot.path.length > 1) {
        const target = bot.path[1];
        const tx = target.x + 0.5;
        const ty = target.y + 0.5;
        const angle = Math.atan2(ty - bot.y, tx - bot.x);
        bot.x += Math.cos(angle) * bot.speed;
        bot.y += Math.sin(angle) * bot.speed;
      }
    });

    // Bullets movement
    const nextBullets: Bullet[] = [];
    bulletsRef.current.forEach((b) => {
      let nx = b.x + b.vx;
      let ny = b.y + b.vy;
      
      if (b.type === 'PIERCE' || b.type === 'HOLLOW_PURPLE') {
        // Pierce and Hollow Purple bullets don't care about walls
        if (nx < 0 || nx > MAZE_SIZE || ny < 0 || ny > MAZE_SIZE) return;
        nextBullets.push({ ...b, x: nx, y: ny });
      } else if (b.type === 'ROCKET') {
        // Rocket flies directly to target and explodes
        const hitBot = botsRef.current.find(bot => Math.hypot(bot.x - b.x, bot.y - b.y) < b.radius + bot.radius);
        if (b.target) {
          const distToTarget = Math.hypot(b.target.x - b.x, b.target.y - b.y);
          const config = BULLET_CONFIG.ROCKET;
          
          if (distToTarget < config.speed || maze.isWall(nx, ny) || hitBot) {
            explodeRocket(b.x, b.y);
            return;
          }
          nextBullets.push({ ...b, x: nx, y: ny });
        } else {
          if (maze.isWall(nx, ny) || hitBot) {
            explodeRocket(b.x, b.y);
            return;
          }
          nextBullets.push({ ...b, x: nx, y: ny });
        }
      } else if (b.type === 'LASER' && b.bounces > 0) {
        // Laser bullets bounce
        let hitWallX = maze.isWall(nx, b.y);
        let hitWallY = maze.isWall(b.x, ny);
        
        let newVx = b.vx;
        let newVy = b.vy;
        let newBounces = b.bounces;
        let newTrail = b.trail ? [...b.trail] : [];

        if (hitWallX) {
          newVx *= -1;
          newBounces--;
          createParticles(b.x, b.y, b.color, 2, 0.03);
          newTrail.push({ x: b.x, y: b.y });
        }
        if (hitWallY) {
          newVy *= -1;
          newBounces--;
          createParticles(b.x, b.y, b.color, 2, 0.03);
          newTrail.push({ x: b.x, y: b.y });
        }

        if (hitWallX || hitWallY) {
          nextBullets.push({ ...b, x: b.x + newVx, y: b.y + newVy, vx: newVx, vy: newVy, bounces: newBounces, trail: newTrail });
        } else {
          nextBullets.push({ ...b, x: nx, y: ny, trail: b.trail });
        }
      } else {
        // Normal or Big bullets hit walls
        if (maze.isWall(nx, ny)) {
          createParticles(nx, ny, b.color, 3, 0.05);
        } else {
          nextBullets.push({ ...b, x: nx, y: ny });
        }
      }
    });
    bulletsRef.current = nextBullets;

    // Particles movement
    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
    });
    particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

    // Collisions
    const remainingBots: Bot[] = [];
    const remainingBombs: PlacedBomb[] = [];
    const triggeredBombs: Set<string> = new Set();

    // Check bomb triggers
    bombsRef.current.forEach(bomb => {
      const botTriggered = botsRef.current.some(bot => 
        Math.hypot(bot.x - bomb.x, bot.y - bomb.y) < bot.radius + bomb.radius + 0.1 // Added slight buffer
      );
      if (botTriggered) {
        triggeredBombs.add(bomb.id);
        explodeBomb(bomb.x, bomb.y);
      } else {
        remainingBombs.push(bomb);
      }
    });
    bombsRef.current = remainingBombs;

    botsRef.current.forEach((bot) => {
      if (bot.hp <= 0) {
        // Handle bots already dead (e.g. from bomb)
        const scoreMap = { black: 10, blue: 20, red: 50, yellow: 150 };
        player.score += scoreMap[bot.type];
        createParticles(bot.x, bot.y, bot.color, 15, 0.1);
        return;
      }

      const distToPlayer = Math.hypot(bot.x - player.x, bot.y - player.y);
      if (distToPlayer < bot.radius + player.radius) {
        player.hp -= 10;
        createParticles(bot.x, bot.y, '#FF0000', 10, 0.15);
      } else {
        const bulletIndex = bulletsRef.current.findIndex(
          (b) => Math.hypot(b.x - bot.x, b.y - bot.y) < b.radius + bot.radius
        );
        if (bulletIndex !== -1) {
          const bullet = bulletsRef.current[bulletIndex];
          
          if (bullet.type === 'ROCKET') {
            // Rocket explodes on contact with any bot
            explodeRocket(bullet.x, bullet.y);
            bulletsRef.current.splice(bulletIndex, 1);
            
            // Check if this specific bot died from the explosion
            if (bot.hp <= 0) {
              const scoreMap = { black: 10, blue: 20, red: 50, yellow: 150 };
              player.score += scoreMap[bot.type];
              createParticles(bot.x, bot.y, bot.color, 15, 0.1);
            } else {
              remainingBots.push(bot);
            }
          } else {
            bot.hp -= bullet.damage;
            createParticles(bot.x, bot.y, bot.color, 5, 0.05);
            
            // Only remove bullet if it's not piercing or hollow purple
            if (bullet.type !== 'PIERCE' && bullet.type !== 'HOLLOW_PURPLE') {
              bulletsRef.current.splice(bulletIndex, 1);
            }
            
            if (bot.hp <= 0) {
              const scoreMap = { black: 10, blue: 20, red: 50, yellow: 150 };
              player.score += scoreMap[bot.type];
              createParticles(bot.x, bot.y, bot.color, 15, 0.1);
            } else {
              remainingBots.push(bot);
            }
          }
        } else {
          remainingBots.push(bot);
        }
      }
    });
    botsRef.current = remainingBots;

    // Loot collisions
    lootRef.current = lootRef.current.filter((l) => {
      const dist = Math.hypot(l.x - player.x, l.y - player.y);
      if (dist < l.radius + player.radius) {
        player.activePowerUp = l.type;
        if (l.type === 'ROCKET') player.powerUpShots = 3;
        else if (l.type === 'BOMB') player.powerUpShots = 2;
        else player.powerUpShots = 5;
        createParticles(l.x, l.y, l.color, 10, 0.1);
        return false;
      }
      return true;
    });

    // Sync UI
    setUiState({ hp: player.hp, score: player.score });
    
    // Smooth HP transition
    displayedHpRef.current += (player.hp - displayedHpRef.current) * 0.1;

    if (player.hp <= 0 && displayedHpRef.current < 1) {
      onGameOver(player.score);
      return;
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maze = mazeRef.current;

    // Draw Maze
    ctx.lineWidth = 1;
    for (let y = 0; y < MAZE_SIZE; y++) {
      for (let x = 0; x < MAZE_SIZE; x++) {
        if (maze.grid[y][x] === 1) {
          ctx.fillStyle = '#000';
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else {
          ctx.strokeStyle = '#ddd';
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // Draw Player
    const p = playerRef.current;
    ctx.fillStyle = p.activePowerUp ? LOOT_CONFIG[p.activePowerUp].color : '#000';
    ctx.beginPath();
    ctx.arc(p.x * CELL_SIZE, p.y * CELL_SIZE, p.radius * CELL_SIZE, 0, Math.PI * 2);
    ctx.fill();

    // Draw Player Health Bar
    const playerBarWidth = p.radius * 3 * CELL_SIZE;
    const playerBarHeight = 4;
    const playerHpPercent = Math.max(0, displayedHpRef.current / 100);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(p.x * CELL_SIZE - playerBarWidth / 2, (p.y - p.radius - 0.2) * CELL_SIZE, playerBarWidth, playerBarHeight);
    
    // Gradient for health bar
    const hpGradient = ctx.createLinearGradient(
      p.x * CELL_SIZE - playerBarWidth / 2, 0,
      p.x * CELL_SIZE + playerBarWidth / 2, 0
    );
    hpGradient.addColorStop(0, playerHpPercent > 0.3 ? '#00FF00' : '#FF0000');
    hpGradient.addColorStop(1, playerHpPercent > 0.3 ? '#008800' : '#880000');
    
    ctx.fillStyle = hpGradient;
    ctx.fillRect(p.x * CELL_SIZE - playerBarWidth / 2, (p.y - p.radius - 0.2) * CELL_SIZE, playerBarWidth * playerHpPercent, playerBarHeight);
    
    // Draw Aim Line
    const target = aimTargetRef.current;
    if (target.x !== 0 || target.y !== 0) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(p.x * CELL_SIZE, p.y * CELL_SIZE);
      ctx.lineTo(target.x * CELL_SIZE, target.y * CELL_SIZE);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Bombs
    bombsRef.current.forEach(bomb => {
      ctx.fillStyle = bomb.color;
      ctx.beginPath();
      ctx.arc(bomb.x * CELL_SIZE, bomb.y * CELL_SIZE, bomb.radius * CELL_SIZE, 0, Math.PI * 2);
      ctx.fill();
      
      // Bomb fuse/detail
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bomb.x * CELL_SIZE, (bomb.y - bomb.radius) * CELL_SIZE);
      ctx.lineTo(bomb.x * CELL_SIZE, (bomb.y - bomb.radius - 0.1) * CELL_SIZE);
      ctx.stroke();
      
      // Spark
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(bomb.x * CELL_SIZE, (bomb.y - bomb.radius - 0.1) * CELL_SIZE, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw Bots
    botsRef.current.forEach((bot) => {
      ctx.fillStyle = bot.color;
      ctx.fillRect(
        (bot.x - bot.radius) * CELL_SIZE,
        (bot.y - bot.radius) * CELL_SIZE,
        bot.radius * 2 * CELL_SIZE,
        bot.radius * 2 * CELL_SIZE
      );
      
      // Draw health bar for stronger bots
      if (bot.maxHp > 1) {
        const barWidth = bot.radius * 2 * CELL_SIZE;
        const barHeight = 4;
        const hpPercent = bot.hp / bot.maxHp;
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect((bot.x - bot.radius) * CELL_SIZE, (bot.y - bot.radius - 0.2) * CELL_SIZE, barWidth, barHeight);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect((bot.x - bot.radius) * CELL_SIZE, (bot.y - bot.radius - 0.2) * CELL_SIZE, barWidth * hpPercent, barHeight);
      }

      // Draw a white cross inside to indicate "bomb"
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo((bot.x - 0.1) * CELL_SIZE, (bot.y - 0.1) * CELL_SIZE);
      ctx.lineTo((bot.x + 0.1) * CELL_SIZE, (bot.y + 0.1) * CELL_SIZE);
      ctx.moveTo((bot.x + 0.1) * CELL_SIZE, (bot.y - 0.1) * CELL_SIZE);
      ctx.lineTo((bot.x - 0.1) * CELL_SIZE, (bot.y + 0.1) * CELL_SIZE);
      ctx.stroke();
    });

    // Draw Loot
    lootRef.current.forEach((l) => {
      if (l.type === 'HOLLOW_PURPLE') {
        // Special glowing effect for Gojo box
        ctx.shadowBlur = 15;
        ctx.shadowColor = l.color;
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.arc(l.x * CELL_SIZE, l.y * CELL_SIZE, l.radius * CELL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (l.type === 'ROCKET') {
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.moveTo(l.x * CELL_SIZE, (l.y - l.radius) * CELL_SIZE);
        ctx.lineTo((l.x - l.radius) * CELL_SIZE, (l.y + l.radius) * CELL_SIZE);
        ctx.lineTo((l.x + l.radius) * CELL_SIZE, (l.y + l.radius) * CELL_SIZE);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = l.color;
        ctx.fillRect(
          (l.x - l.radius) * CELL_SIZE,
          (l.y - l.radius) * CELL_SIZE,
          l.radius * 2 * CELL_SIZE,
          l.radius * 2 * CELL_SIZE
        );
      }
      
      ctx.fillStyle = '#fff';
      ctx.font = l.type === 'HOLLOW_PURPLE' ? 'bold 16px serif' : 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(LOOT_CONFIG[l.type].symbol, l.x * CELL_SIZE, l.y * CELL_SIZE);
    });

    bulletsRef.current.forEach((b) => {
      if (b.type === 'LASER' && b.trail) {
        // Draw laser trail
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 4; // Increased thickness
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x * CELL_SIZE, b.trail[0].y * CELL_SIZE);
        for (let i = 1; i < b.trail.length; i++) {
          ctx.lineTo(b.trail[i].x * CELL_SIZE, b.trail[i].y * CELL_SIZE);
        }
        ctx.lineTo(b.x * CELL_SIZE, b.y * CELL_SIZE);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      if (b.type === 'HOLLOW_PURPLE') {
        // Glowing purple orb
        const gradient = ctx.createRadialGradient(
          b.x * CELL_SIZE, b.y * CELL_SIZE, 0,
          b.x * CELL_SIZE, b.y * CELL_SIZE, b.radius * CELL_SIZE
        );
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#A020F0');
        gradient.addColorStop(1, 'rgba(160, 32, 240, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(b.x * CELL_SIZE, b.y * CELL_SIZE, b.radius * CELL_SIZE, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'ROCKET') {
        // Draw rocket as a triangle pointing in movement direction
        const angle = Math.atan2(b.vy, b.vx);
        ctx.save();
        ctx.translate(b.x * CELL_SIZE, b.y * CELL_SIZE);
        ctx.rotate(angle);
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.moveTo(b.radius * 1.5 * CELL_SIZE, 0);
        ctx.lineTo(-b.radius * CELL_SIZE, -b.radius * CELL_SIZE);
        ctx.lineTo(-b.radius * CELL_SIZE, b.radius * CELL_SIZE);
        ctx.closePath();
        ctx.fill();
        
        // Rocket fire trail
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(-b.radius * CELL_SIZE, 0, b.radius * 0.5 * CELL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x * CELL_SIZE, b.y * CELL_SIZE, b.radius * CELL_SIZE, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Particles
    particlesRef.current.forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x * CELL_SIZE, p.y * CELL_SIZE, p.radius * CELL_SIZE, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);

  return (
    <div className={`flex flex-col items-center gap-4 w-full max-w-full transition-transform duration-75 ${gojoEffect ? 'animate-shake' : ''}`}>
      <GameHud score={uiState.score} />

      <div className="relative overflow-hidden shadow-2xl w-full max-w-[min(90vw,672px)] aspect-square">
        <canvas
          ref={canvasRef}
          width={MAZE_SIZE * CELL_SIZE}
          height={MAZE_SIZE * CELL_SIZE}
          className={`bg-white border-2 border-black transition-all w-full h-full ${gojoEffect ? 'brightness-150 contrast-150' : ''}`}
        />
        
        {/* Gojo Overlay */}
        {gojoEffect && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center animate-flash">
            <img 
              src="https://raw.githubusercontent.com/theanh1105/image-host/main/gojo.jpg" 
              alt="Gojo Satoru"
              className="w-full h-full object-cover opacity-80 mix-blend-screen"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-purple-600/30 mix-blend-overlay"></div>
          </div>
        )}
      </div>
    </div>
  );
};
