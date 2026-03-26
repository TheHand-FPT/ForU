import { Point } from '../types';

export function generateMaze(size: number, start: Point, goal: Point): boolean[][] {
  const grid = Array.from({ length: size }, () => Array(size).fill(true));
  const stack: Point[] = [{ x: start.x, y: start.y }];
  grid[start.y][start.x] = false;

  const getNeighbors = (p: Point) => {
    const neighbors: Point[] = [];
    const dirs = [{ x: 0, y: 2 }, { x: 0, y: -2 }, { x: 2, y: 0 }, { x: -2, y: 0 }];
    for (const d of dirs) {
      const nx = p.x + d.x;
      const ny = p.y + d.y;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && grid[ny][nx]) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  };

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getNeighbors(current);
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[next.y][next.x] = false;
      grid[current.y + (next.y - current.y) / 2][current.x + (next.x - current.x) / 2] = false;
      stack.push(next);
    } else {
      stack.pop();
    }
  }
  
  // Ensure path to goal
  grid[goal.y][goal.x] = false;
  // Connect goal to the nearest path if needed
  if (goal.x > 0) grid[goal.y][goal.x - 1] = false;
  else if (goal.x < size - 1) grid[goal.y][goal.x + 1] = false;

  // Create additional paths by removing random walls
  // This ensures multiple paths (at least 3) for the enemies to take
  let wallsRemoved = 0;
  const targetWallsToRemove = Math.floor(size * 0.8);
  while (wallsRemoved < targetWallsToRemove) {
    const rx = Math.floor(Math.random() * (size - 2)) + 1;
    const ry = Math.floor(Math.random() * (size - 2)) + 1;
    if (grid[ry][rx]) {
      grid[ry][rx] = false;
      wallsRemoved++;
    }
  }
  
  return grid;
}
