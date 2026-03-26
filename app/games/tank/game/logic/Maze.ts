
import { Point } from '../../types/game';

export class Maze {
  width: number;
  height: number;
  grid: number[][]; // 0: path, 1: wall

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.grid = Array(height).fill(0).map(() => Array(width).fill(1));
    this.generate();
  }

  generate() {
    const stack: Point[] = [];
    const start: Point = { x: 1, y: 1 };
    this.grid[start.y][start.x] = 0;
    stack.push(start);

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(current);

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.grid[next.y][next.x] = 0;
        this.grid[(current.y + next.y) / 2][(current.x + next.x) / 2] = 0;
        stack.push(next);
      } else {
        stack.pop();
      }
    }

    // Ensure center is open for player
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (centerY + dy > 0 && centerY + dy < this.height - 1 && centerX + dx > 0 && centerX + dx < this.width - 1) {
          this.grid[centerY + dy][centerX + dx] = 0;
        }
      }
    }
  }

  getUnvisitedNeighbors(p: Point): Point[] {
    const neighbors: Point[] = [];
    const dirs = [
      { x: 0, y: -2 },
      { x: 0, y: 2 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
    ];

    for (const dir of dirs) {
      const nx = p.x + dir.x;
      const ny = p.y + dir.y;

      if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1 && this.grid[ny][nx] === 1) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  isWall(x: number, y: number): boolean {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    if (gx < 0 || gx >= this.width || gy < 0 || gy >= this.height) return true;
    return this.grid[gy][gx] === 1;
  }

  findPath(start: Point, end: Point): Point[] | null {
    const queue: { p: Point; path: Point[] }[] = [{ p: start, path: [start] }];
    const visited = new Set<string>();
    visited.add(`${start.x},${start.y}`);

    while (queue.length > 0) {
      const { p, path } = queue.shift()!;

      if (p.x === end.x && p.y === end.y) {
        return path;
      }

      const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];

      for (const dir of dirs) {
        const nx = p.x + dir.x;
        const ny = p.y + dir.y;
        const key = `${nx},${ny}`;

        if (
          nx >= 0 && nx < this.width &&
          ny >= 0 && ny < this.height &&
          this.grid[ny][nx] === 0 &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push({ p: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
        }
      }
    }

    return null;
  }

  extendPathToDeadEnd(path: Point[]): Point[] {
    if (path.length < 2) return path;
    const extendedPath = [...path];
    let last = extendedPath[extendedPath.length - 1];
    let prev = extendedPath[extendedPath.length - 2];
    const visited = new Set<string>(extendedPath.map(p => `${p.x},${p.y}`));

    while (true) {
      const dx = last.x - prev.x;
      const dy = last.y - prev.y;

      const neighbors = [
        { x: last.x + 1, y: last.y },
        { x: last.x - 1, y: last.y },
        { x: last.x, y: last.y + 1 },
        { x: last.x, y: last.y - 1 },
      ].filter(n =>
        n.x >= 0 && n.x < this.width &&
        n.y >= 0 && n.y < this.height &&
        this.grid[n.y][n.x] === 0 &&
        !visited.has(`${n.x},${n.y}`)
      );

      if (neighbors.length === 0) break;

      // Prefer straight, then any turn
      const straight = neighbors.find(n => n.x === last.x + dx && n.y === last.y + dy);
      const next = straight || neighbors[0];

      visited.add(`${next.x},${next.y}`);
      prev = last;
      last = next;
      extendedPath.push(last);
    }
    return extendedPath;
  }
}
