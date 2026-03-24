import { Graphics, Container } from 'pixi.js';
import { COLORS, GAME_CONFIG, PowerUpType, POWERUP_COLORS } from './Constants';
import { Wall } from './Maze';
import { Bullet } from './Bullet';

export interface MouseData {
  x: number;
  y: number;
  isDown: boolean;
}

export class Tank {
  public x: number;
  public y: number;
  public angle: number = 0;
  public id: number;
  public color: number;
  public container: Container;
  private body: Graphics;
  private turret: Graphics;
  private healthBar: Graphics;
  public bullets: Bullet[] = [];
  public isDead: boolean = false;
  public health: number = GAME_CONFIG.TANK_MAX_HEALTH;
  public maxHealth: number = GAME_CONFIG.TANK_MAX_HEALTH;
  public currentPowerUp: { type: PowerUpType, endTime: number } | null = null;
  private lastShootTime: number = 0;

  constructor(x: number, y: number, id: number, color: number) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.color = color;
    this.container = new Container();
    this.body = new Graphics();
    this.turret = new Graphics();
    this.healthBar = new Graphics();
    this.container.addChild(this.body);
    this.container.addChild(this.turret);
    this.container.addChild(this.healthBar);
    this.draw();
    this.updateHealthBar();
  }

  private draw() {
    this.body.clear();
    this.body.rect(-GAME_CONFIG.TANK_SIZE / 2, -GAME_CONFIG.TANK_SIZE / 2, GAME_CONFIG.TANK_SIZE, GAME_CONFIG.TANK_SIZE);
    this.body.fill(this.color);
    this.body.setStrokeStyle({ width: 2, color: 0x000000 });
    this.body.stroke();

    this.turret.clear();
    this.turret.rect(0, -2, GAME_CONFIG.TANK_SIZE / 1.5, 4);
    this.turret.fill(this.color);
    this.turret.setStrokeStyle({ width: 2, color: 0x000000 });
    this.turret.stroke();
  }

  private updateHealthBar() {
    this.healthBar.clear();
    const width = GAME_CONFIG.TANK_SIZE * 1.2;
    const height = 4;
    const yOffset = -GAME_CONFIG.TANK_SIZE - 5;
    
    // Background (gray)
    this.healthBar.rect(-width / 2, yOffset, width, height);
    this.healthBar.fill(0x333333);
    
    // Health (green/red)
    const healthWidth = (this.health / this.maxHealth) * width;
    if (healthWidth > 0) {
      this.healthBar.rect(-width / 2, yOffset, healthWidth, height);
      const healthColor = this.health > this.maxHealth * 0.4 ? 0x00FF00 : 0xFF0000;
      this.healthBar.fill(healthColor);
    }
    
    // Border
    this.healthBar.setStrokeStyle({ width: 1, color: 0x000000 });
    this.healthBar.rect(-width / 2, yOffset, width, height);
    this.healthBar.stroke();

    // Power-up indicator
    if (this.currentPowerUp) {
      const powerUpColor = POWERUP_COLORS[this.currentPowerUp.type];
      this.healthBar.circle(width / 2 + 8, yOffset + height / 2, 4);
      this.healthBar.fill(powerUpColor);
    }

    // Keep health bar upright
    this.healthBar.rotation = -this.angle;
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.updateHealthBar();
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  public update(keys: Set<string>, controls: { up: string, down: string, left: string, right: string, shoot: string }, walls: Wall[], mouseData?: MouseData) {
    if (this.isDead) return;

    let moveX = 0;
    let moveY = 0;

    if (mouseData) {
      const dx = mouseData.x - this.x;
      const dy = mouseData.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetAngle = Math.atan2(dy, dx);

      // Snappy rotation towards mouse
      let angleDiff = targetAngle - this.angle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      // Faster rotation for mouse control (3x faster than keyboard)
      const rotationSpeed = GAME_CONFIG.TANK_ROTATION_SPEED * 3;
      if (Math.abs(angleDiff) > 0.01) {
        if (Math.abs(angleDiff) < rotationSpeed) {
          this.angle = targetAngle;
        } else {
          this.angle += Math.sign(angleDiff) * rotationSpeed;
        }
      }

      // Move if mouse is far enough
      if (dist > 30) {
        // Move at full speed if pointing mostly towards mouse, otherwise move slower
        const alignment = Math.cos(angleDiff);
        if (alignment > 0) {
          moveX = Math.cos(this.angle) * GAME_CONFIG.TANK_SPEED * alignment;
          moveY = Math.sin(this.angle) * GAME_CONFIG.TANK_SPEED * alignment;
        }
      }
    } else {
      if (keys.has(controls.left)) {
        this.angle -= GAME_CONFIG.TANK_ROTATION_SPEED;
      }
      if (keys.has(controls.right)) {
        this.angle += GAME_CONFIG.TANK_ROTATION_SPEED;
      }

      if (keys.has(controls.up)) {
        moveX = Math.cos(this.angle) * GAME_CONFIG.TANK_SPEED;
        moveY = Math.sin(this.angle) * GAME_CONFIG.TANK_SPEED;
      }
      if (keys.has(controls.down)) {
        moveX = -Math.cos(this.angle) * GAME_CONFIG.TANK_SPEED;
        moveY = -Math.sin(this.angle) * GAME_CONFIG.TANK_SPEED;
      }
    }

    // Collision detection with walls
    const nextX = this.x + moveX;
    const nextY = this.y + moveY;

    if (!this.checkWallCollision(nextX, nextY, walls)) {
      this.x = nextX;
      this.y = nextY;
    } else if (!this.checkWallCollision(nextX, this.y, walls)) {
      this.x = nextX;
    } else if (!this.checkWallCollision(this.x, nextY, walls)) {
      this.y = nextY;
    }

    this.container.x = this.x;
    this.container.y = this.y;
    this.container.rotation = this.angle;
    
    // Update health bar rotation to keep it horizontal
    this.healthBar.rotation = -this.angle;
  }

  private checkWallCollision(x: number, y: number, walls: Wall[]): boolean {
    const radius = GAME_CONFIG.TANK_SIZE / 2;
    for (const wall of walls) {
      const dist = this.pointToSegmentDistance(x, y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (dist < radius + GAME_CONFIG.WALL_THICKNESS / 2) {
        return true;
      }
    }
    return false;
  }

  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2);
  }

  public collectPowerUp(type: PowerUpType) {
    this.currentPowerUp = {
      type,
      endTime: Date.now() + GAME_CONFIG.POWERUP_DURATION
    };
    this.updateHealthBar();
  }

  public shoot(): Bullet | null {
    if (this.isDead) return null;

    const now = Date.now();
    let fireRate = 500; // Default fire rate in ms

    if (this.currentPowerUp) {
      if (now > this.currentPowerUp.endTime) {
        this.currentPowerUp = null;
        this.updateHealthBar();
      } else if (this.currentPowerUp.type === PowerUpType.GATLING) {
        fireRate = 100;
      }
    }

    if (now - this.lastShootTime < fireRate) return null;
    if (this.bullets.length >= GAME_CONFIG.MAX_BULLETS && (!this.currentPowerUp || this.currentPowerUp.type !== PowerUpType.GATLING)) return null;

    this.lastShootTime = now;
    const bulletX = this.x + Math.cos(this.angle) * (GAME_CONFIG.TANK_SIZE / 2 + 2);
    const bulletY = this.y + Math.sin(this.angle) * (GAME_CONFIG.TANK_SIZE / 2 + 2);
    
    let options = {};
    if (this.currentPowerUp) {
      if (this.currentPowerUp.type === PowerUpType.BIG_BULLET) {
        options = { radius: 8, damage: 50 };
      } else if (this.currentPowerUp.type === PowerUpType.FAST_BULLET) {
        options = { speed: GAME_CONFIG.BULLET_SPEED * 2 };
      }
    }

    const bullet = new Bullet(bulletX, bulletY, this.angle, this.id, options);
    this.bullets.push(bullet);
    return bullet;
  }
}
