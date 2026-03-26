export type Phase = 'GROUND' | 'TAKEOFF' | 'FLIGHT' | 'LANDING' | 'MENU' | 'GAMEOVER' | 'VICTORY';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vector2;
  radius: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  hunger: number;
  maxHunger: number;
  speed: number;
  weapon: 'PISTOL' | 'KATANA' | 'AK47';
  ammo: { PISTOL: number; AK47: number };
  inventory: InventoryItem[];
  angle: number;
  isSprinting: boolean;
  lastShotTime: number;
}

export interface InventoryItem {
  id: string;
  type: string;
  count: number;
}

export interface Enemy {
  id: string;
  pos: Vector2;
  type: 'GROUND_SMALL' | 'GROUND_ELITE' | 'GROUND_HIGH' | 'FLYING_SMALL' | 'FLYING_ELITE' | 'FLYING_HIGH';
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  radius: number;
  color: string;
  lastAttackTime: number;
  path?: Vector2[]; // For Dijkstra pathfinding
}

export interface Projectile {
  id: string;
  pos: Vector2;
  vel: Vector2;
  damage: number;
  radius: number;
  color: string;
  life: number;
  source: 'PLAYER' | 'SHIP' | 'ENEMY';
}

export interface ItemDrop {
  id: string;
  pos: Vector2;
  type: string;
  radius: number;
  color: string;
  buildingId?: string | null;
}

export interface Maze {
  grid: number[][]; // 0: path, 1: wall
  cellSize: number;
  cols: number;
  rows: number;
}

export interface Building {
  id: string;
  pos: Vector2;
  size: Vector2;
  entrancePos: Vector2;
  maze: Maze;
  enemies: Enemy[];
}

export interface Ship {
  pos: Vector2;
  radius: number;
  hp: number;
  maxHp: number;
  armor: number;
  maxArmor: number;
  hasMachineGun: boolean;
  lastShotTime: number;
}

export interface Decoration {
  x: number;
  y: number;
  type: 'CRATER' | 'PUDDLE' | 'SKULL';
  radius: number;
  rotation: number;
}

export interface GameState {
  phase: Phase;
  stage: number;
  player: Player;
  ship: Ship;
  enemies: Enemy[];
  projectiles: Projectile[];
  items: ItemDrop[];
  buildings: Building[];
  currentBuildingId: string | null;
  decorations: Decoration[];
  flightTimer: number;
  flightSpawnTimer: number;
  transitionTimer: number;
  camera: Vector2;
  mousePos: Vector2;
  keys: { [key: string]: boolean };
  lastTime: number;
  totalKills: number;
  totalTime: number;
  lastReactUpdateTime?: number;
  onStateChange: (state: GameState) => void;
}
