
export type Point = { x: number; y: number };

export interface Entity {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export type LootType = 'BIG' | 'PIERCE' | 'LASER' | 'HOLLOW_PURPLE' | 'ROCKET' | 'BOMB';

export interface LootBox extends Entity {
  type: LootType;
}

export interface PlacedBomb extends Entity {
  id: string;
}

export interface Player extends Entity {
  hp: number;
  score: number;
  activePowerUp: LootType | null;
  powerUpShots: number;
}

export interface Bot extends Entity {
  path: Point[];
  lastPathUpdate: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'red' | 'yellow' | 'blue' | 'black';
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  type: LootType | 'NORMAL';
  damage: number;
  bounces: number;
  path?: Point[];
  target?: Point;
  trail?: Point[];
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface GameUiState {
  hp: number;
  score: number;
}
