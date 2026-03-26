import React from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Level {
  id: number;
  name: string;
  gridSize: number;
  startNode: Point;
  goalNode: Point;
  obstacles: Point[];
  initialMoney: number;
}

export interface EnemyType {
  name: string;
  healthMultiplier: number;
  speedMultiplier: number;
  rewardMultiplier: number;
  color: string;
  size: number;
}

export interface WaveEnemy {
  type: string;
  count: number;
  delay: number;
}

export interface Wave {
  enemies: WaveEnemy[];
}

export interface Node extends Point {
  g: number;
  h: number;
  f: number;
  parent: Node | null;
}

export interface Enemy {
  id: number;
  type: string;
  pos: Point;
  health: number;
  maxHealth: number;
  speed: number;
  originalSpeed: number;
  slowTimer: number;
  reward: number;
}

export interface Tower {
  id: number;
  gridX: number;
  gridY: number;
  type: 'basic' | 'sniper' | 'slow' | 'teleporter';
  damage: number;
  range: number;
  cooldown: number;
  lastShot: number;
  targetX?: number; // For teleporter
  targetY?: number;
}

export interface Projectile {
  pos: Point;
  target: Enemy;
  damage: number;
  speed: number;
  color: string;
  type: 'basic' | 'sniper' | 'slow' | 'teleporter';
}

export interface Particle {
  id: number;
  pos: Point;
  vel: Point;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface FloatingText {
  id: number;
  pos: Point;
  text: string;
  life: number;
  color: string;
}

export interface TowerType {
  name: string;
  cost: number;
  damage: number;
  range: number;
  cooldown: number;
  color: string;
  icon: React.ElementType;
  description: string;
}
