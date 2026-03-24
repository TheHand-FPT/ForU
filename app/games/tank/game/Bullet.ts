import { Graphics, Container } from 'pixi.js';
import { COLORS, GAME_CONFIG } from './Constants';
import { Wall } from './Maze';

export class Bullet {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public bounces: number = 0;
  public maxBounces: number = GAME_CONFIG.BULLET_BOUNCES;
  public isDead: boolean = false;
  public ownerId: number;
  public graphics: Graphics;
  public radius: number;
  public damage: number;

  constructor(x: number, y: number, angle: number, ownerId: number, options?: { speed?: number, radius?: number, damage?: number }) {
    this.x = x;
    this.y = y;
    this.radius = options?.radius || GAME_CONFIG.BULLET_RADIUS;
    this.damage = options?.damage || GAME_CONFIG.BULLET_DAMAGE;
    const speed = options?.speed || GAME_CONFIG.BULLET_SPEED;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ownerId = ownerId;
    this.graphics = new Graphics();
    this.draw();
  }

  private draw() {
    this.graphics.clear();
    this.graphics.circle(0, 0, this.radius);
    this.graphics.fill(COLORS.BULLET);
  }

  public update(walls: Wall[]) {
    if (this.isDead) return;

    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    // Check for wall collisions
    for (const wall of walls) {
      const dist = this.pointToSegmentDistance(nextX, nextY, wall.x1, wall.y1, wall.x2, wall.y2);
      if (dist < this.radius + GAME_CONFIG.WALL_THICKNESS / 2) {
        this.bounces++;
        if (this.bounces > this.maxBounces) {
          this.isDead = true;
          return;
        }

        // Reflect velocity
        if (wall.x1 === wall.x2) { // Vertical wall
          this.vx *= -1;
        } else { // Horizontal wall
          this.vy *= -1;
        }
        
        // Move away from wall to prevent getting stuck
        this.x += this.vx;
        this.y += this.vy;
        this.graphics.x = this.x;
        this.graphics.y = this.y;
        return;
      }
    }

    this.x = nextX;
    this.y = nextY;
    this.graphics.x = this.x;
    this.graphics.y = this.y;
  }

  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2);
  }
}
