import { Position } from '../types';

export const isSamePos = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

export const getNeighbors = (pos: Position, walkable: Position[]) => {
  const dirs = [
    { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }
  ];
  return dirs
    .map(d => ({ x: pos.x + d.x, y: pos.y + d.y }))
    .filter(p => walkable.some(w => isSamePos(w, p)));
};

// BFS to find shortest path
export const findShortestPath = (start: Position, target: Position, walkable: Position[]): Position[] => {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (isSamePos(pos, target)) return path;

    for (const neighbor of getNeighbors(pos, walkable)) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ pos: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return [];
};

// Get all reachable tiles within N steps
export const getReachableTiles = (start: Position, steps: number, walkable: Position[]): Position[] => {
  const reachable = new Set<string>();
  const queue: { pos: Position; dist: number }[] = [{ pos: start, dist: 0 }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;
    if (dist > 0) reachable.add(`${pos.x},${pos.y}`);
    if (dist < steps) {
      for (const neighbor of getNeighbors(pos, walkable)) {
        const key = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ pos: neighbor, dist: dist + 1 });
        }
      }
    }
  }
  return Array.from(reachable).map(s => {
    const [x, y] = s.split(',').map(Number);
    return { x, y };
  });
};
