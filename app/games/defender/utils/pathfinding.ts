import { Point, Node } from '../types';

export function getDistance(p1: Point, p2: Point) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

export function aStar(start: Point, goal: Point, grid: boolean[][], gridSize: number): Point[] | null {
  const openSet: Node[] = [{ ...start, g: 0, h: getDistance(start, goal), f: getDistance(start, goal), parent: null }];
  const closedSet = new Set<string>();

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (Math.floor(current.x) === goal.x && Math.floor(current.y) === goal.y) {
      const path: Point[] = [];
      let temp: Node | null = current;
      while (temp) {
        path.push({ x: temp.x, y: temp.y });
        temp = temp.parent;
      }
      return path.reverse();
    }

    closedSet.add(`${Math.floor(current.x)},${Math.floor(current.y)}`);

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      const nx = Math.floor(neighbor.x);
      const ny = Math.floor(neighbor.y);

      if (
        nx < 0 || nx >= gridSize ||
        ny < 0 || ny >= gridSize ||
        grid[ny][nx] ||
        closedSet.has(`${nx},${ny}`)
      ) continue;

      // Weighted cost: Base cost (1)
      const gScore = current.g + 1;
      
      let openNeighbor = openSet.find(n => Math.floor(n.x) === nx && Math.floor(n.y) === ny);

      if (!openNeighbor) {
        openNeighbor = {
          ...neighbor,
          g: gScore,
          h: getDistance(neighbor, goal),
          f: gScore + getDistance(neighbor, goal),
          parent: current
        };
        openSet.push(openNeighbor);
      } else if (gScore < openNeighbor.g) {
        openNeighbor.g = gScore;
        openNeighbor.f = gScore + openNeighbor.h;
        openNeighbor.parent = current;
      }
    }
  }

  return null;
}
