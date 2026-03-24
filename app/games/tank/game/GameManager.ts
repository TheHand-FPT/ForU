import { Application, Container, Text, Graphics, TextStyle } from 'pixi.js';
import { COLORS, GAME_CONFIG, PowerUpType } from './Constants';
import { Maze } from './Maze';
import { Tank, MouseData } from './Tank';
import { Bullet } from './Bullet';
import { PowerUp } from './PowerUp';
import { ParticleSystem } from './Particle';

export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
}

export class GameManager {
  private app: Application;
  private state: GameState = GameState.MENU;
  private maze: Maze | null = null;
  private tanks: Tank[] = [];
  private bullets: Bullet[] = [];
  private powerUps: PowerUp[] = [];
  private particleSystem: ParticleSystem | null = null;
  private keys: Set<string> = new Set();
  private menuContainer: Container;
  private gameContainer: Container;
  private gameOverContainer: Container;
  private numPlayers: number = 2;
  private mouseData: MouseData = { x: 0, y: 0, isDown: false };

  private controls = [
    { up: 'w', down: 's', left: 'a', right: 'd', shoot: 'q' },
    { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', shoot: 'm' },
    { up: 'i', down: 'k', left: 'j', right: 'l', shoot: 'u' },
  ];

  constructor(app: Application) {
    this.app = app;
    this.menuContainer = new Container();
    this.gameContainer = new Container();
    this.gameOverContainer = new Container();
    this.app.stage.addChild(this.menuContainer);
    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.gameOverContainer);

    this.particleSystem = new ParticleSystem(this.gameContainer);

    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.on('pointermove', (e) => {
      if (this.maze) {
        const localPos = this.maze.container.toLocal(e.global);
        this.mouseData.x = localPos.x;
        this.mouseData.y = localPos.y;
      }
    });
    this.app.stage.on('pointerdown', () => { this.mouseData.isDown = true; });
    this.app.stage.on('pointerup', () => { this.mouseData.isDown = false; });
    this.app.stage.on('pointerupoutside', () => { this.mouseData.isDown = false; });

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (this.state === GameState.PLAYING) {
        this.tanks.forEach((tank, i) => {
          if (e.key === this.controls[i].shoot) {
            const bullet = tank.shoot();
            if (bullet) {
              this.bullets.push(bullet);
              this.maze!.container.addChild(bullet.graphics);
              this.particleSystem?.spawnMuzzleFlash(bullet.x, bullet.y, tank.angle, tank.color);
            }
          }
        });
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));

    this.showMenu();
    this.app.ticker.add(this.update.bind(this));
  }

  private showMenu() {
    this.state = GameState.MENU;
    this.menuContainer.visible = true;
    this.gameContainer.visible = false;
    this.gameOverContainer.visible = false;
    this.menuContainer.removeChildren();

    const titleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fontWeight: 'bold',
      fill: COLORS.TANK_1,
      dropShadow: {
        color: 0x000000,
        blur: 4,
        angle: Math.PI / 6,
        distance: 6,
      },
    });

    const title = new Text({ text: 'TANK TROUBLE', style: titleStyle });
    title.anchor.set(0.5);
    title.x = this.app.screen.width / 2;
    title.y = this.app.screen.height / 3;
    this.menuContainer.addChild(title);

    const subtitleStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 24,
      fill: COLORS.UI_TEXT,
    });

    const subtitle = new Text({ text: 'SELECT PLAYERS', style: subtitleStyle });
    subtitle.anchor.set(0.5);
    subtitle.x = this.app.screen.width / 2;
    subtitle.y = this.app.screen.height / 2;
    this.menuContainer.addChild(subtitle);

    const controlsStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0x888888,
      align: 'center',
    });

    const controlsText = new Text({ 
      text: 'P1: WASD + Q | P2: ARROWS + M | P3: IJKL + U', 
      style: controlsStyle 
    });
    controlsText.anchor.set(0.5);
    controlsText.x = this.app.screen.width / 2;
    controlsText.y = this.app.screen.height - 50;
    this.menuContainer.addChild(controlsText);

    [1, 2, 3].forEach((n, i) => {
      const btn = new Graphics();
      btn.rect(-60, -25, 120, 50);
      btn.fill(COLORS.UI_ACCENT);
      btn.setStrokeStyle({ width: 2, color: COLORS.UI_TEXT });
      btn.stroke();
      
      const spacing = 130;
      btn.x = this.app.screen.width / 2 + (i - 1) * spacing;
      btn.y = this.app.screen.height / 2 + 80;
      btn.interactive = true;
      btn.cursor = 'pointer';
      btn.on('pointerdown', () => {
        this.numPlayers = n;
        this.startGame();
      });

      const btnText = new Text({ text: `${n} PLAYER${n > 1 ? 'S' : ''}`, style: { fill: COLORS.UI_TEXT, fontSize: 16 } });
      btnText.anchor.set(0.5);
      btn.addChild(btnText);
      this.menuContainer.addChild(btn);
    });
  }

  private startGame() {
    this.state = GameState.PLAYING;
    this.menuContainer.visible = false;
    this.gameContainer.visible = true;
    this.gameOverContainer.visible = false;
    this.gameContainer.removeChildren();
    this.bullets = [];
    this.tanks = [];
    this.powerUps = [];
    this.particleSystem?.clear();

    this.maze = new Maze(GAME_CONFIG.MAZE_COLS, GAME_CONFIG.MAZE_ROWS, this.app.screen.width, this.app.screen.height);
    this.gameContainer.addChild(this.maze.container);
    this.particleSystem?.setContainer(this.maze.container);

    // Spawn power-ups
    const powerUpTypes = [PowerUpType.GATLING, PowerUpType.BIG_BULLET, PowerUpType.FAST_BULLET];
    for (let r = 0; r < GAME_CONFIG.MAZE_ROWS; r++) {
      for (let c = 0; c < GAME_CONFIG.MAZE_COLS; c++) {
        if (Math.random() < GAME_CONFIG.POWERUP_SPAWN_CHANCE) {
          const x = (c + 0.5) * this.maze.cellWidth;
          const y = (r + 0.5) * this.maze.cellHeight;
          const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          const powerUp = new PowerUp(x, y, type);
          this.powerUps.push(powerUp);
          this.maze.container.addChild(powerUp.container);
        }
      }
    }

    const spawnPoints = this.maze.getSpawnPoints(this.numPlayers);
    const tankColors = [COLORS.TANK_1, COLORS.TANK_2, COLORS.TANK_3];

    for (let i = 0; i < this.numPlayers; i++) {
      const tank = new Tank(spawnPoints[i].x, spawnPoints[i].y, i, tankColors[i]);
      this.tanks.push(tank);
      this.maze!.container.addChild(tank.container);
    }
  }

  private update() {
    if (this.state !== GameState.PLAYING) return;

    // Update power-ups
    this.powerUps.forEach(p => p.update(this.app.ticker.deltaMS));

    // Update particles
    this.particleSystem?.update(this.app.ticker.deltaMS);

    // Check power-up collection
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      for (const tank of this.tanks) {
        if (!tank.isDead) {
          const dx = tank.x - powerUp.x;
          const dy = tank.y - powerUp.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < GAME_CONFIG.TANK_SIZE / 2 + GAME_CONFIG.POWERUP_SIZE / 2) {
            tank.collectPowerUp(powerUp.type);
            this.maze!.container.removeChild(powerUp.container);
            this.powerUps.splice(i, 1);
            break;
          }
        }
      }
    }

    // Update tanks
    this.tanks.forEach((tank, i) => {
      if (!tank.isDead) {
        const isMousePlayer = this.numPlayers === 1 && i === 0;
        tank.update(this.keys, this.controls[i], this.maze!.walls, isMousePlayer ? this.mouseData : undefined);
        
        if (isMousePlayer && this.mouseData.isDown) {
          const bullet = tank.shoot();
          if (bullet) {
            this.bullets.push(bullet);
            this.maze!.container.addChild(bullet.graphics);
            this.particleSystem?.spawnMuzzleFlash(bullet.x, bullet.y, tank.angle, tank.color);
          }
        }
      }
    });

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(this.maze!.walls);

      if (bullet.isDead) {
        this.maze!.container.removeChild(bullet.graphics);
        this.particleSystem?.spawnExplosion(bullet.x, bullet.y, COLORS.BULLET, 5);
        const owner = this.tanks[bullet.ownerId];
        owner.bullets = owner.bullets.filter(b => b !== bullet);
        this.bullets.splice(i, 1);
        continue;
      }

      // Check bullet vs tank collision
      for (const tank of this.tanks) {
        if (!tank.isDead) {
          const dx = bullet.x - tank.x;
          const dy = bullet.y - tank.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Prevent immediate self-damage: bullet can only hit owner after first bounce
          if (tank.id === bullet.ownerId && bullet.bounces === 0) continue;

          if (dist < GAME_CONFIG.TANK_SIZE / 2 + bullet.radius) {
            tank.takeDamage(bullet.damage);
            this.particleSystem?.spawnExplosion(bullet.x, bullet.y, tank.color, 20);
            if (tank.isDead) {
              this.maze!.container.removeChild(tank.container);
              this.particleSystem?.spawnExplosion(tank.x, tank.y, tank.color, 50);
            }
            bullet.isDead = true;
            break;
          }
        }
      }
    }

    // Check game over
    const aliveTanks = this.tanks.filter(t => !t.isDead);
    if (this.numPlayers > 1 && aliveTanks.length <= 1) {
      this.showGameOver(aliveTanks.length === 1 ? aliveTanks[0] : null);
    } else if (this.numPlayers === 1 && aliveTanks.length === 0) {
      this.showGameOver(null);
    }
  }

  private showGameOver(winner: Tank | null) {
    this.state = GameState.GAME_OVER;
    this.gameOverContainer.visible = true;
    this.gameOverContainer.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    this.gameOverContainer.addChild(bg);

    const text = winner ? `PLAYER ${winner.id + 1} WINS!` : 'DRAW!';
    const winStyle = new TextStyle({
      fontFamily: 'Arial',
      fontSize: 48,
      fill: winner ? winner.color : COLORS.UI_TEXT,
      fontWeight: 'bold',
    });

    const winText = new Text({ text, style: winStyle });
    winText.anchor.set(0.5);
    winText.x = this.app.screen.width / 2;
    winText.y = this.app.screen.height / 2 - 50;
    this.gameOverContainer.addChild(winText);

    const btnContainer = new Container();
    this.gameOverContainer.addChild(btnContainer);

    const createBtn = (label: string, x: number, y: number, callback: () => void) => {
      const btn = new Graphics();
      btn.rect(-80, -25, 160, 50);
      btn.fill(COLORS.UI_ACCENT);
      btn.setStrokeStyle({ width: 2, color: COLORS.UI_TEXT });
      btn.stroke();
      btn.x = x;
      btn.y = y;
      btn.interactive = true;
      btn.cursor = 'pointer';
      btn.on('pointerdown', callback);

      const btnText = new Text({ text: label, style: { fill: COLORS.UI_TEXT, fontSize: 18 } });
      btnText.anchor.set(0.5);
      btn.addChild(btnText);
      return btn;
    };

    const nextLevelBtn = createBtn('NEXT LEVEL', this.app.screen.width / 2, this.app.screen.height / 2 + 30, () => {
      this.startGame();
    });
    btnContainer.addChild(nextLevelBtn);

    const backMenuBtn = createBtn('BACK TO MENU', this.app.screen.width / 2, this.app.screen.height / 2 + 100, () => {
      this.showMenu();
    });
    btnContainer.addChild(backMenuBtn);
  }
}
