import { Graphics, Container } from 'pixi.js';
import { GAME_CONFIG, PowerUpType, POWERUP_COLORS } from './Constants';

export class PowerUp {
  public x: number;
  public y: number;
  public type: PowerUpType;
  public container: Container;
  private graphics: Graphics;
  public isCollected: boolean = false;

  constructor(x: number, y: number, type: PowerUpType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.container = new Container();
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    this.container.x = x;
    this.container.y = y;
    this.draw();
  }

  private draw() {
    this.graphics.clear();
    const color = POWERUP_COLORS[this.type];
    
    // Outer glow
    this.graphics.circle(0, 0, GAME_CONFIG.POWERUP_SIZE / 2 + 2);
    this.graphics.fill({ color, alpha: 0.3 });
    
    // Main body
    this.graphics.circle(0, 0, GAME_CONFIG.POWERUP_SIZE / 2);
    this.graphics.fill(color);
    this.graphics.setStrokeStyle({ width: 2, color: 0xFFFFFF });
    this.graphics.stroke();
    
    // Symbol
    this.graphics.setStrokeStyle({ width: 2, color: 0xFFFFFF });
    if (this.type === PowerUpType.GATLING) {
      this.graphics.moveTo(-4, -4);
      this.graphics.lineTo(4, 4);
      this.graphics.moveTo(4, -4);
      this.graphics.lineTo(-4, 4);
    } else if (this.type === PowerUpType.BIG_BULLET) {
      this.graphics.circle(0, 0, 4);
      this.graphics.fill(0xFFFFFF);
    } else if (this.type === PowerUpType.FAST_BULLET) {
      this.graphics.moveTo(-5, 0);
      this.graphics.lineTo(5, 0);
      this.graphics.lineTo(2, -3);
      this.graphics.moveTo(5, 0);
      this.graphics.lineTo(2, 3);
    }
    this.graphics.stroke();
  }

  public update(delta: number) {
    // Animation removed
  }
}
