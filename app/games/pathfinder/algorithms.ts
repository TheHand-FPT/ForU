import { Node } from "./types";

// Dijkstra's Algorithm
export function dijkstra(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  startNode.distance = 0;
  const unvisitedNodes = getAllNodes(grid);

  while (!!unvisitedNodes.length) {
    sortNodesByDistance(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    if (!closestNode) break;
    if (closestNode.isWall) continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    if (closestNode === finishNode) return visitedNodesInOrder;
    updateUnvisitedNeighbors(closestNode, grid);
  }
  return visitedNodesInOrder;
}

// A* Algorithm
export function astar(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  startNode.distance = 0;
  startNode.heuristic = getDistance(startNode, finishNode);
  const unvisitedNodes = getAllNodes(grid);

  while (!!unvisitedNodes.length) {
    sortNodesByAStar(unvisitedNodes);
    const closestNode = unvisitedNodes.shift();
    if (!closestNode) break;
    if (closestNode.isWall) continue;
    if (closestNode.distance === Infinity) return visitedNodesInOrder;
    closestNode.isVisited = true;
    visitedNodesInOrder.push(closestNode);
    if (closestNode === finishNode) return visitedNodesInOrder;
    updateUnvisitedNeighborsAStar(closestNode, finishNode, grid);
  }
  return visitedNodesInOrder;
}

// BFS
export function bfs(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  const queue: Node[] = [startNode];
  startNode.isVisited = true;

  while (queue.length) {
    const currentNode = queue.shift()!;
    if (currentNode.isWall) continue;
    visitedNodesInOrder.push(currentNode);
    if (currentNode === finishNode) return visitedNodesInOrder;

    const neighbors = getUnvisitedNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      neighbor.isVisited = true;
      neighbor.previousNode = currentNode;
      queue.push(neighbor);
    }
  }
  return visitedNodesInOrder;
}

// DFS
export function dfs(grid: Node[][], startNode: Node, finishNode: Node) {
  const visitedNodesInOrder: Node[] = [];
  const stack: Node[] = [startNode];

  while (stack.length) {
    const currentNode = stack.pop()!;
    if (currentNode.isVisited || currentNode.isWall) continue;

    currentNode.isVisited = true;
    visitedNodesInOrder.push(currentNode);
    if (currentNode === finishNode) return visitedNodesInOrder;

    const neighbors = getUnvisitedNeighbors(currentNode, grid);
    for (const neighbor of neighbors) {
      neighbor.previousNode = currentNode;
      stack.push(neighbor);
    }
  }
  return visitedNodesInOrder;
}

// Helper functions
function getAllNodes(grid: Node[][]) {
  const nodes = [];
  for (const row of grid) {
    for (const node of row) {
      nodes.push(node);
    }
  }
  return nodes;
}

function sortNodesByDistance(unvisitedNodes: Node[]) {
  unvisitedNodes.sort((nodeA, nodeB) => nodeA.distance - nodeB.distance);
}

function sortNodesByAStar(unvisitedNodes: Node[]) {
  unvisitedNodes.sort((nodeA, nodeB) => {
    const fA = nodeA.distance + (nodeA.heuristic || 0);
    const fB = nodeB.distance + (nodeB.heuristic || 0);
    if (fA !== fB) return fA - fB;
    return (nodeA.heuristic || 0) - (nodeB.heuristic || 0);
  });
}

function updateUnvisitedNeighbors(node: Node, grid: Node[][]) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    neighbor.distance = node.distance + 1;
    neighbor.previousNode = node;
  }
}

function updateUnvisitedNeighborsAStar(
  node: Node,
  finishNode: Node,
  grid: Node[][],
) {
  const unvisitedNeighbors = getUnvisitedNeighbors(node, grid);
  for (const neighbor of unvisitedNeighbors) {
    const newDistance = node.distance + 1;
    if (newDistance < neighbor.distance) {
      neighbor.distance = newDistance;
      neighbor.heuristic = getDistance(neighbor, finishNode);
      neighbor.previousNode = node;
    }
  }
}

function getUnvisitedNeighbors(node: Node, grid: Node[][]) {
  const neighbors = [];
  const { col, row } = node;
  if (row > 0) neighbors.push(grid[row - 1][col]);
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
  if (col > 0) neighbors.push(grid[row][col - 1]);
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
  return neighbors.filter((neighbor) => !neighbor.isVisited);
}

function getDistance(nodeA: Node, nodeB: Node) {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

export function getNodesInShortestPathOrder(finishNode: Node) {
  const nodesInShortestPathOrder = [];
  let currentNode: Node | null = finishNode;
  while (currentNode !== null) {
    nodesInShortestPathOrder.unshift(currentNode);
    currentNode = currentNode.previousNode;
  }
  return nodesInShortestPathOrder;
}

// Recursive Division Maze Generation
export function generateMaze(grid: Node[][], width: number, height: number) {
  const walls: Node[] = [];

  // 1. Add outer walls
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (r === 0 || r === height - 1 || c === 0 || c === width - 1) {
        if (!grid[r][c].isStart && !grid[r][c].isFinish) {
          walls.push(grid[r][c]);
        }
      }
    }
  }

  function divide(r1: number, r2: number, c1: number, c2: number) {
    if (r2 - r1 < 2 || c2 - c1 < 2) return;

    const horizontal = r2 - r1 > c2 - c1;

    if (horizontal) {
      // Horizontal wall on an even row
      const possibleRows = [];
      for (let r = r1 + 1; r < r2; r += 2) possibleRows.push(r);
      if (possibleRows.length === 0) return;
      const row = possibleRows[Math.floor(Math.random() * possibleRows.length)];

      // Passage on an odd column
      const possiblePassages = [];
      for (let c = c1; c <= c2; c += 2) possiblePassages.push(c);
      const passage =
        possiblePassages[Math.floor(Math.random() * possiblePassages.length)];

      for (let i = c1; i <= c2; i++) {
        if (i !== passage && !grid[row][i].isStart && !grid[row][i].isFinish) {
          walls.push(grid[row][i]);
        }
      }

      divide(r1, row - 1, c1, c2);
      divide(row + 1, r2, c1, c2);
    } else {
      // Vertical wall on an even column
      const possibleCols = [];
      for (let c = c1 + 1; c < c2; c += 2) possibleCols.push(c);
      if (possibleCols.length === 0) return;
      const col = possibleCols[Math.floor(Math.random() * possibleCols.length)];

      // Passage on an odd row
      const possiblePassages = [];
      for (let r = r1; r <= r2; r += 2) possiblePassages.push(r);
      const passage =
        possiblePassages[Math.floor(Math.random() * possiblePassages.length)];

      for (let r = r1; r <= r2; r++) {
        if (r !== passage && !grid[r][col].isStart && !grid[r][col].isFinish) {
          walls.push(grid[r][col]);
        }
      }

      divide(r1, r2, c1, col - 1);
      divide(r1, r2, col + 1, c2);
    }
  }

  // Start division in the inner area
  divide(1, height - 2, 1, width - 2);

  return walls;
}
