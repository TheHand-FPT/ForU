import { Graphics, Container } from 'pixi.js';
import { COLORS, GAME_CONFIG } from './Constants';

export interface Wall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class Maze {
  public walls: Wall[] = [];
  public container: Container;
  private graphics: Graphics;
  private cols: number;
  private rows: number;
  public cellWidth: number;
  public cellHeight: number;

  private padding: number = 40;

  constructor(cols: number, rows: number, width: number, height: number) {
    this.cols = cols;
    this.rows = rows;
    
    const availableWidth = width - this.padding * 2;
    const availableHeight = height - this.padding * 2;
    
    // Calculate uniform cell size to maintain 1:1 ratio
    const cellSize = Math.min(availableWidth / cols, availableHeight / rows);
    this.cellWidth = cellSize;
    this.cellHeight = cellSize;
    
    this.container = new Container();
    
    // Center the maze in the screen
    const totalMazeWidth = cols * cellSize;
    const totalMazeHeight = rows * cellSize;
    this.container.x = (width - totalMazeWidth) / 2;
    this.container.y = (height - totalMazeHeight) / 2;
    
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    this.generate();
  }

  private generate() {
    const grid: boolean[][] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    const stack: [number, number][] = [];
    const start: [number, number] = [0, 0];
    grid[0][0] = true;
    stack.push(start);

    const verticalWalls: boolean[][] = Array.from({ length: this.rows }, () => Array(this.cols + 1).fill(true));
    const horizontalWalls: boolean[][] = Array.from({ length: this.rows + 1 }, () => Array(this.cols).fill(true));

    while (stack.length > 0) {
      const [r, c] = stack[stack.length - 1];
      const neighbors: [number, number, string][] = [];

      if (r > 0 && !grid[r - 1][c]) neighbors.push([r - 1, c, 'top']);
      if (r < this.rows - 1 && !grid[r + 1][c]) neighbors.push([r + 1, c, 'bottom']);
      if (c > 0 && !grid[r][c - 1]) neighbors.push([r, c - 1, 'left']);
      if (c < this.cols - 1 && !grid[r][c + 1]) neighbors.push([r, c + 1, 'right']);

      if (neighbors.length > 0) {
        const [nr, nc, dir] = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[nr][nc] = true;
        if (dir === 'top') horizontalWalls[r][c] = false;
        if (dir === 'bottom') horizontalWalls[r + 1][c] = false;
        if (dir === 'left') verticalWalls[r][c] = false;
        if (dir === 'right') verticalWalls[r][nc] = false;
        stack.push([nr, nc]);
      } else {
        stack.pop();
      }
    }

    // Convert to wall segments
    this.walls = [];
    for (let r = 0; r <= this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (horizontalWalls[r][c]) {
          this.walls.push({
            x1: c * this.cellWidth,
            y1: r * this.cellHeight,
            x2: (c + 1) * this.cellWidth,
            y2: r * this.cellHeight,
          });
        }
      }
    }
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c <= this.cols; c++) {
        if (verticalWalls[r][c]) {
          this.walls.push({
            x1: c * this.cellWidth,
            y1: r * this.cellHeight,
            x2: c * this.cellWidth,
            y2: (r + 1) * this.cellHeight,
          });
        }
      }
    }
    this.draw();
  }

  private draw() {
    this.graphics.clear();
    
    // Draw grid
    this.graphics.setStrokeStyle({ width: 1, color: 0x1A1A1A });
    for (let r = 0; r <= this.rows; r++) {
      this.graphics.moveTo(0, r * this.cellHeight);
      this.graphics.lineTo(this.cols * this.cellWidth, r * this.cellHeight);
    }
    for (let c = 0; c <= this.cols; c++) {
      this.graphics.moveTo(c * this.cellWidth, 0);
      this.graphics.lineTo(c * this.cellWidth, this.rows * this.cellHeight);
    }
    this.graphics.stroke();

    // Draw walls
    this.graphics.setStrokeStyle({ width: GAME_CONFIG.WALL_THICKNESS, color: COLORS.WALL, cap: 'square' });
    for (const wall of this.walls) {
      this.graphics.moveTo(wall.x1, wall.y1);
      this.graphics.lineTo(wall.x2, wall.y2);
    }
    this.graphics.stroke();
  }

  public getSpawnPoints(num: number): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    const used = new Set<string>();
    while (points.length < num) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      const key = `${r},${c}`;
      if (!used.has(key)) {
        used.add(key);
        points.push({
          x: (c + 0.5) * this.cellWidth,
          y: (r + 0.5) * this.cellHeight,
        });
      }
    }
    return points;
  }
}
