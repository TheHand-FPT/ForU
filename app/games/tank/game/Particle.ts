import { Graphics, Container } from 'pixi.js';

export class Particle {
  public x: number;
  public y: number;
  private vx: number;
  private vy: number;
  private life: number;
  private maxLife: number;
  public graphics: Graphics;
  public isDead: boolean = false;

  constructor(x: number, y: number, color: number, size: number, speed: number, angle: number, life: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = life;
    this.maxLife = life;
    this.graphics = new Graphics();
    this.graphics.circle(0, 0, size);
    this.graphics.fill(color);
    this.graphics.x = x;
    this.graphics.y = y;
  }

  public update(delta: number) {
    this.life -= delta;
    if (this.life <= 0) {
      this.isDead = true;
      return;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.graphics.x = this.x;
    this.graphics.y = this.y;
    this.graphics.alpha = this.life / this.maxLife;
    this.graphics.scale.set(this.life / this.maxLife);
  }
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  public setContainer(container: Container) {
    this.clear();
    this.container = container;
  }

  public spawnExplosion(x: number, y: number, color: number, count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const size = Math.random() * 3 + 1;
      const life = Math.random() * 500 + 200;
      const particle = new Particle(x, y, color, size, speed, angle, life);
      this.particles.push(particle);
      this.container.addChild(particle.graphics);
    }
  }

  public spawnMuzzleFlash(x: number, y: number, angle: number, color: number) {
    for (let i = 0; i < 5; i++) {
      const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 2 + 2;
      const size = Math.random() * 2 + 1;
      const life = Math.random() * 200 + 100;
      const particle = new Particle(x, y, color, size, speed, spreadAngle, life);
      this.particles.push(particle);
      this.container.addChild(particle.graphics);
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(delta);
      if (p.isDead) {
        this.container.removeChild(p.graphics);
        this.particles.splice(i, 1);
      }
    }
  }

  public clear() {
    this.particles.forEach(p => this.container.removeChild(p.graphics));
    this.particles = [];
  }
}
