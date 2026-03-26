import { GAME_CONSTANTS } from './constants';
import { GameState, Vector2, Enemy, Projectile, ItemDrop, Phase, Decoration, Building, Maze } from './types';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.state = this.getInitialState(onStateChange);
    
    this.setupInputs();
  }

  private getInitialState(onStateChange: (state: GameState) => void): GameState {
    const buildings = this.generateBuildings();
    const enemies: Enemy[] = [];
    for (const b of buildings) {
      enemies.push(...b.enemies);
    }
    
    return {
      phase: 'MENU',
      stage: 1,
      player: {
        pos: { x: GAME_CONSTANTS.MAP_SIZE / 2, y: GAME_CONSTANTS.MAP_SIZE / 2 + 100 },
        radius: 15,
        hp: GAME_CONSTANTS.PLAYER.MAX_HP,
        maxHp: GAME_CONSTANTS.PLAYER.MAX_HP,
        stamina: GAME_CONSTANTS.PLAYER.MAX_STAMINA,
        maxStamina: GAME_CONSTANTS.PLAYER.MAX_STAMINA,
        hunger: GAME_CONSTANTS.PLAYER.MAX_HUNGER,
        maxHunger: GAME_CONSTANTS.PLAYER.MAX_HUNGER,
        speed: GAME_CONSTANTS.PLAYER.SPEED,
        weapon: 'PISTOL',
        ammo: { PISTOL: 50, AK47: 0 },
        inventory: [],
        angle: 0,
        isSprinting: false,
        lastShotTime: 0,
      },
      ship: {
        pos: { x: GAME_CONSTANTS.MAP_SIZE / 2, y: GAME_CONSTANTS.MAP_SIZE / 2 },
        radius: 50,
        hp: GAME_CONSTANTS.SHIP.MAX_HP,
        maxHp: GAME_CONSTANTS.SHIP.MAX_HP,
        armor: GAME_CONSTANTS.SHIP.BASE_ARMOR,
        maxArmor: GAME_CONSTANTS.SHIP.BASE_ARMOR,
        hasMachineGun: false,
        lastShotTime: 0,
      },
      enemies: enemies,
      projectiles: [],
      items: [],
      buildings: buildings,
      currentBuildingId: null,
      decorations: this.generateDecorations(),
      flightTimer: GAME_CONSTANTS.SHIP.FLIGHT_DURATION,
      flightSpawnTimer: 0,
      transitionTimer: 0,
      camera: { x: 0, y: 0 },
      mousePos: { x: 0, y: 0 },
      keys: {},
      lastTime: 0,
      totalKills: 0,
      totalTime: 0,
      onStateChange,
    };
  }

  private generateBuildings(): Building[] {
    const buildings: Building[] = [];
    const count = 15 + Math.floor(Math.random() * 10);
    const maxAttempts = 200;
    let attempts = 0;

    while (buildings.length < count && attempts < maxAttempts) {
      attempts++;
      const sizeX = 400 + Math.random() * 600;
      const sizeY = 400 + Math.random() * 600;
      const cellSize = 40; // Larger cells for better navigation
      const cols = Math.floor(sizeX / cellSize);
      const rows = Math.floor(sizeY / cellSize);
      
      const building: Building = {
        id: Math.random().toString(),
        pos: {
          x: Math.random() * (GAME_CONSTANTS.MAP_SIZE - sizeX),
          y: Math.random() * (GAME_CONSTANTS.MAP_SIZE - sizeY)
        },
        size: { x: sizeX, y: sizeY },
        entrancePos: { x: sizeX / 2, y: sizeY }, // Exactly at the bottom edge
        maze: this.generateMaze(cols, rows, cellSize),
        enemies: []
      };
      
      // Clear a path to the entrance in the maze
      const entX = Math.floor(building.entrancePos.x / cellSize);
      const entY = rows - 1;
      // Clear a vertical path from bottom to ensure connectivity
      for (let y = entY; y >= Math.max(0, entY - 4); y--) {
        building.maze.grid[y][entX] = 0;
        if (entX > 0) building.maze.grid[y][entX-1] = 0;
        if (entX < cols - 1) building.maze.grid[y][entX+1] = 0;
      }

      // Spawn enemies in the maze - Area based
      let enemyCount = Math.floor((sizeX * sizeY) / 30000);
      enemyCount = Math.max(1, Math.min(7, enemyCount));
      for (let i = 0; i < enemyCount; i++) {
        let spawned = false;
        let spawnAttempts = 0;
        while (!spawned && spawnAttempts < 50) {
          spawnAttempts++;
          const gx = Math.floor(Math.random() * cols);
          const gy = Math.floor(Math.random() * rows);
          if (building.maze.grid[gy][gx] === 0) {
            // Don't spawn too close to entrance
            if (Math.hypot(gx - entX, gy - entY) > 3) {
              const isElite = Math.random() > 0.8;
              const type = isElite ? 'GROUND_ELITE' : 'GROUND_SMALL';
              const config = GAME_CONSTANTS.ENEMIES[type];
              
              building.enemies.push({
                id: Math.random().toString(),
                pos: {
                  x: building.pos.x + gx * cellSize + cellSize / 2,
                  y: building.pos.y + gy * cellSize + cellSize / 2
                },
                type: type,
                hp: config.hp,
                maxHp: config.hp,
                damage: config.damage,
                speed: config.speed * (0.8 + Math.random() * 0.4),
                radius: config.radius * 0.8, // Slightly smaller radius inside buildings to avoid getting stuck
                color: config.color,
                lastAttackTime: 0
              });
              spawned = true;
            }
          }
        }
      }
      
      // Ensure building doesn't overlap with ship
      const distToShip = Math.hypot(building.pos.x + sizeX/2 - GAME_CONSTANTS.MAP_SIZE/2, building.pos.y + sizeY/2 - GAME_CONSTANTS.MAP_SIZE/2);
      if (distToShip < 600) {
        continue;
      }

      // Ensure building doesn't overlap with other buildings
      let overlap = false;
      const margin = 150; // Minimum distance between buildings
      for (const other of buildings) {
        if (building.pos.x < other.pos.x + other.size.x + margin &&
            building.pos.x + building.size.x + margin > other.pos.x &&
            building.pos.y < other.pos.y + other.size.y + margin &&
            building.pos.y + building.size.y + margin > other.pos.y) {
          overlap = true;
          break;
        }
      }
      if (overlap) {
        continue;
      }

      buildings.push(building);
    }
    return buildings;
  }

  private generateMaze(cols: number, rows: number, cellSize: number): Maze {
    const grid: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(1));
    
    const stack: [number, number][] = [];
    const start: [number, number] = [1, 1];
    
    // Carve initial 2x2 block
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (start[1] + dy < rows && start[0] + dx < cols) {
          grid[start[1] + dy][start[0] + dx] = 0;
        }
      }
    }
    
    stack.push(start);

    while (stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      const neighbors: [number, number][] = [];

      // Use step of 3 to allow 2-cell wide paths with 1-cell walls
      const dirs = [[0, -3], [0, 3], [-3, 0], [3, 0]];
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        // Check bounds and if the 2x2 target area is unvisited
        if (nx >= 1 && nx < cols - 2 && ny >= 1 && ny < rows - 2 && grid[ny][nx] === 1) {
          neighbors.push([nx, ny]);
        }
      }

      if (neighbors.length > 0) {
        const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Carve 2x2 block at target
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            grid[ny + dy][nx + dx] = 0;
          }
        }
        
        // Carve 2x2 path between current and target
        const stepX = (nx - cx) / 3;
        const stepY = (ny - cy) / 3;
        for (let i = 1; i <= 2; i++) {
          const tx = cx + stepX * i;
          const ty = cy + stepY * i;
          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              grid[ty + dy][tx + dx] = 0;
            }
          }
        }
        
        stack.push([nx, ny]);
      } else {
        stack.pop();
      }
    }

    // Add some random openings to make it less "perfect"
    for (let i = 0; i < (cols * rows) / 20; i++) {
      const rx = Math.floor(Math.random() * (cols - 3)) + 1;
      const ry = Math.floor(Math.random() * (rows - 3)) + 1;
      // Carve 2x2
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          grid[ry + dy][rx + dx] = 0;
        }
      }
    }

    // Ensure entrance is open and wide
    const entranceX = Math.floor(cols / 2);
    for (let x = entranceX - 2; x <= entranceX + 2; x++) {
      if (x >= 0 && x < cols) {
        for (let y = rows - 1; y >= rows - 4; y--) {
          if (y >= 0) grid[y][x] = 0;
        }
      }
    }

    return { grid, cellSize, cols, rows };
  }

  private dijkstra(maze: Maze, start: Vector2, end: Vector2): Vector2[] {
    const startX = Math.floor(start.x / maze.cellSize);
    const startY = Math.floor(start.y / maze.cellSize);
    const endX = Math.floor(end.x / maze.cellSize);
    const endY = Math.floor(end.y / maze.cellSize);

    if (startX < 0 || startX >= maze.cols || startY < 0 || startY >= maze.rows ||
        endX < 0 || endX >= maze.cols || endY < 0 || endY >= maze.rows) {
      return [];
    }

    const dist: number[][] = Array(maze.rows).fill(0).map(() => Array(maze.cols).fill(Infinity));
    const prev: (Vector2 | null)[][] = Array(maze.rows).fill(0).map(() => Array(maze.cols).fill(null));
    const visited: boolean[][] = Array(maze.rows).fill(0).map(() => Array(maze.cols).fill(false));

    dist[startY][startX] = 0;
    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      // Simple queue for BFS-like Dijkstra since all weights are 1
      const [cx, cy] = queue.shift()!;
      if (cx === endX && cy === endY) break;
      if (visited[cy][cx]) continue;
      visited[cy][cx] = true;

      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx >= 0 && nx < maze.cols && ny >= 0 && ny < maze.rows && maze.grid[ny][nx] === 0) {
          const newDist = dist[cy][cx] + 1;
          if (newDist < dist[ny][nx]) {
            dist[ny][nx] = newDist;
            prev[ny][nx] = { x: cx, y: cy };
            queue.push([nx, ny]);
          }
        }
      }
      // Sort queue by distance to make it true Dijkstra (though BFS is fine for uniform weights)
      queue.sort((a, b) => dist[a[1]][a[0]] - dist[b[1]][b[0]]);
    }

    const path: Vector2[] = [];
    let curr: Vector2 | null = { x: endX, y: endY };
    while (curr) {
      path.push({ x: curr.x * maze.cellSize + maze.cellSize / 2, y: curr.y * maze.cellSize + maze.cellSize / 2 });
      curr = prev[Math.floor(curr.y)][Math.floor(curr.x)];
    }
    return path.reverse();
  }

  private generateDecorations(): Decoration[] {
    return [];
  }

  private keydownHandler = (e: KeyboardEvent) => { this.state.keys[e.key.toLowerCase()] = true; };
  private keyupHandler = (e: KeyboardEvent) => { this.state.keys[e.key.toLowerCase()] = false; };
  private mousemoveHandler = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.state.mousePos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  private mousedownHandler = (e: MouseEvent) => { this.state.keys['mousedown'] = true; };
  private mouseupHandler = (e: MouseEvent) => { this.state.keys['mousedown'] = false; };

  private setupInputs() {
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    this.canvas.addEventListener('mousemove', this.mousemoveHandler);
    this.canvas.addEventListener('mousedown', this.mousedownHandler);
    window.addEventListener('mouseup', this.mouseupHandler);
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.keydownHandler);
    window.removeEventListener('keyup', this.keyupHandler);
    this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
    this.canvas.removeEventListener('mousedown', this.mousedownHandler);
    window.removeEventListener('mouseup', this.mouseupHandler);
  }

  public startGame() {
    this.state.phase = 'GROUND';
    this.state.stage = 1;
    this.state.totalKills = 0;
    this.state.totalTime = 0;
    this.state.player.hp = GAME_CONSTANTS.PLAYER.MAX_HP;
    this.state.player.hunger = GAME_CONSTANTS.PLAYER.MAX_HUNGER;
    this.state.player.stamina = GAME_CONSTANTS.PLAYER.MAX_STAMINA;
    this.state.player.ammo = { PISTOL: 50, AK47: 0 };
    this.state.player.weapon = 'PISTOL';
    this.state.player.inventory = [];
    this.state.ship.hp = GAME_CONSTANTS.SHIP.MAX_HP;
    this.state.ship.maxArmor = GAME_CONSTANTS.SHIP.BASE_ARMOR;
    this.state.ship.armor = GAME_CONSTANTS.SHIP.BASE_ARMOR;
    this.state.ship.hasMachineGun = false;
    
    // Regenerate map
    this.state.buildings = this.generateBuildings();
    this.state.decorations = this.generateDecorations();
    
    this.state.enemies = [];
    for (const b of this.state.buildings) {
      this.state.enemies.push(...b.enemies);
    }
    
    this.state.items = [];
    this.state.projectiles = [];
    this.spawnGroundEnemies();
    this.spawnMapItems();
  }

  public useItem(index: number) {
    const item = this.state.player.inventory[index];
    if (!item) return;

    const itemData = GAME_CONSTANTS.ITEMS[item.type as keyof typeof GAME_CONSTANTS.ITEMS];
    if (!itemData) return;

    if (itemData.type === 'CONSUMABLE') {
      this.state.player.hp = Math.min(this.state.player.maxHp, this.state.player.hp + (itemData as any).hp);
      this.state.player.hunger = Math.min(this.state.player.maxHunger, this.state.player.hunger + (itemData as any).hunger);
      this.state.player.stamina = Math.min(this.state.player.maxStamina, this.state.player.stamina + (itemData as any).stamina);
      
      item.count--;
      if (item.count <= 0) {
        this.state.player.inventory.splice(index, 1);
      }
    }
  }

  public switchWeapon(weapon: 'PISTOL' | 'KATANA' | 'AK47') {
    this.state.player.weapon = weapon;
  }

  public interact() {
    if (this.state.phase === 'GROUND') {
      const distToShip = Math.hypot(this.state.player.pos.x - this.state.ship.pos.x, this.state.player.pos.y - this.state.ship.pos.y);
      if (distToShip < this.state.ship.radius + 100) {
        this.state.phase = 'TAKEOFF';
        this.state.transitionTimer = 0;
        this.state.player.pos = { ...this.state.ship.pos };
      }
    }
  }

  private startFlightPhase() {
    this.state.phase = 'FLIGHT';
    // Màn 1: 30s, màn 2: 60s, màn 3: 120s
    if (this.state.stage === 1) this.state.flightTimer = 30;
    else if (this.state.stage === 2) this.state.flightTimer = 60;
    else this.state.flightTimer = 120;
    
    this.state.enemies = [];
    this.state.projectiles = [];
    this.state.items = [];
    this.state.buildings = []; // Clear map data
    this.state.decorations = []; // Clear map data
    this.state.player.pos = { ...this.state.ship.pos };
  }

  private startGroundPhase() {
    this.state.phase = 'GROUND';
    this.state.stage++;
    if (this.state.stage > GAME_CONSTANTS.WIN_STAGES) {
      this.state.phase = 'VICTORY';
      return;
    }
    
    // Regenerate map
    this.state.buildings = this.generateBuildings();
    this.state.decorations = this.generateDecorations();
    
    this.state.enemies = [];
    for (const b of this.state.buildings) {
      this.state.enemies.push(...b.enemies);
    }
    
    this.state.projectiles = [];
    this.state.items = [];
    this.state.player.pos = { x: this.state.ship.pos.x, y: this.state.ship.pos.y + 100 };
    this.spawnGroundEnemies();
    this.spawnMapItems();
  }

  private spawnMapItems() {
    const normalItems = Object.keys(GAME_CONSTANTS.ITEMS).filter(k => k !== 'SHIP_MACHINE_GUN' && k !== 'SHIP_ARMOR');
    
    this.state.items = [];

    for (const building of this.state.buildings) {
      // Spawn 3-7 items in each building
      const itemCount = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < itemCount; i++) {
        const randomItem = normalItems[Math.floor(Math.random() * normalItems.length)];
        
        // Find a random path cell in the maze
        let rx, ry;
        let attempts = 0;
        do {
          rx = Math.floor(Math.random() * building.maze.cols);
          ry = Math.floor(Math.random() * building.maze.rows);
          attempts++;
        } while (building.maze.grid[ry][rx] !== 0 && attempts < 100);

        this.state.items.push({
          id: Math.random().toString(),
          pos: { 
            x: building.pos.x + rx * building.maze.cellSize + building.maze.cellSize / 2, 
            y: building.pos.y + ry * building.maze.cellSize + building.maze.cellSize / 2 
          },
          type: randomItem,
          radius: 12,
          color: '#ffffff',
          buildingId: building.id
        });
      }
    }

    // Place Ship Parts in random buildings
    if (!this.state.ship.hasMachineGun && this.state.buildings.length > 0) {
      const b = this.state.buildings[Math.floor(Math.random() * this.state.buildings.length)];
      let rx, ry;
      let attempts = 0;
      do {
        rx = Math.floor(Math.random() * b.maze.cols);
        ry = Math.floor(Math.random() * b.maze.rows);
        attempts++;
      } while (b.maze.grid[ry][rx] !== 0 && attempts < 100);

      this.state.items.push({
        id: Math.random().toString(),
        pos: { 
          x: b.pos.x + rx * b.maze.cellSize + b.maze.cellSize / 2, 
          y: b.pos.y + ry * b.maze.cellSize + b.maze.cellSize / 2 
        },
        type: 'SHIP_MACHINE_GUN',
        radius: 15,
        color: '#ffffff',
        buildingId: b.id
      });
    }

    // Armor parts
    const armorCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < armorCount; i++) {
      if (this.state.buildings.length === 0) break;
      const b = this.state.buildings[Math.floor(Math.random() * this.state.buildings.length)];
      let rx, ry;
      let attempts = 0;
      do {
        rx = Math.floor(Math.random() * b.maze.cols);
        ry = Math.floor(Math.random() * b.maze.rows);
        attempts++;
      } while (b.maze.grid[ry][rx] !== 0 && attempts < 100);

      this.state.items.push({
        id: Math.random().toString(),
        pos: { 
          x: b.pos.x + rx * b.maze.cellSize + b.maze.cellSize / 2, 
          y: b.pos.y + ry * b.maze.cellSize + b.maze.cellSize / 2 
        },
        type: 'SHIP_ARMOR',
        radius: 15,
        color: '#ffffff',
        buildingId: b.id
      });
    }
  }

  private spawnGroundEnemies() {
    // Reduced number of enemies outside to 5-10
    const enemyCount = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < enemyCount; i++) {
      const type = Math.random() > 0.8 ? 'GROUND_ELITE' : Math.random() > 0.5 ? 'GROUND_HIGH' : 'GROUND_SMALL';
      const stats = GAME_CONSTANTS.ENEMIES[type];
      this.state.enemies.push({
        id: Math.random().toString(),
        pos: { x: Math.random() * GAME_CONSTANTS.MAP_SIZE, y: Math.random() * GAME_CONSTANTS.MAP_SIZE },
        type,
        hp: stats.hp,
        maxHp: stats.hp,
        damage: stats.damage,
        speed: stats.speed,
        radius: stats.radius,
        color: stats.color,
        lastAttackTime: 0
      });
    }
  }

  private spawnFlyingEnemies(dt: number) {
    this.state.flightSpawnTimer += dt;
    // Màn 1: 0,7 con/ 1s, màn 2: 1 con /1s, màn 3: 1,5 con/ 1s
    let enemiesPerSecond = 0.7;
    if (this.state.stage === 2) enemiesPerSecond = 1.0;
    else if (this.state.stage === 3) enemiesPerSecond = 1.5;
    const spawnInterval = 1 / enemiesPerSecond;
    
    if (this.state.flightSpawnTimer >= spawnInterval) {
      this.state.flightSpawnTimer = 0;
      const type = Math.random() > 0.8 ? 'FLYING_ELITE' : Math.random() > 0.5 ? 'FLYING_HIGH' : 'FLYING_SMALL';
      const stats = GAME_CONSTANTS.ENEMIES[type];
      const angle = Math.random() * Math.PI * 2;
      const dist = 800; // spawn off-screen
      this.state.enemies.push({
        id: Math.random().toString(),
        pos: { x: this.state.ship.pos.x + Math.cos(angle) * dist, y: this.state.ship.pos.y + Math.sin(angle) * dist },
        type,
        hp: stats.hp,
        maxHp: stats.hp,
        damage: stats.damage,
        speed: stats.speed,
        radius: stats.radius,
        color: stats.color,
        lastAttackTime: 0
      });
    }
  }

  private loop = (time: number) => {
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Cap dt to prevent huge jumps when switching tabs
    if (dt > 0.1) dt = 0.1;

    this.update(dt);
    this.draw();

    // Notify React of state changes occasionally or on important events
    // Throttled to ~15fps (every ~66ms) to prevent React from freezing the main thread
    if (!this.state.lastReactUpdateTime || time - this.state.lastReactUpdateTime > 66) {
        this.state.lastReactUpdateTime = time;
        this.state.onStateChange({ ...this.state });
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.state.phase === 'MENU' || this.state.phase === 'GAMEOVER' || this.state.phase === 'VICTORY') return;

    this.state.totalTime += dt;
    this.updatePlayer(dt);
    this.updateCamera();
    this.updateProjectiles(dt);
    this.updateEnemies(dt);
    this.updateItems();

    if (this.state.phase === 'TAKEOFF') {
      this.state.transitionTimer += dt;
      if (this.state.transitionTimer >= 3) {
        this.startFlightPhase();
      }
    } else if (this.state.phase === 'LANDING') {
      this.state.transitionTimer += dt;
      if (this.state.transitionTimer >= 3) {
        this.startGroundPhase();
      }
    } else if (this.state.phase === 'FLIGHT') {
      this.state.flightTimer -= dt;
      this.spawnFlyingEnemies(dt);
      if (this.state.flightTimer <= 0) {
        this.state.phase = 'LANDING';
        this.state.transitionTimer = 0;
        this.state.enemies = [];
        this.state.projectiles = [];
      }
    }

    // Hunger drain
    this.state.player.hunger -= dt * 2;
    if (this.state.player.hunger <= 0) {
      this.state.player.hunger = 0;
      this.state.player.hp -= dt * 5; // Starving damage
    }

    // Stamina regen
    if (!this.state.keys['shift']) {
      this.state.player.stamina = Math.min(this.state.player.maxStamina, this.state.player.stamina + dt * 10);
    }

    if (this.state.player.hp <= 0) {
      this.state.phase = 'GAMEOVER';
    }
    if (this.state.ship.hp <= 0) {
      this.state.phase = 'GAMEOVER';
    }
  }

  private updatePlayer(dt: number) {
    const p = this.state.player;
    
    // Movement
    let dx = 0;
    let dy = 0;
    if (this.state.keys['w']) dy -= 1;
    if (this.state.keys['s']) dy += 1;
    if (this.state.keys['a']) dx -= 1;
    if (this.state.keys['d']) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      p.isSprinting = this.state.keys['shift'] && p.stamina > 0;
      const currentSpeed = p.isSprinting ? p.speed * GAME_CONSTANTS.PLAYER.SPRINT_MULTIPLIER : p.speed;
      
      if (p.isSprinting) {
        p.stamina -= dt * 20;
      }

      if (this.state.phase === 'GROUND') {
        const nextX = p.pos.x + dx * currentSpeed * dt;
        const nextY = p.pos.y + dy * currentSpeed * dt;

        // Collision detection with maze if inside building
        if (this.state.currentBuildingId) {
          const b = this.state.buildings.find(b => b.id === this.state.currentBuildingId)!;
          const relX = nextX - b.pos.x;
          const relY = nextY - b.pos.y;
          
          const entranceWorldX = b.pos.x + b.entrancePos.x;
          const entranceWorldY = b.pos.y + b.entrancePos.y;
          
          // Doorway area: allow player to walk out
          const doorWidth = 100;
          const doorDepth = 60;
          const isInDoorway = Math.abs(nextX - entranceWorldX) < doorWidth / 2 && 
                             nextY > entranceWorldY - doorDepth && 
                             nextY < entranceWorldY + doorDepth;

          if (isInDoorway) {
            // If moving out past the threshold, trigger exit
            if (nextY > entranceWorldY - 5) {
              this.state.currentBuildingId = null;
            }
            p.pos.x = nextX;
            p.pos.y = nextY;
          } else {
            // Normal maze collision
            if (relX >= 0 && relX < b.size.x && relY >= 0 && relY < b.size.y) {
              const gx = Math.floor(relX / b.maze.cellSize);
              const gy = Math.floor(relY / b.maze.cellSize);
              
              if (gx >= 0 && gx < b.maze.cols && gy >= 0 && gy < b.maze.rows) {
                if (b.maze.grid[gy][gx] === 0) {
                  p.pos.x = nextX;
                  p.pos.y = nextY;
                }
              }
            }
          }
        } else {
          // Outside: Check if entering building or colliding with building walls
          let canMove = true;
          for (const b of this.state.buildings) {
            const entranceWorldX = b.pos.x + b.entrancePos.x;
            const entranceWorldY = b.pos.y + b.entrancePos.y;
            const distToEntrance = Math.hypot(nextX - entranceWorldX, nextY - entranceWorldY);

            // Doorway area: allow player to walk into the entrance
            const doorWidth = 80;
            const doorDepth = 40;
            const isInDoorway = Math.abs(nextX - entranceWorldX) < doorWidth / 2 && 
                               nextY > entranceWorldY - doorDepth && 
                               nextY < entranceWorldY + doorDepth;

            if (isInDoorway) {
              // If deep enough in the doorway, trigger entry
              if (nextY < entranceWorldY - 10) {
                this.state.currentBuildingId = b.id;
              }
              p.pos.x = nextX;
              p.pos.y = nextY;
              canMove = false;
              break;
            }

            // Check if colliding with building bounding box (excluding doorway)
            if (nextX > b.pos.x - p.radius && nextX < b.pos.x + b.size.x + p.radius &&
                nextY > b.pos.y - p.radius && nextY < b.pos.y + b.size.y + p.radius) {
              canMove = false;
              break;
            }
          }
          if (canMove) {
            p.pos.x = nextX;
            p.pos.y = nextY;
          }
        }

        // Clamp to map
        p.pos.x = Math.max(p.radius, Math.min(GAME_CONSTANTS.MAP_SIZE - p.radius, p.pos.x));
        p.pos.y = Math.max(p.radius, Math.min(GAME_CONSTANTS.MAP_SIZE - p.radius, p.pos.y));
      }
    }

    // Aiming
    const worldMouseX = this.state.mousePos.x + this.state.camera.x;
    const worldMouseY = this.state.mousePos.y + this.state.camera.y;
    p.angle = Math.atan2(worldMouseY - p.pos.y, worldMouseX - p.pos.x);

    // Shooting
    if (this.state.phase === 'GROUND' && this.state.keys['mousedown']) {
      const now = performance.now() / 1000;
      const weaponData = GAME_CONSTANTS.WEAPONS[p.weapon];
      
      if (now - p.lastShotTime >= weaponData.fireRate) {
        if (p.weapon === 'KATANA') {
          // Melee attack
          p.lastShotTime = now;
          const katanaData = weaponData as { range: number; damage: number };
          this.meleeAttack(p.pos, p.angle, katanaData.range, katanaData.damage);
          // Visual slash effect
          this.state.projectiles.push({
            id: Math.random().toString(),
            pos: { x: p.pos.x + Math.cos(p.angle) * 30, y: p.pos.y + Math.sin(p.angle) * 30 },
            vel: { x: Math.cos(p.angle) * 200, y: Math.sin(p.angle) * 200 },
            damage: 0, // Damage is handled instantly by meleeAttack
            radius: 20,
            color: '#ffffff',
            life: 0.15,
            source: 'PLAYER'
          });
        } else {
          // Ranged attack
          const ammoKey = p.weapon === 'PISTOL' ? 'PISTOL' : 'AK47';
          if (p.ammo[ammoKey] > 0) {
            p.ammo[ammoKey]--;
            p.lastShotTime = now;
            this.state.projectiles.push({
              id: Math.random().toString(),
              pos: { x: p.pos.x, y: p.pos.y },
              vel: { x: Math.cos(p.angle) * 800, y: Math.sin(p.angle) * 800 },
              damage: weaponData.damage,
              radius: 4,
              color: '#ffff00',
              life: 2,
              source: 'PLAYER'
            });
          }
        }
      }
    }

    // Ship machine gun controlled by player in flight
    if (this.state.phase === 'FLIGHT' && this.state.ship.hasMachineGun && this.state.keys['mousedown']) {
      const now = performance.now() / 1000;
      if (now - this.state.ship.lastShotTime >= 0.1) {
        this.state.ship.lastShotTime = now;
        const worldMouseX = this.state.mousePos.x + this.state.camera.x;
        const worldMouseY = this.state.mousePos.y + this.state.camera.y;
        const angle = Math.atan2(worldMouseY - this.state.ship.pos.y, worldMouseX - this.state.ship.pos.x);
        
        this.state.projectiles.push({
          id: Math.random().toString(),
          pos: { x: this.state.ship.pos.x, y: this.state.ship.pos.y },
          vel: { x: Math.cos(angle) * 1000, y: Math.sin(angle) * 1000 },
          damage: GAME_CONSTANTS.SHIP.MACHINE_GUN_DAMAGE,
          radius: 5,
          color: '#00ffff',
          life: 2,
          source: 'SHIP'
        });
      }
    }
  }

  private meleeAttack(pos: Vector2, angle: number, range: number, damage: number) {
    for (const e of this.state.enemies) {
      const dist = Math.hypot(e.pos.x - pos.x, e.pos.y - pos.y);
      if (dist <= range) {
        // Simple angle check
        const angleToEnemy = Math.atan2(e.pos.y - pos.y, e.pos.x - pos.x);
        let angleDiff = angleToEnemy - angle;
        while (angleDiff <= -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        
        if (Math.abs(angleDiff) < Math.PI / 4) {
          e.hp -= damage;
        }
      }
    }
  }

  private updateCamera() {
    let targetX = this.state.player.pos.x - this.canvas.width / 2;
    let targetY = this.state.player.pos.y - this.canvas.height / 2;
    
    if (this.state.phase === 'TAKEOFF' || this.state.phase === 'FLIGHT' || this.state.phase === 'LANDING') {
      targetX = this.state.ship.pos.x - this.canvas.width / 2;
      targetY = this.state.ship.pos.y - this.canvas.height / 2;
    }
    
    // Smooth camera
    this.state.camera.x += (targetX - this.state.camera.x) * 0.1;
    this.state.camera.y += (targetY - this.state.camera.y) * 0.1;

    // Clamp camera
    this.state.camera.x = Math.max(0, Math.min(GAME_CONSTANTS.MAP_SIZE - this.canvas.width, this.state.camera.x));
    this.state.camera.y = Math.max(0, Math.min(GAME_CONSTANTS.MAP_SIZE - this.canvas.height, this.state.camera.y));
  }

  private updateProjectiles(dt: number) {
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const p = this.state.projectiles[i];
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.life -= dt;

      let hit = false;
      if (p.source === 'PLAYER' || p.source === 'SHIP') {
        for (const e of this.state.enemies) {
          if (Math.hypot(e.pos.x - p.pos.x, e.pos.y - p.pos.y) < e.radius + p.radius) {
            e.hp -= p.damage;
            hit = true;
            break;
          }
        }
      } else if (p.source === 'ENEMY') {
        if (Math.hypot(this.state.player.pos.x - p.pos.x, this.state.player.pos.y - p.pos.y) < this.state.player.radius + p.radius) {
          this.state.player.hp -= p.damage;
          hit = true;
        }
      }

      if (hit || p.life <= 0) {
        this.state.projectiles.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    const now = performance.now() / 1000;
    for (let i = this.state.enemies.length - 1; i >= 0; i--) {
      const e = this.state.enemies[i];
      
      if (e.hp <= 0) {
        this.state.totalKills++;
        this.dropItem(e.pos);
        this.state.enemies.splice(i, 1);
        continue;
      }

      // Determine enemy building
      let enemyBuildingId: string | null = null;
      for (const b of this.state.buildings) {
        if (e.pos.x >= b.pos.x && e.pos.x <= b.pos.x + b.size.x && e.pos.y >= b.pos.y && e.pos.y <= b.pos.y + b.size.y) {
          enemyBuildingId = b.id;
          break;
        }
      }

      // If enemy is inside a building but player is not in THAT building, they stay put or patrol
      if (enemyBuildingId && enemyBuildingId !== this.state.currentBuildingId) {
        // Optional: Add simple patrol logic here
        continue;
      }

      // Target selection
      let target = this.state.player.pos;
      if (this.state.phase === 'FLIGHT') {
        target = this.state.ship.pos;
      }

      // Pathfinding
      if (this.state.currentBuildingId) {
        const b = this.state.buildings.find(b => b.id === this.state.currentBuildingId)!;
        
        // Check if enemy is inside the same building
        const relEx = e.pos.x - b.pos.x;
        const relEy = e.pos.y - b.pos.y;
        const relPx = this.state.player.pos.x - b.pos.x;
        const relPy = this.state.player.pos.y - b.pos.y;

        if (relEx >= 0 && relEx < b.size.x && relEy >= 0 && relEy < b.size.y) {
          // Recalculate path occasionally or if no path
          if (!e.path || e.path.length === 0 || Math.random() < 0.02) {
            e.path = this.dijkstra(b.maze, { x: relEx, y: relEy }, { x: relPx, y: relPy });
          }

          if (e.path && e.path.length > 0) {
            const nextNode = e.path[0];
            const worldNextNode = { x: b.pos.x + nextNode.x, y: b.pos.y + nextNode.y };
            const dx = worldNextNode.x - e.pos.x;
            const dy = worldNextNode.y - e.pos.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 5) {
              e.path.shift();
            } else {
              const nextEx = e.pos.x + (dx / dist) * e.speed * dt;
              const nextEy = e.pos.y + (dy / dist) * e.speed * dt;
              
              // Collision check for enemies inside maze
              const relNextEx = nextEx - b.pos.x;
              const relNextEy = nextEy - b.pos.y;
              const gx = Math.floor(relNextEx / b.maze.cellSize);
              const gy = Math.floor(relNextEy / b.maze.cellSize);
              
              if (gx >= 0 && gx < b.maze.cols && gy >= 0 && gy < b.maze.rows) {
                if (b.maze.grid[gy][gx] === 0) {
                  e.pos.x = nextEx;
                  e.pos.y = nextEy;
                } else {
                  // Nudge away from wall
                  const centerX = b.pos.x + gx * b.maze.cellSize + b.maze.cellSize / 2;
                  const centerY = b.pos.y + gy * b.maze.cellSize + b.maze.cellSize / 2;
                  const nudgeX = (e.pos.x - centerX) * 0.1;
                  const nudgeY = (e.pos.y - centerY) * 0.1;
                  e.pos.x += nudgeX;
                  e.pos.y += nudgeY;
                }
              }
            }
          } else {
            // Fallback to direct movement with collision check
            const angle = Math.atan2(target.y - e.pos.y, target.x - e.pos.x);
            const nextEx = e.pos.x + Math.cos(angle) * e.speed * dt;
            const nextEy = e.pos.y + Math.sin(angle) * e.speed * dt;
            
            const relNextEx = nextEx - b.pos.x;
            const relNextEy = nextEy - b.pos.y;
            const gx = Math.floor(relNextEx / b.maze.cellSize);
            const gy = Math.floor(relNextEy / b.maze.cellSize);
            
            if (gx >= 0 && gx < b.maze.cols && gy >= 0 && gy < b.maze.rows) {
              if (b.maze.grid[gy][gx] === 0) {
                e.pos.x = nextEx;
                e.pos.y = nextEy;
              } else {
                // Nudge away from wall
                const centerX = b.pos.x + gx * b.maze.cellSize + b.maze.cellSize / 2;
                const centerY = b.pos.y + gy * b.maze.cellSize + b.maze.cellSize / 2;
                const nudgeX = (e.pos.x - centerX) * 0.1;
                const nudgeY = (e.pos.y - centerY) * 0.1;
                e.pos.x += nudgeX;
                e.pos.y += nudgeY;
              }
            }
          }
        } else {
          // Enemy outside, move towards entrance
          const entranceWorld = { x: b.pos.x + b.entrancePos.x, y: b.pos.y + b.entrancePos.y };
          const dx = entranceWorld.x - e.pos.x;
          const dy = entranceWorld.y - e.pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 5) {
            const nextEx = e.pos.x + (dx / dist) * e.speed * dt;
            const nextEy = e.pos.y + (dy / dist) * e.speed * dt;
            
            let canMove = true;
            for (const otherB of this.state.buildings) {
              const entranceWorldX = otherB.pos.x + otherB.entrancePos.x;
              const entranceWorldY = otherB.pos.y + otherB.entrancePos.y;
              
              // Doorway area: allow enemy to walk into the entrance area
              const doorWidth = 100;
              const doorDepth = 60;
              const isInDoorway = Math.abs(nextEx - entranceWorldX) < doorWidth / 2 && 
                                 nextEy > entranceWorldY - doorDepth && 
                                 nextEy < entranceWorldY + doorDepth;

              if (isInDoorway) {
                canMove = true;
                break;
              }

              // Check if colliding with building bounding box
              if (nextEx > otherB.pos.x - e.radius && nextEx < otherB.pos.x + otherB.size.x + e.radius &&
                  nextEy > otherB.pos.y - e.radius && nextEy < otherB.pos.y + otherB.size.y + e.radius) {
                canMove = false;
                break;
              }
            }
            
            if (canMove) {
              e.pos.x = nextEx;
              e.pos.y = nextEy;
            } else {
              // Slide around building
              const angle = Math.atan2(dy, dx);
              e.pos.x += Math.cos(angle + Math.PI/2) * e.speed * dt * 0.5;
              e.pos.y += Math.sin(angle + Math.PI/2) * e.speed * dt * 0.5;
            }
          }
        }
      } else {
        // Normal movement outside
        const dx = target.x - e.pos.x;
        const dy = target.y - e.pos.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
          const nextX = e.pos.x + (dx / dist) * e.speed * dt;
          const nextY = e.pos.y + (dy / dist) * e.speed * dt;
          
          let canMove = true;
          for (const b of this.state.buildings) {
            const entranceWorldX = b.pos.x + b.entrancePos.x;
            const entranceWorldY = b.pos.y + b.entrancePos.y;
            
            // Doorway area: allow enemy to walk into the entrance area
            const doorWidth = 100;
            const doorDepth = 60;
            const isInDoorway = Math.abs(nextX - entranceWorldX) < doorWidth / 2 && 
                               nextY > entranceWorldY - doorDepth && 
                               nextY < entranceWorldY + doorDepth;

            if (isInDoorway) {
              canMove = true;
              break;
            }

            // Check if colliding with building bounding box
            if (nextX > b.pos.x - e.radius && nextX < b.pos.x + b.size.x + e.radius &&
                nextY > b.pos.y - e.radius && nextY < b.pos.y + b.size.y + e.radius) {
              canMove = false;
              break;
            }
          }

          if (canMove) {
            e.pos.x = nextX;
            e.pos.y = nextY;
          } else {
            // If blocked, try to slide
            const angle = Math.atan2(dy, dx);
            e.pos.x += Math.cos(angle + Math.PI/2) * e.speed * dt * 0.5;
            e.pos.y += Math.sin(angle + Math.PI/2) * e.speed * dt * 0.5;
          }
        }
      }

      // Attack
      const distToTarget = Math.hypot(target.x - e.pos.x, target.y - e.pos.y);
      if (distToTarget < e.radius + 30 && now - e.lastAttackTime > 1) {
        e.lastAttackTime = now;
        if (this.state.phase === 'FLIGHT' && distToTarget < e.radius + this.state.ship.radius) {
          if (this.state.ship.armor > 0) {
            this.state.ship.armor -= e.damage;
            if (this.state.ship.armor < 0) {
              this.state.ship.hp += this.state.ship.armor; // overflow damage
              this.state.ship.armor = 0;
            }
          } else {
            this.state.ship.hp -= e.damage;
          }
        } else if (distToTarget < e.radius + this.state.player.radius) {
          this.state.player.hp -= e.damage;
        }
      }
    }
  }

  private dropItem(pos: Vector2) {
    if (Math.random() > 0.4) return; // 40% drop chance

    const items = Object.keys(GAME_CONSTANTS.ITEMS).filter(k => k !== 'SHIP_MACHINE_GUN' && k !== 'SHIP_ARMOR');
    const randomItem = items[Math.floor(Math.random() * items.length)];
    
    this.state.items.push({
      id: Math.random().toString(),
      pos: { x: pos.x + (Math.random() - 0.5) * 20, y: pos.y + (Math.random() - 0.5) * 20 },
      type: randomItem,
      radius: 12,
      color: '#ffffff',
      buildingId: this.state.currentBuildingId
    });
  }

  private updateItems() {
    for (let i = this.state.items.length - 1; i >= 0; i--) {
      const item = this.state.items[i];
      
      // Only pick up items in the same building (or both outside)
      if (item.buildingId !== this.state.currentBuildingId) continue;

      if (Math.hypot(this.state.player.pos.x - item.pos.x, this.state.player.pos.y - item.pos.y) < this.state.player.radius + item.radius) {
        
        // Auto pickup ammo
        const itemData = GAME_CONSTANTS.ITEMS[item.type as keyof typeof GAME_CONSTANTS.ITEMS];
        if (itemData.type === 'AMMO') {
          if (item.type === 'PISTOL_AMMO') this.state.player.ammo.PISTOL += (itemData as any).amount;
          if (item.type === 'AK47_AMMO') this.state.player.ammo.AK47 += (itemData as any).amount;
        } else if (itemData.type === 'UPGRADE') {
          // Auto apply upgrades to ship
          if (item.type === 'SHIP_MACHINE_GUN') {
            this.state.ship.hasMachineGun = true;
          } else if (item.type === 'SHIP_ARMOR') {
            this.state.ship.maxArmor += GAME_CONSTANTS.SHIP.UPGRADE_ARMOR_BONUS;
            this.state.ship.armor += GAME_CONSTANTS.SHIP.UPGRADE_ARMOR_BONUS;
          }
        } else {
          // Add to inventory
          const existing = this.state.player.inventory.find(i => i.type === item.type);
          if (existing) {
            existing.count++;
          } else {
            this.state.player.inventory.push({ id: Math.random().toString(), type: item.type, count: 1 });
          }
        }
        
        this.state.items.splice(i, 1);
      }
    }
  }

  private draw() {
    // Background
    this.ctx.fillStyle = '#16161e'; // Muted dark blue/gray
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.state.camera.x, -this.state.camera.y);

    // Draw Buildings
    for (const b of this.state.buildings) {
      // 2.5D Effect: Draw shadow and height
      const height = 60;
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.ctx.fillRect(b.pos.x + 15, b.pos.y + 15, b.size.x, b.size.y + height);

      // Side walls (2.5D depth)
      const wallGrad = this.ctx.createLinearGradient(b.pos.x, b.pos.y + b.size.y, b.pos.x, b.pos.y + b.size.y + height);
      wallGrad.addColorStop(0, '#1e293b');
      wallGrad.addColorStop(1, '#0f172a');
      this.ctx.fillStyle = wallGrad;
      
      this.ctx.beginPath();
      this.ctx.moveTo(b.pos.x, b.pos.y + b.size.y);
      this.ctx.lineTo(b.pos.x, b.pos.y + b.size.y + height);
      this.ctx.lineTo(b.pos.x + b.size.x, b.pos.y + b.size.y + height);
      this.ctx.lineTo(b.pos.x + b.size.x, b.pos.y + b.size.y);
      this.ctx.fill();

      // Roof (Top face)
      const roofGrad = this.ctx.createLinearGradient(b.pos.x, b.pos.y, b.pos.x + b.size.x, b.pos.y + b.size.y);
      roofGrad.addColorStop(0, '#334155');
      roofGrad.addColorStop(1, '#475569');
      this.ctx.fillStyle = roofGrad;
      this.ctx.fillRect(b.pos.x, b.pos.y, b.size.x, b.size.y);
      
      // Decorative roof details (HVAC, vents, etc.)
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(b.pos.x + 20, b.pos.y + 20, 40, 40); // HVAC unit
      this.ctx.strokeStyle = '#64748b';
      this.ctx.strokeRect(b.pos.x + 20, b.pos.y + 20, 40, 40);
      
      // Decorative roof lines
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      this.ctx.lineWidth = 1;
      for (let i = 50; i < b.size.x; i += 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(b.pos.x + i, b.pos.y);
        this.ctx.lineTo(b.pos.x + i, b.pos.y + b.size.y);
        this.ctx.stroke();
      }
      for (let i = 50; i < b.size.y; i += 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(b.pos.x, b.pos.y + i);
        this.ctx.lineTo(b.pos.x + b.size.x, b.pos.y + i);
        this.ctx.stroke();
      }

      // Exterior walls outline
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(b.pos.x, b.pos.y, b.size.x, b.size.y);
      
      // Windows on the side wall
      this.ctx.fillStyle = '#fbbf24'; // Lit windows
      const winSize = 15;
      const winSpacing = 40;
      for (let wx = b.pos.x + 30; wx < b.pos.x + b.size.x - 30; wx += winSpacing) {
        this.ctx.globalAlpha = Math.sin(wx + this.lastTime) > 0 ? 0.8 : 0.2;
        this.ctx.fillRect(wx, b.pos.y + b.size.y + 15, winSize, winSize);
      }
      this.ctx.globalAlpha = 1.0;
      
      // Entrance / Doorway
      const doorWidth = 80;
      const doorHeight = 50;
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(b.pos.x + b.entrancePos.x - doorWidth/2, b.pos.y + b.entrancePos.y - doorHeight/2, doorWidth, doorHeight);
      
      // Door frame
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(b.pos.x + b.entrancePos.x - doorWidth/2, b.pos.y + b.entrancePos.y - doorHeight/2, doorWidth, doorHeight);
      
      // Interior (if player inside)
      if (this.state.currentBuildingId === b.id) {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(b.pos.x, b.pos.y, b.size.x, b.size.y);
        
        this.ctx.fillStyle = '#334155'; // Maze walls
        for (let r = 0; r < b.maze.rows; r++) {
          for (let c = 0; c < b.maze.cols; c++) {
            if (b.maze.grid[r][c] === 1) {
              this.ctx.fillRect(b.pos.x + c * b.maze.cellSize, b.pos.y + r * b.maze.cellSize, b.maze.cellSize, b.maze.cellSize);
            }
          }
        }
      }
    }

    // Global style settings
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
    const OUTLINE_COLOR = '#111111';
    const OUTLINE_WIDTH = 4;

    // Draw speed lines if flying
    if (this.state.phase === 'FLIGHT' || this.state.phase === 'TAKEOFF' || this.state.phase === 'LANDING') {
        let speedAlpha = 0;
        if (this.state.phase === 'FLIGHT') speedAlpha = 0.3;
        else if (this.state.phase === 'TAKEOFF') speedAlpha = Math.max(0, Math.min(0.3, 0.3 * (this.state.transitionTimer / 3)));
        else if (this.state.phase === 'LANDING') speedAlpha = Math.max(0, Math.min(0.3, 0.3 * (1 - this.state.transitionTimer / 3)));

        this.ctx.globalAlpha = speedAlpha;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        for(let i=0; i<50; i++) {
            const lx = this.state.camera.x + (Math.sin(i * 123.45) * 0.5 + 0.5) * this.canvas.width;
            const ly = this.state.camera.y + (this.lastTime * 2 + i * 987) % this.canvas.height;
            const len = 50 + Math.random() * 100;
            this.ctx.moveTo(lx, ly);
            this.ctx.lineTo(lx, ly + len);
        }
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    // Draw Map Boundaries
    if (this.state.phase === 'GROUND' || this.state.phase === 'TAKEOFF' || this.state.phase === 'LANDING') {
      let alpha = 1;
      if (this.state.phase === 'TAKEOFF') alpha = Math.max(0, Math.min(1, 1 - (this.state.transitionTimer / 3)));
      if (this.state.phase === 'LANDING') alpha = Math.max(0, Math.min(1, (this.state.transitionTimer / 3)));
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = '#ff0055';
      this.ctx.lineWidth = 10;
      this.ctx.setLineDash([20, 20]);
      this.ctx.strokeRect(0, 0, GAME_CONSTANTS.MAP_SIZE, GAME_CONSTANTS.MAP_SIZE);
      this.ctx.setLineDash([]);
      this.ctx.globalAlpha = 1;
    }

    const drawables: { type: string, y: number, data?: any }[] = [];

    drawables.push({ type: 'SHIP', y: this.state.ship.pos.y + 40 });

    for (const item of this.state.items) {
      if (item.buildingId !== this.state.currentBuildingId) continue;
      if (item.pos.x < this.state.camera.x - 50 || item.pos.x > this.state.camera.x + this.canvas.width + 50 ||
          item.pos.y < this.state.camera.y - 50 || item.pos.y > this.state.camera.y + this.canvas.height + 50) {
        continue;
      }
      drawables.push({ type: 'ITEM', y: item.pos.y + item.radius, data: item });
    }

    for (const e of this.state.enemies) {
      let enemyBuildingId: string | null = null;
      for (const b of this.state.buildings) {
        if (e.pos.x >= b.pos.x && e.pos.x <= b.pos.x + b.size.x && e.pos.y >= b.pos.y && e.pos.y <= b.pos.y + b.size.y) {
          enemyBuildingId = b.id;
          break;
        }
      }

      if (enemyBuildingId !== this.state.currentBuildingId) continue;

      drawables.push({ type: 'ENEMY', y: e.pos.y + e.radius, data: e });
    }

    if (this.state.phase === 'GROUND') {
      drawables.push({ type: 'PLAYER', y: this.state.player.pos.y + this.state.player.radius });
    }

    for (const dec of this.state.decorations) {
      if (dec.type === 'SKULL') {
        if (dec.x < this.state.camera.x - 100 || dec.x > this.state.camera.x + this.canvas.width + 100 ||
            dec.y < this.state.camera.y - 100 || dec.y > this.state.camera.y + this.canvas.height + 100) {
          continue;
        }
        drawables.push({ type: 'SKULL', y: dec.y + 10, data: dec });
      }
    }

    drawables.sort((a, b) => a.y - b.y);

    for (const drawable of drawables) {
      if (drawable.type === 'SHIP') {
        // Draw Ship
        this.ctx.save();
        this.ctx.translate(this.state.ship.pos.x, this.state.ship.pos.y);
    
    // Scale ship during takeoff/landing to simulate height
    let shipScale = 1;
    if (this.state.phase === 'TAKEOFF') {
        shipScale = 1 + Math.min(1, this.state.transitionTimer / 3) * 0.5; // grows to 1.5x
    } else if (this.state.phase === 'FLIGHT') {
        shipScale = 1.5;
    } else if (this.state.phase === 'LANDING') {
        shipScale = 1.5 - Math.min(1, this.state.transitionTimer / 3) * 0.5; // shrinks back to 1x
    }
    this.ctx.scale(shipScale, shipScale);
    
    // Ship shadow
    if (this.state.phase === 'GROUND' || this.state.phase === 'TAKEOFF' || this.state.phase === 'LANDING') {
      let shadowAlpha = 0.5;
      if (this.state.phase === 'TAKEOFF') shadowAlpha = Math.max(0, Math.min(0.5, 0.5 * (1 - this.state.transitionTimer / 3)));
      if (this.state.phase === 'LANDING') shadowAlpha = Math.max(0, Math.min(0.5, 0.5 * (this.state.transitionTimer / 3)));
      this.ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 40, this.state.ship.radius, this.state.ship.radius * 0.4, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Thruster flames
    if (this.state.phase !== 'GROUND') {
        const flameLength = 30 + Math.random() * 30;
        this.ctx.fillStyle = '#f97316'; // Orange
        this.ctx.beginPath();
        this.ctx.moveTo(-20, this.state.ship.radius * 1.1);
        this.ctx.lineTo(0, this.state.ship.radius * 1.1 + flameLength);
        this.ctx.lineTo(20, this.state.ship.radius * 1.1);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fef08a'; // Yellow
        this.ctx.beginPath();
        this.ctx.moveTo(-10, this.state.ship.radius * 1.1);
        this.ctx.lineTo(0, this.state.ship.radius * 1.1 + flameLength * 0.6);
        this.ctx.lineTo(10, this.state.ship.radius * 1.1);
        this.ctx.fill();
    }

    // Ship Body
    // Wings
    this.ctx.fillStyle = '#334155';
    this.ctx.beginPath(); this.ctx.moveTo(-this.state.ship.radius, 0); this.ctx.lineTo(-this.state.ship.radius - 20, 20); this.ctx.lineTo(-this.state.ship.radius, 30); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(this.state.ship.radius, 0); this.ctx.lineTo(this.state.ship.radius + 20, 20); this.ctx.lineTo(this.state.ship.radius, 30); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();

    // Main hull
    this.ctx.fillStyle = '#4b5563'; // Slate gray
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, this.state.ship.radius, this.state.ship.radius * 1.2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = OUTLINE_COLOR;
    this.ctx.lineWidth = OUTLINE_WIDTH;
    this.ctx.stroke();

    // Hull details/panels
    this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath(); this.ctx.moveTo(-15, 10); this.ctx.lineTo(15, 10); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.moveTo(-10, 20); this.ctx.lineTo(10, 20); this.ctx.stroke();
    this.ctx.strokeStyle = OUTLINE_COLOR;
    this.ctx.lineWidth = OUTLINE_WIDTH;

    // Ship Window
    this.ctx.fillStyle = '#06b6d4'; // Cyan window
    this.ctx.beginPath();
    this.ctx.ellipse(0, -10, this.state.ship.radius * 0.6, this.state.ship.radius * 0.4, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    // Window reflection
    this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
    this.ctx.beginPath();
    this.ctx.ellipse(-8, -15, this.state.ship.radius * 0.2, this.state.ship.radius * 0.1, Math.PI/6, 0, Math.PI * 2);
    this.ctx.fill();

    // Engine nozzles
    this.ctx.fillStyle = '#1e293b';
    this.ctx.beginPath(); this.ctx.rect(-15, this.state.ship.radius * 1.1, 10, 8); this.ctx.fill(); this.ctx.stroke();
    this.ctx.beginPath(); this.ctx.rect(5, this.state.ship.radius * 1.1, 10, 8); this.ctx.fill(); this.ctx.stroke();

    // Ship Machine Gun
    if (this.state.ship.hasMachineGun) {
      // Base mount
      this.ctx.fillStyle = '#374151';
      this.ctx.beginPath(); this.ctx.rect(-12, -this.state.ship.radius - 15, 24, 20); this.ctx.fill(); this.ctx.stroke();
      
      // Barrel details
      this.ctx.fillStyle = '#1f2937';
      this.ctx.fillRect(-8, -this.state.ship.radius - 30, 6, 20); this.ctx.strokeRect(-8, -this.state.ship.radius - 30, 6, 20);
      this.ctx.fillRect(2, -this.state.ship.radius - 30, 6, 20); this.ctx.strokeRect(2, -this.state.ship.radius - 30, 6, 20);
      
      // Muzzle flash guard
      this.ctx.fillStyle = '#475569';
      this.ctx.fillRect(-10, -this.state.ship.radius - 35, 10, 5); this.ctx.strokeRect(-10, -this.state.ship.radius - 35, 10, 5);
      this.ctx.fillRect(0, -this.state.ship.radius - 35, 10, 5); this.ctx.strokeRect(0, -this.state.ship.radius - 35, 10, 5);
    }
    
    this.ctx.restore();

    // Ship HP bar
    this.ctx.fillStyle = OUTLINE_COLOR;
    this.ctx.fillRect(this.state.ship.pos.x - 42, this.state.ship.pos.y - 82, 84, 9);
    this.ctx.fillStyle = '#ef4444';
    this.ctx.fillRect(this.state.ship.pos.x - 40, this.state.ship.pos.y - 80, 80, 5);
    this.ctx.fillStyle = '#22c55e';
    this.ctx.fillRect(this.state.ship.pos.x - 40, this.state.ship.pos.y - 80, 80 * (this.state.ship.hp / this.state.ship.maxHp), 5);
    if (this.state.ship.armor > 0) {
      this.ctx.fillStyle = '#06b6d4';
      this.ctx.fillRect(this.state.ship.pos.x - 40, this.state.ship.pos.y - 85, 80 * (this.state.ship.armor / this.state.ship.maxArmor), 3);
    }

      } else if (drawable.type === 'ITEM') {
        const item = drawable.data;
        this.ctx.save();
      
      let alpha = 1;
      if (this.state.phase === 'TAKEOFF') alpha = Math.max(0, Math.min(1, 1 - (this.state.transitionTimer / 3)));
      if (this.state.phase === 'LANDING') alpha = Math.max(0, Math.min(1, (this.state.transitionTimer / 3)));
      if (this.state.phase === 'FLIGHT') alpha = 0;
      this.ctx.globalAlpha = alpha;

      this.ctx.translate(item.pos.x, item.pos.y);
      // Floating animation
      const floatY = Math.sin(this.lastTime / 200 + item.pos.x) * 5;
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.beginPath(); this.ctx.ellipse(0, 15, item.radius, item.radius*0.4, 0, 0, Math.PI*2); this.ctx.fill();

      this.ctx.translate(0, floatY);

      this.ctx.lineWidth = 3;
      this.ctx.strokeStyle = OUTLINE_COLOR;

      switch(item.type) {
        case 'BREAD':
          this.ctx.fillStyle = '#d97706'; // Amber 600
          this.ctx.beginPath(); this.ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          this.ctx.fillStyle = '#f59e0b'; // Amber 500
          this.ctx.beginPath(); this.ctx.ellipse(0, -2, 10, 6, 0, 0, Math.PI*2); this.ctx.fill();
          this.ctx.beginPath(); this.ctx.moveTo(-6, -2); this.ctx.lineTo(-2, -6); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.moveTo(2, -2); this.ctx.lineTo(6, -6); this.ctx.stroke();
          break;
        case 'CHICKEN':
          // Bone
          this.ctx.fillStyle = '#f3f4f6';
          this.ctx.beginPath(); this.ctx.rect(-14, -3, 12, 6); this.ctx.fill(); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.arc(-14, -4, 4, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.arc(-14, 4, 4, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          // Meat
          this.ctx.fillStyle = '#b45309';
          this.ctx.beginPath(); this.ctx.ellipse(4, 0, 12, 14, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          this.ctx.fillStyle = '#d97706';
          this.ctx.beginPath(); this.ctx.ellipse(2, -2, 6, 8, 0, 0, Math.PI*2); this.ctx.fill();
          break;
        case 'SYRINGE':
          // Plunger
          this.ctx.fillStyle = '#94a3b8';
          this.ctx.fillRect(-2, -14, 4, 6); this.ctx.strokeRect(-2, -14, 4, 6);
          this.ctx.fillRect(-6, -16, 12, 2); this.ctx.strokeRect(-6, -16, 12, 2);
          // Barrel
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.fillRect(-5, -8, 10, 16); this.ctx.strokeRect(-5, -8, 10, 16);
          // Liquid
          this.ctx.fillStyle = '#22c55e';
          this.ctx.fillRect(-5, 0, 10, 8);
          // Lines
          this.ctx.beginPath(); this.ctx.moveTo(-5, -4); this.ctx.lineTo(-2, -4); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.moveTo(-5, 0); this.ctx.lineTo(-2, 0); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.moveTo(-5, 4); this.ctx.lineTo(-2, 4); this.ctx.stroke();
          // Needle
          this.ctx.fillStyle = '#cbd5e1';
          this.ctx.fillRect(-1, 8, 2, 6); this.ctx.strokeRect(-1, 8, 2, 6);
          break;
        case 'BANDAGE':
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.beginPath(); this.ctx.rect(-10, -10, 20, 20); this.ctx.fill(); this.ctx.stroke();
          // Tape lines
          this.ctx.strokeStyle = '#cbd5e1';
          this.ctx.beginPath(); this.ctx.moveTo(-10, -5); this.ctx.lineTo(10, -5); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.moveTo(-10, 5); this.ctx.lineTo(10, 5); this.ctx.stroke();
          this.ctx.strokeStyle = OUTLINE_COLOR;
          // Cross
          this.ctx.fillStyle = '#ef4444';
          this.ctx.fillRect(-3, -7, 6, 14); this.ctx.fillRect(-7, -3, 14, 6);
          break;
        case 'ENERGY_DRINK':
          // Can body
          this.ctx.fillStyle = '#0ea5e9';
          this.ctx.beginPath(); this.ctx.rect(-8, -12, 16, 24); this.ctx.fill(); this.ctx.stroke();
          // Can top/bottom
          this.ctx.fillStyle = '#cbd5e1';
          this.ctx.beginPath(); this.ctx.ellipse(0, -12, 8, 3, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.ellipse(0, 12, 8, 3, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          // Lightning bolt
          this.ctx.fillStyle = '#fde047';
          this.ctx.beginPath(); this.ctx.moveTo(-2, -6); this.ctx.lineTo(4, -6); this.ctx.lineTo(0, 0); this.ctx.lineTo(5, 0); this.ctx.lineTo(-4, 8); this.ctx.lineTo(-1, 2); this.ctx.lineTo(-6, 2); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
          break;
        case 'PISTOL_AMMO':
          // Box
          this.ctx.fillStyle = '#475569';
          this.ctx.beginPath(); this.ctx.rect(-8, -8, 16, 16); this.ctx.fill(); this.ctx.stroke();
          this.ctx.fillStyle = '#eab308';
          this.ctx.fillRect(-8, -2, 16, 10);
          this.ctx.beginPath(); this.ctx.moveTo(-8, -2); this.ctx.lineTo(8, -2); this.ctx.stroke();
          // Bullets inside
          this.ctx.fillStyle = '#ca8a04';
          this.ctx.beginPath(); this.ctx.arc(-3, -4, 2, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.arc(3, -4, 2, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          break;
        case 'AK47_AMMO':
          // Box
          this.ctx.fillStyle = '#166534';
          this.ctx.beginPath(); this.ctx.rect(-10, -8, 20, 16); this.ctx.fill(); this.ctx.stroke();
          this.ctx.fillStyle = '#4ade80';
          this.ctx.fillRect(-10, 0, 20, 8);
          this.ctx.beginPath(); this.ctx.moveTo(-10, 0); this.ctx.lineTo(10, 0); this.ctx.stroke();
          // Bullets inside
          this.ctx.fillStyle = '#fef08a';
          this.ctx.beginPath(); this.ctx.ellipse(-4, -3, 2, 4, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          this.ctx.beginPath(); this.ctx.ellipse(4, -3, 2, 4, 0, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          break;
        case 'SHIP_MACHINE_GUN':
          // Base
          this.ctx.fillStyle = '#1e293b';
          this.ctx.beginPath(); this.ctx.rect(-12, -8, 24, 16); this.ctx.fill(); this.ctx.stroke();
          // Details
          this.ctx.fillStyle = '#334155';
          this.ctx.fillRect(-8, -4, 16, 8);
          // Barrels
          this.ctx.fillStyle = '#64748b';
          this.ctx.fillRect(-16, -6, 8, 4); this.ctx.strokeRect(-16, -6, 8, 4);
          this.ctx.fillRect(-16, 2, 8, 4); this.ctx.strokeRect(-16, 2, 8, 4);
          // Muzzles
          this.ctx.fillStyle = '#f59e0b';
          this.ctx.fillRect(-18, -6, 2, 4);
          this.ctx.fillRect(-18, 2, 2, 4);
          // Ammo drum
          this.ctx.fillStyle = '#475569';
          this.ctx.beginPath(); this.ctx.arc(0, 0, 6, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
          break;
        case 'SHIP_ARMOR':
          // Main plate
          this.ctx.fillStyle = '#0891b2';
          this.ctx.beginPath(); this.ctx.moveTo(0, -16); this.ctx.lineTo(14, -8); this.ctx.lineTo(14, 8); this.ctx.lineTo(0, 16); this.ctx.lineTo(-14, 8); this.ctx.lineTo(-14, -8); this.ctx.closePath();
          this.ctx.fill(); this.ctx.stroke();
          // Inner plate
          this.ctx.fillStyle = '#22d3ee';
          this.ctx.beginPath(); this.ctx.moveTo(0, -10); this.ctx.lineTo(8, -5); this.ctx.lineTo(8, 5); this.ctx.lineTo(0, 10); this.ctx.lineTo(-8, 5); this.ctx.lineTo(-8, -5); this.ctx.closePath();
          this.ctx.fill(); this.ctx.stroke();
          // Rivets
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath(); this.ctx.arc(0, -12, 1.5, 0, Math.PI*2); this.ctx.fill();
          this.ctx.beginPath(); this.ctx.arc(0, 12, 1.5, 0, Math.PI*2); this.ctx.fill();
          this.ctx.beginPath(); this.ctx.arc(-10, 0, 1.5, 0, Math.PI*2); this.ctx.fill();
          this.ctx.beginPath(); this.ctx.arc(10, 0, 1.5, 0, Math.PI*2); this.ctx.fill();
          break;
        default:
          this.ctx.fillStyle = '#fff';
          this.ctx.beginPath(); this.ctx.arc(0, 0, item.radius, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
      }
      
      this.ctx.restore();
    } else if (drawable.type === 'ENEMY') {
        const e = drawable.data;
        this.ctx.save();
      this.ctx.translate(e.pos.x, e.pos.y);
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
      this.ctx.beginPath(); this.ctx.ellipse(0, e.radius, e.radius, e.radius*0.4, 0, 0, Math.PI*2); this.ctx.fill();

      // Wobble animation
      const wobble = Math.sin(this.lastTime / 100 + e.id) * 0.1;
      this.ctx.rotate(wobble);

      // Body (Stylized blob/creature)
      this.ctx.fillStyle = e.color;
      
      // Tentacles/Spikes
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + this.lastTime / 500;
        const tentacleLength = e.radius * 1.5 + Math.sin(this.lastTime / 100 + i) * e.radius * 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(Math.cos(angle - 0.2) * e.radius * 0.8, Math.sin(angle - 0.2) * e.radius * 0.8 - e.radius * 0.5);
        this.ctx.quadraticCurveTo(
          Math.cos(angle) * tentacleLength, Math.sin(angle) * tentacleLength - e.radius * 0.5,
          Math.cos(angle + 0.2) * e.radius * 0.8, Math.sin(angle + 0.2) * e.radius * 0.8 - e.radius * 0.5
        );
        this.ctx.fill();
        this.ctx.stroke();
      }

      this.ctx.beginPath();
      const points = 8;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = e.radius + Math.sin(angle * 4 + this.lastTime / 200) * (e.radius * 0.1);
        if (i === 0) this.ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r - e.radius * 0.5);
        else this.ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r - e.radius * 0.5);
      }
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.strokeStyle = OUTLINE_COLOR;
      this.ctx.lineWidth = OUTLINE_WIDTH;
      this.ctx.stroke();
      
      // Big Cyclops Eye
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, -e.radius * 0.7, e.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Pupil (looking at player/ship)
      let target = this.state.phase === 'FLIGHT' ? this.state.ship.pos : this.state.player.pos;
      const lookAngle = Math.atan2(target.y - e.pos.y, target.x - e.pos.x);
      
      // Iris
      this.ctx.fillStyle = '#ef4444'; // Red iris
      this.ctx.beginPath();
      this.ctx.arc(Math.cos(lookAngle) * e.radius * 0.15, -e.radius * 0.7 + Math.sin(lookAngle) * e.radius * 0.15, e.radius * 0.2, 0, Math.PI * 2);
      this.ctx.fill();

      // Pupil
      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(Math.cos(lookAngle) * e.radius * 0.15, -e.radius * 0.7 + Math.sin(lookAngle) * e.radius * 0.15, e.radius * 0.1, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Eye highlight
      this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
      this.ctx.beginPath();
      this.ctx.arc(Math.cos(lookAngle) * e.radius * 0.15 - 2, -e.radius * 0.7 + Math.sin(lookAngle) * e.radius * 0.15 - 2, e.radius * 0.05, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();

      // Enemy HP
      this.ctx.fillStyle = OUTLINE_COLOR;
      this.ctx.fillRect(e.pos.x - 16, e.pos.y - e.radius - 16, 32, 6);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillRect(e.pos.x - 15, e.pos.y - e.radius - 15, 30, 4);
      this.ctx.fillStyle = '#22c55e';
      this.ctx.fillRect(e.pos.x - 15, e.pos.y - e.radius - 15, 30 * (e.hp / e.maxHp), 4);
    } else if (drawable.type === 'PLAYER') {
        this.ctx.save();
      this.ctx.translate(this.state.player.pos.x, this.state.player.pos.y);
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
      this.ctx.beginPath(); this.ctx.ellipse(0, this.state.player.radius, this.state.player.radius, this.state.player.radius*0.4, 0, 0, Math.PI*2); this.ctx.fill();

      // Body rotation based on movement
      const isMoving = this.state.keys['w'] || this.state.keys['a'] || this.state.keys['s'] || this.state.keys['d'];
      const walkBob = isMoving ? Math.abs(Math.sin(this.lastTime / 100)) * -4 : 0;
      const walkRot = isMoving ? Math.sin(this.lastTime / 100) * 0.1 : 0;

      this.ctx.translate(0, walkBob);
      this.ctx.rotate(walkRot);

      // Flip based on aim angle
      const facingLeft = Math.abs(this.state.player.angle) > Math.PI / 2;
      if (facingLeft) {
        this.ctx.scale(-1, 1);
      }

      // Draw standing body
      // Legs
      this.ctx.fillStyle = '#0369a1';
      this.ctx.fillRect(-6, 0, 4, 15);
      this.ctx.fillRect(2, 0, 4, 15);

      // Torso
      this.ctx.fillStyle = '#0ea5e9'; // Cyan suit
      this.ctx.beginPath();
      this.ctx.rect(-10, -15, 20, 20);
      this.ctx.fill();
      this.ctx.strokeStyle = OUTLINE_COLOR;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // Backpack
      this.ctx.fillStyle = '#0284c7';
      this.ctx.beginPath();
      this.ctx.rect(-15, -12, 8, 14);
      this.ctx.fill();
      this.ctx.stroke();

      // Head/Helmet
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.beginPath();
      this.ctx.arc(0, -22, 12, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Visor
      this.ctx.fillStyle = '#1e293b';
      this.ctx.beginPath();
      this.ctx.ellipse(4, -22, 8, 5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Visor reflection
      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.ctx.beginPath();
      this.ctx.ellipse(2, -23, 3, 2, Math.PI/4, 0, Math.PI * 2);
      this.ctx.fill();

      // Weapon Hand
      this.ctx.save();
      // The hand should point towards the mouse.
      // Since we flipped the context if facingLeft, we need to adjust the angle
      let armAngle = this.state.player.angle;
      if (facingLeft) {
        armAngle = Math.PI - armAngle;
      }
      this.ctx.translate(0, -10); // Shoulder
      this.ctx.rotate(armAngle);
      this.ctx.translate(15, 0); // Hand position
      
      // Hand
      this.ctx.fillStyle = '#0ea5e9';
      this.ctx.beginPath(); this.ctx.arc(0, 0, 4, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke();
      
      // Weapon
      this.ctx.fillStyle = '#475569';
      if (this.state.player.weapon === 'KATANA') {
        // Handle
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(-8, -2, 12, 4); this.ctx.strokeRect(-8, -2, 12, 4);
        // Guard
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(4, -4, 3, 8); this.ctx.strokeRect(4, -4, 3, 8);
        // Blade
        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.beginPath(); this.ctx.moveTo(7, -1); this.ctx.lineTo(35, -1); this.ctx.lineTo(40, 1); this.ctx.lineTo(7, 2); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
      } else if (this.state.player.weapon === 'AK47') {
        // Stock
        this.ctx.fillStyle = '#92400e';
        this.ctx.fillRect(-10, -2, 8, 5); this.ctx.strokeRect(-10, -2, 8, 5);
        // Body
        this.ctx.fillStyle = '#334155';
        this.ctx.fillRect(-2, -3, 16, 6); this.ctx.strokeRect(-2, -3, 16, 6);
        // Barrel
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillRect(14, -1, 12, 3); this.ctx.strokeRect(14, -1, 12, 3);
        // Magazine
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath(); this.ctx.moveTo(4, 3); this.ctx.lineTo(10, 3); this.ctx.lineTo(8, 10); this.ctx.lineTo(2, 10); this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
      } else { // PISTOL
        // Grip
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(-2, 0, 5, 6); this.ctx.strokeRect(-2, 0, 5, 6);
        // Barrel
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillRect(-4, -3, 12, 5); this.ctx.strokeRect(-4, -3, 12, 5);
      }
      this.ctx.restore();
      this.ctx.restore();
    } else if (drawable.type === 'SKULL') {
        const dec = drawable.data;
        this.ctx.save();
        this.ctx.translate(dec.x, dec.y);
        this.ctx.rotate(dec.rotation);
        let alpha = 1;
        if (this.state.phase === 'TAKEOFF') alpha = Math.max(0, Math.min(1, 1 - (this.state.transitionTimer / 3)));
        if (this.state.phase === 'LANDING') alpha = Math.max(0, Math.min(1, (this.state.transitionTimer / 3)));
        if (this.state.phase === 'FLIGHT') alpha = 0;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.beginPath();
        this.ctx.arc(0, -5, 10, 0, Math.PI * 2);
        this.ctx.fillRect(-6, 0, 12, 8);
        this.ctx.fill();
        this.ctx.strokeStyle = OUTLINE_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        // Eyes
        this.ctx.fillStyle = OUTLINE_COLOR;
        this.ctx.beginPath(); this.ctx.arc(-4, -5, 3, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(4, -5, 3, 0, Math.PI * 2); this.ctx.fill();
        // Nose
        this.ctx.beginPath(); this.ctx.moveTo(0, -1); this.ctx.lineTo(-2, 2); this.ctx.lineTo(2, 2); this.ctx.fill();
        // Teeth
        this.ctx.beginPath(); this.ctx.moveTo(-4, 8); this.ctx.lineTo(-4, 4); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.moveTo(0, 8); this.ctx.lineTo(0, 4); this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.moveTo(4, 8); this.ctx.lineTo(4, 4); this.ctx.stroke();
        this.ctx.restore();
      }
    }

    // Draw Arrow pointing to ship
    if (this.state.phase === 'GROUND') {
      const dx = this.state.ship.pos.x - this.state.player.pos.x;
      const dy = this.state.ship.pos.y - this.state.player.pos.y;
      const dist = Math.hypot(dx, dy);
      
      if (dist > 300) {
        const angle = Math.atan2(dy, dx);
        this.ctx.save();
        this.ctx.translate(this.state.player.pos.x, this.state.player.pos.y);
        this.ctx.rotate(angle);
        
        // Pulsing animation
        const pulse = Math.sin(this.lastTime / 150) * 10;
        this.ctx.translate(120 + pulse, 0);
        
        // Stylized arrow
        this.ctx.fillStyle = '#fde047'; // Yellow
        this.ctx.strokeStyle = OUTLINE_COLOR;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(20, 0);
        this.ctx.lineTo(-10, -15);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Inner detail
        this.ctx.fillStyle = '#ca8a04';
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(-2, -6);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(-2, 6);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
      }

      // Draw Arrow pointing to machine gun
      const machineGun = this.state.items.find(i => i.type === 'SHIP_MACHINE_GUN');
      if (machineGun) {
        const mgDx = machineGun.pos.x - this.state.player.pos.x;
        const mgDy = machineGun.pos.y - this.state.player.pos.y;
        const mgDist = Math.hypot(mgDx, mgDy);
        
        if (mgDist > 300) {
          const angle = Math.atan2(mgDy, mgDx);
          this.ctx.save();
          this.ctx.translate(this.state.player.pos.x, this.state.player.pos.y);
          this.ctx.rotate(angle);
          
          // Pulsing animation
          const pulse = Math.sin(this.lastTime / 150) * 10;
          this.ctx.translate(100 + pulse, 0); // Slightly closer than ship arrow
          
          // Stylized arrow (Orange for weapon)
          this.ctx.fillStyle = '#f97316'; // Orange
          this.ctx.strokeStyle = OUTLINE_COLOR;
          this.ctx.lineWidth = 3;
          
          this.ctx.beginPath();
          this.ctx.moveTo(20, 0);
          this.ctx.lineTo(-10, -15);
          this.ctx.lineTo(-5, 0);
          this.ctx.lineTo(-10, 15);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.stroke();
          
          // Inner detail
          this.ctx.fillStyle = '#c2410c';
          this.ctx.beginPath();
          this.ctx.moveTo(10, 0);
          this.ctx.lineTo(-2, -6);
          this.ctx.lineTo(0, 0);
          this.ctx.lineTo(-2, 6);
          this.ctx.closePath();
          this.ctx.fill();
          
          this.ctx.restore();
        }
      }
    }

    // Draw Projectiles
    for (const p of this.state.projectiles) {
      this.ctx.save();
      this.ctx.translate(p.pos.x, p.pos.y);
      
      if (p.damage === 0) {
        // Katana slash effect
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, -Math.PI/4, Math.PI/4);
        this.ctx.stroke();
      } else {
        // Bullet
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = OUTLINE_COLOR;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    this.ctx.restore();
  }
}
