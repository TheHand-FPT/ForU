"use client";

import {
  ChevronRight,
  Circle,
  Grid,
  Info,
  Menu,
  MousePointer2,
  Play,
  RotateCcw,
  Square,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  astar,
  bfs,
  dfs,
  dijkstra,
  generateMaze,
  getNodesInShortestPathOrder,
} from "./algorithms";
import { Algorithm, Node } from "./types";

const INITIAL_ROWS = 25;
const INITIAL_COLS = 50;

const ALGORITHMS: { id: Algorithm; name: string; description: string }[] = [
  {
    id: "DIJKSTRA",
    name: "DIJKSTRA",
    description: "Guarantees shortest path. Weighted search.",
  },
  {
    id: "ASTAR",
    name: "A-STAR",
    description: "Uses heuristics for speed. Guarantees shortest path.",
  },
  {
    id: "BFS",
    name: "BFS",
    description: "Breadth-First Search. Shortest path on unweighted grids.",
  },
  {
    id: "DFS",
    name: "DFS",
    description: "Depth-First Search. Does not guarantee shortest path.",
  },
];

export default function Pathfinder() {
  const [grid, setGrid] = useState<Node[][]>([]);
  const [mouseIsPressed, setMouseIsPressed] = useState(false);
  const [startNodePos, setStartNodePos] = useState({ row: 10, col: 10 });
  const [finishNodePos, setFinishNodePos] = useState({ row: 10, col: 40 });
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [algorithm, setAlgorithm] = useState<Algorithm>("DIJKSTRA");
  const [speed, setSpeed] = useState(10);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [movingNode, setMovingNode] = useState<"START" | "FINISH" | null>(null);
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [cols, setCols] = useState(INITIAL_COLS);

  const gridRef = useRef<HTMLDivElement>(null);

  const createNode = useCallback(
    (col: number, row: number): Node => ({
      col,
      row,
      isStart: row === startNodePos.row && col === startNodePos.col,
      isFinish: row === finishNodePos.row && col === finishNodePos.col,
      distance: Infinity,
      isVisited: false,
      isWall: false,
      previousNode: null,
    }),
    [startNodePos, finishNodePos],
  );

  const getInitialGrid = useCallback(() => {
    const newGrid = [];
    for (let row = 0; row < rows; row++) {
      const currentRow = [];
      for (let col = 0; col < cols; col++) {
        currentRow.push(createNode(col, row));
      }
      newGrid.push(currentRow);
    }
    return newGrid;
  }, [rows, cols, createNode]);

  useEffect(() => {
    setGrid(getInitialGrid());
  }, [getInitialGrid]);

  useEffect(() => {
    // Adjust start and finish positions if they are out of bounds
    setStartNodePos((prev) => ({
      row: Math.min(prev.row, rows - 1),
      col: Math.min(prev.col, cols - 1),
    }));
    setFinishNodePos((prev) => ({
      row: Math.min(prev.row, rows - 1),
      col: Math.min(prev.col, cols - 1),
    }));
  }, [rows, cols]);

  const handleMouseDown = (row: number, col: number) => {
    if (isVisualizing) return;
    const node = grid[row][col];
    if (node.isStart) {
      setMovingNode("START");
    } else if (node.isFinish) {
      setMovingNode("FINISH");
    } else {
      const newGrid = getGridWithWallToggled(grid, row, col);
      setGrid(newGrid);
    }
    setMouseIsPressed(true);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!mouseIsPressed || isVisualizing) return;
    if (movingNode === "START") {
      if (grid[row][col].isFinish || grid[row][col].isWall) return;
      setStartNodePos({ row, col });
      const newGrid = grid.map((r) =>
        r.map((n) => ({
          ...n,
          isStart: n.row === row && n.col === col,
        })),
      );
      setGrid(newGrid);
    } else if (movingNode === "FINISH") {
      if (grid[row][col].isStart || grid[row][col].isWall) return;
      setFinishNodePos({ row, col });
      const newGrid = grid.map((r) =>
        r.map((n) => ({
          ...n,
          isFinish: n.row === row && n.col === col,
        })),
      );
      setGrid(newGrid);
    } else {
      const newGrid = getGridWithWallToggled(grid, row, col);
      setGrid(newGrid);
    }
  };

  const handleMouseUp = () => {
    setMouseIsPressed(false);
    setMovingNode(null);
  };

  const getGridWithWallToggled = (grid: Node[][], row: number, col: number) => {
    const newGrid = grid.slice();
    const node = newGrid[row][col];
    const newNode = {
      ...node,
      isWall: !node.isWall,
    };
    newGrid[row][col] = newNode;
    return newGrid;
  };

  const resetGrid = () => {
    if (isVisualizing) return;
    setGrid(getInitialGrid());
    // Clear visualization classes manually if needed, but state update should handle it
    const nodes = document.querySelectorAll(".node");
    nodes.forEach((node) => {
      node.classList.remove("node-visited");
      node.classList.remove("node-shortest-path");
    });
  };

  const clearPath = () => {
    if (isVisualizing) return;
    const newGrid = grid.map((row) =>
      row.map((node) => ({
        ...node,
        distance: Infinity,
        isVisited: false,
        previousNode: null,
      })),
    );
    setGrid(newGrid);
    const nodes = document.querySelectorAll(".node");
    nodes.forEach((node) => {
      node.classList.remove("node-visited");
      node.classList.remove("node-shortest-path");
    });
  };

  const visualize = async () => {
    if (isVisualizing) return;
    setIsVisualizing(true);
    clearPath();

    const startNode = grid[startNodePos.row][startNodePos.col];
    const finishNode = grid[finishNodePos.row][finishNodePos.col];

    // Deep copy grid for algorithm
    const gridCopy = grid.map((row) => row.map((node) => ({ ...node })));
    const startNodeCopy = gridCopy[startNodePos.row][startNodePos.col];
    const finishNodeCopy = gridCopy[finishNodePos.row][finishNodePos.col];

    let visitedNodesInOrder: Node[] = [];
    switch (algorithm) {
      case "DIJKSTRA":
        visitedNodesInOrder = dijkstra(gridCopy, startNodeCopy, finishNodeCopy);
        break;
      case "ASTAR":
        visitedNodesInOrder = astar(gridCopy, startNodeCopy, finishNodeCopy);
        break;
      case "BFS":
        visitedNodesInOrder = bfs(gridCopy, startNodeCopy, finishNodeCopy);
        break;
      case "DFS":
        visitedNodesInOrder = dfs(gridCopy, startNodeCopy, finishNodeCopy);
        break;
    }

    const nodesInShortestPathOrder =
      getNodesInShortestPathOrder(finishNodeCopy);
    animate(visitedNodesInOrder, nodesInShortestPathOrder);
  };

  const animate = (
    visitedNodesInOrder: Node[],
    nodesInShortestPathOrder: Node[],
  ) => {
    for (let i = 0; i <= visitedNodesInOrder.length; i++) {
      if (i === visitedNodesInOrder.length) {
        setTimeout(() => {
          animateShortestPath(nodesInShortestPathOrder);
        }, speed * i);
        return;
      }
      setTimeout(() => {
        const node = visitedNodesInOrder[i];
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el && !node.isStart && !node.isFinish) {
          el.classList.add("node-visited");
        }
      }, speed * i);
    }
  };

  const animateShortestPath = (nodesInShortestPathOrder: Node[]) => {
    for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
      setTimeout(() => {
        const node = nodesInShortestPathOrder[i];
        const el = document.getElementById(`node-${node.row}-${node.col}`);
        if (el && !node.isStart && !node.isFinish) {
          el.classList.add("node-shortest-path");
        }
        if (i === nodesInShortestPathOrder.length - 1) {
          setIsVisualizing(false);
        }
      }, 50 * i);
    }
  };

  const handleGenerateMaze = () => {
    if (isVisualizing) return;
    resetGrid();
    const newGrid = getInitialGrid();
    const walls = generateMaze(newGrid, cols, rows);

    // Animate wall generation
    walls.forEach((node, i) => {
      setTimeout(() => {
        setGrid((prev) => {
          const next = [...prev];
          next[node.row] = [...next[node.row]];
          next[node.row][node.col] = {
            ...next[node.row][node.col],
            isWall: true,
          };
          return next;
        });
      }, i * 5);
    });
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative">
      <div className="scanline" />

      {/* Header */}
      <header className="border-b border-dim p-4 flex items-center justify-between z-40 bg-ink/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 border border-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter uppercase leading-none">
              Pathfinder_v2.0
            </h1>
            <p className="text-[10px] text-dim font-medium tracking-widest uppercase mt-1">
              Built by AIS.Lab / 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-dim uppercase tracking-widest">
              System Status
            </span>
            <span className="text-xs text-start flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-start animate-pulse" />
              Operational
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 border border-dim hover:border-accent transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 flex relative overflow-hidden">
        {/* Sidebar Controls */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-80 border-r border-dim bg-ink z-30 flex flex-col"
            >
              <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                <section>
                  <label className="text-[10px] text-dim uppercase tracking-widest block mb-4">
                    01 // Algorithm Selection
                  </label>
                  <div className="space-y-2">
                    {ALGORITHMS.map((algo) => (
                      <button
                        key={algo.id}
                        onClick={() => setAlgorithm(algo.id)}
                        disabled={isVisualizing}
                        className={`w-full text-left p-3 border transition-all group ${
                          algorithm === algo.id
                            ? "border-accent bg-accent text-ink"
                            : "border-dim hover:border-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{algo.name}</span>
                          {algorithm === algo.id && (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                        <p
                          className={`text-[10px] leading-tight ${algorithm === algo.id ? "text-ink/70" : "text-dim group-hover:text-paper"}`}
                        >
                          {algo.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] text-dim uppercase tracking-widest block mb-4">
                    02 // Simulation Controls
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={visualize}
                      disabled={isVisualizing}
                      className="col-span-2 flex items-center justify-center gap-2 bg-paper text-ink p-3 font-bold hover:bg-white transition-colors disabled:opacity-50"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      START SIMULATION
                    </button>
                    <button
                      onClick={resetGrid}
                      disabled={isVisualizing}
                      className="flex items-center justify-center gap-2 border border-dim p-3 text-xs hover:border-accent transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      RESET
                    </button>
                    <button
                      onClick={clearPath}
                      disabled={isVisualizing}
                      className="flex items-center justify-center gap-2 border border-dim p-3 text-xs hover:border-accent transition-colors disabled:opacity-50"
                    >
                      <Square className="w-3 h-3" />
                      CLEAR
                    </button>
                    <button
                      onClick={handleGenerateMaze}
                      disabled={isVisualizing}
                      className="col-span-2 flex items-center justify-center gap-2 border border-dim p-3 text-xs hover:border-accent transition-colors disabled:opacity-50"
                    >
                      <Grid className="w-3 h-3" />
                      GENERATE MAZE
                    </button>
                  </div>
                </section>

                <section>
                  <label className="text-[10px] text-dim uppercase tracking-widest block mb-4">
                    03 // Parameters
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span>MAZE_WIDTH</span>
                        <span>{cols}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={cols}
                        onChange={(e) => setCols(parseInt(e.target.value))}
                        disabled={isVisualizing}
                        className="w-full accent-accent bg-dim h-1 appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span>MAZE_HEIGHT</span>
                        <span>{rows}</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="50"
                        value={rows}
                        onChange={(e) => setRows(parseInt(e.target.value))}
                        disabled={isVisualizing}
                        className="w-full accent-accent bg-dim h-1 appearance-none cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span>SIMULATION_SPEED</span>
                        <span>{speed}ms</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        disabled={isVisualizing}
                        className="w-full accent-accent bg-dim h-1 appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-dim">
                <div className="flex items-center gap-3 text-[10px] text-dim">
                  <Info className="w-3 h-3" />
                  <p>
                    DRAG START/END NODES TO REPOSITION. CLICK/DRAG ON GRID TO
                    DRAW WALLS.
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Grid Area */}
        <div className="flex-1 bg-ink relative overflow-hidden flex items-center justify-center p-8">
          <div className="absolute inset-0 grid-line opacity-20 pointer-events-none" />

          <div
            className="relative border border-dim shadow-2xl bg-ink"
            onMouseLeave={handleMouseUp}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 20px)`,
                gridTemplateRows: `repeat(${rows}, 20px)`,
              }}
            >
              {grid.map((row, rowIdx) =>
                row.map((node, nodeIdx) => (
                  <div
                    key={`${rowIdx}-${nodeIdx}`}
                    id={`node-${rowIdx}-${nodeIdx}`}
                    className={`
                      node w-[20px] h-[20px] border-[0.5px] border-dim/30 transition-all duration-300
                      ${node.isStart ? "node-start" : ""}
                      ${node.isFinish ? "node-finish" : ""}
                      ${node.isWall ? "node-wall" : ""}
                    `}
                    onMouseDown={() => handleMouseDown(rowIdx, nodeIdx)}
                    onMouseEnter={() => handleMouseEnter(rowIdx, nodeIdx)}
                    onMouseUp={handleMouseUp}
                  >
                    {node.isStart && (
                      <div className="w-full h-full flex items-center justify-center bg-start">
                        <MousePointer2 className="w-3 h-3 text-ink" />
                      </div>
                    )}
                    {node.isFinish && (
                      <div className="w-full h-full flex items-center justify-center bg-end">
                        <Circle className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                )),
              )}
            </div>
          </div>

          {/* Grid Overlay Info */}
          <div className="absolute bottom-4 right-4 flex gap-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="w-2 h-2 bg-start" /> Start
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="w-2 h-2 bg-end" /> Target
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="w-2 h-2 bg-dim" /> Wall
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="border-t border-dim p-2 flex items-center justify-between text-[10px] text-dim uppercase tracking-widest z-40 bg-ink">
        <div className="flex gap-4">
          <span>
            GRID: {rows}x{cols}
          </span>
          <span>ALGO: {algorithm}</span>
          <span>SPEED: {speed}MS</span>
        </div>
        <div className="flex gap-4">
          <span>LATENCY: 0.02MS</span>
          <span>MEM: 12.4MB</span>
          <span className="text-accent animate-pulse">LIVE_FEED</span>
        </div>
      </footer>

      <style>{`
        .node-visited {
          background-color: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          animation: visitedAnimation 0.6s ease-out forwards;
        }

        .node-shortest-path {
          background-color: white;
          border-color: white;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          z-index: 10;
          animation: shortestPathAnimation 0.3s ease-out forwards;
        }

        .node-wall {
          background-color: #333;
          border-color: #444;
          animation: wallAnimation 0.3s ease-out forwards;
        }

        @keyframes visitedAnimation {
          0% { transform: scale(0.3); background-color: rgba(255, 255, 255, 0.5); border-radius: 100%; }
          50% { background-color: rgba(255, 255, 255, 0.2); }
          100% { transform: scale(1); background-color: rgba(255, 255, 255, 0.1); }
        }

        @keyframes shortestPathAnimation {
          0% { transform: scale(0.6); background-color: white; }
          100% { transform: scale(1); background-color: white; }
        }

        @keyframes wallAnimation {
          0% { transform: scale(0.6); }
          100% { transform: scale(1); }
        }

        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 4px;
          background: white;
          cursor: pointer;
          border-radius: 0;
        }
      `}</style>
    </div>
  );
}
