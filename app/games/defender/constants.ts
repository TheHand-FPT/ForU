import { EnemyType, Level, Wave } from './types';

export const CELL_SIZE = 28;
export const MAX_PARTICLES = 150;
export const INITIAL_LIVES = 15;

export const ENEMY_TYPES: Record<string, EnemyType> = {
  basic: { name: 'Basic', healthMultiplier: 1.5, speedMultiplier: 1.3, rewardMultiplier: 1, color: '#141414', size: 8 },
  fast: { name: 'Fast', healthMultiplier: 0.8, speedMultiplier: 2.8, rewardMultiplier: 1.2, color: '#3b82f6', size: 6 },
  tank: { name: 'Tank', healthMultiplier: 5.0, speedMultiplier: 0.8, rewardMultiplier: 2.5, color: '#ef4444', size: 10 },
  bomber: { name: 'Bomber', healthMultiplier: 2.5, speedMultiplier: 1.5, rewardMultiplier: 3.0, color: '#f97316', size: 9 },
  boss: { name: 'Boss', healthMultiplier: 20.0, speedMultiplier: 0.5, rewardMultiplier: 15, color: '#8b5cf6', size: 14 },
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "The First Labyrinth",
    gridSize: 21,
    startNode: { x: 0, y: 1 },
    goalNode: { x: 20, y: 19 },
    obstacles: [],
    initialMoney: 100,
  },
  {
    id: 2,
    name: "Twisted Corridors",
    gridSize: 21,
    startNode: { x: 1, y: 0 },
    goalNode: { x: 19, y: 20 },
    obstacles: [],
    initialMoney: 120,
  }
];

export const WAVES: Wave[] = [
  { enemies: [{ type: 'basic', count: 15, delay: 700 }] },
  { enemies: [{ type: 'basic', count: 25, delay: 500 }] },
  { enemies: [{ type: 'fast', count: 20, delay: 350 }] },
  { enemies: [{ type: 'basic', count: 20, delay: 500 }, { type: 'bomber', count: 2, delay: 1000 }] },
  { enemies: [{ type: 'tank', count: 12, delay: 1200 }, { type: 'fast', count: 10, delay: 400 }] },
  { enemies: [{ type: 'basic', count: 30, delay: 400 }, { type: 'bomber', count: 5, delay: 800 }] },
  { enemies: [{ type: 'fast', count: 50, delay: 200 }] },
  { enemies: [{ type: 'boss', count: 1, delay: 0 }, { type: 'bomber', count: 3, delay: 1500 }] },
  { enemies: [{ type: 'tank', count: 20, delay: 700 }, { type: 'fast', count: 35, delay: 250 }] },
  { enemies: [{ type: 'boss', count: 4, delay: 3500 }, { type: 'bomber', count: 10, delay: 1000 }, { type: 'fast', count: 80, delay: 120 }] },
];

export const TOWER_TYPES = {
  basic: { cost: 20, damage: 15, range: 3.5, cooldown: 500, color: '#3b82f6' },
  sniper: { cost: 50, damage: 60, range: 7, cooldown: 1500, color: '#ef4444' },
  slow: { cost: 40, damage: 5, range: 3, cooldown: 800, color: '#10b981' },
  teleporter: { cost: 100, damage: 0, range: 2, cooldown: 3000, color: '#8b5cf6' },
};
