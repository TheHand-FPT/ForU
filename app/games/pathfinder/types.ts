export type Algorithm = "DIJKSTRA" | "ASTAR" | "BFS" | "DFS";

export interface Node {
  row: number;
  col: number;
  isStart: boolean;
  isFinish: boolean;
  distance: number;
  isVisited: boolean;
  isWall: boolean;
  previousNode: Node | null;
  heuristic?: number;
}

export interface GridDimensions {
  rows: number;
  cols: number;
}
