
import { LootType } from '../types/game';

export const MAZE_SIZE = 21;
export const CELL_SIZE = 32;
export const BOT_SPAWN_INTERVAL = 3000;
export const BOT_PATH_UPDATE_INTERVAL = 500;
export const LOOT_SPAWN_INTERVAL = 5000;
export const FIRE_RATE_LIMIT = 350; // Moderate fire rate
export const MIN_PLAYER_SPEED = 0.06;
export const MAX_PLAYER_SPEED = 0.12;
export const SPEED_SCALING_FACTOR = 0.00003; // Slightly faster scaling

export const BULLET_CONFIG = {
  NORMAL: { radius: 0.1, color: '#000', damage: 1, bounces: 0, speed: 0.25 },
  BIG: { radius: 0.25, color: '#FF4500', damage: 3, bounces: 0, speed: 0.25 },
  PIERCE: { radius: 0.1, color: '#8A2BE2', damage: 1, bounces: 0, speed: 0.25 },
  LASER: { radius: 0.08, color: '#00FF00', damage: 1, bounces: 5, speed: 0.25 },
  HOLLOW_PURPLE: { radius: 0.9, color: '#A020F0', damage: 999, bounces: 0, speed: 0.1 },
  ROCKET: { radius: 0.2, color: '#FF8C00', damage: 0, bounces: 0, speed: 0.08 }, // Slower speed as requested
  BOMB: { radius: 0.4, color: '#8B4513', damage: 1000, bounces: 0, speed: 0 },
};

export const LOOT_CONFIG: Record<LootType, { color: string; symbol: string }> = {
  BIG: { color: '#FF4500', symbol: 'B' },
  PIERCE: { color: '#8A2BE2', symbol: 'P' },
  LASER: { color: '#00FF00', symbol: 'L' },
  HOLLOW_PURPLE: { color: '#A020F0', symbol: '紫' },
  ROCKET: { color: '#FF8C00', symbol: 'R' },
  BOMB: { color: '#8B4513', symbol: '💣' },
};
