"use client";

import { motion } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  CELL_SIZE,
  ENEMY_TYPES,
  INITIAL_LIVES,
  LEVELS,
  MAX_PARTICLES,
  TOWER_TYPES,
  WAVES,
} from "./constants";
import {
  Enemy,
  FloatingText,
  Particle,
  Point,
  Projectile,
  Tower
} from "./types";
import { generateMaze } from "./utils/maze";
import { aStar } from "./utils/pathfinding";

import { GameOverOverlay } from "./components/GameOverOverlay";
import { Header } from "./components/Header";
import { SidebarControls } from "./components/SidebarControls";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const level = LEVELS[currentLevelIdx];
  const { gridSize, startNode, goalNode } = level;
  const width = gridSize * CELL_SIZE;
  const height = gridSize * CELL_SIZE;

  const [grid, setGrid] = useState<boolean[][]>(() => {
    const g = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(false),
    );
    level.obstacles.forEach((o) => {
      if (o.y < gridSize && o.x < gridSize) g[o.y][o.x] = true;
    });
    return g;
  });

  const [distanceMap, setDistanceMap] = useState<number[][]>([]);
  const [money, setMoney] = useState(level.initialMoney);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [screenShake, setScreenShake] = useState(0);
  const [wave, setWave] = useState(0);
  const [isWaveActive, setIsWaveActive] = useState(false);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedTowerType, setSelectedTowerType] =
    useState<keyof typeof TOWER_TYPES>("basic");
  const [hoveredCell, setHoveredCell] = useState<Point | null>(null);

  const [enemyCount, setEnemyCount] = useState(0);
  const [showGraph, setShowGraph] = useState(false);

  // High-frequency data stored in refs to avoid React re-renders
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const towersRef = useRef<Tower[]>([]);
  const enemiesToSpawnRef = useRef(0);
  const moneyRef = useRef(level.initialMoney);
  const livesRef = useRef(INITIAL_LIVES);
  const isWaveActiveRef = useRef(false);
  const enemyCountRef = useRef(0);

  // Sync state to refs for initialization and level resets
  useEffect(() => {
    const newLevel = LEVELS[currentLevelIdx];
    const g = generateMaze(
      newLevel.gridSize,
      newLevel.startNode,
      newLevel.goalNode,
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrid(g);

    enemiesRef.current = [];
    projectilesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    towersRef.current = [];
    enemiesToSpawnRef.current = 0;

    moneyRef.current = newLevel.initialMoney;
    livesRef.current = INITIAL_LIVES;
    isWaveActiveRef.current = false;
    enemyCountRef.current = 0;

    setTowers([]);
    setMoney(newLevel.initialMoney);
    setLives(INITIAL_LIVES);
    setWave(0);
    setIsWaveActive(false);
    setEnemyCount(0);
  }, [currentLevelIdx]);

  // Sync towers state to ref
  useEffect(() => {
    towersRef.current = towers;
  }, [towers]);

  // Sync money and lives state to ref when they change via UI/init
  useEffect(() => {
    moneyRef.current = money;
  }, [money]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => {
    isWaveActiveRef.current = isWaveActive;
  }, [isWaveActive]);

  // Memoize Current Path
  const currentPath = React.useMemo(() => {
    return aStar(startNode, goalNode, grid, gridSize) || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, wave, startNode, goalNode, gridSize]);

  // Calculate Distance Map (BFS from Goal)
  const calculateDistanceMap = useCallback(
    (currentGrid: boolean[][]) => {
      const map = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(Infinity),
      );
      const queue: Point[] = [{ ...goalNode }];
      map[goalNode.y][goalNode.x] = 0;

      const dirs = [
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: -1, y: 0 },
      ];

      while (queue.length > 0) {
        const curr = queue.shift()!;
        for (const dir of dirs) {
          const nx = curr.x + dir.x;
          const ny = curr.y + dir.y;

          if (
            nx >= 0 &&
            nx < gridSize &&
            ny >= 0 &&
            ny < gridSize &&
            !currentGrid[ny][nx] &&
            map[ny][nx] === Infinity
          ) {
            const cost = dir.x !== 0 && dir.y !== 0 ? 1.414 : 1; // Diagonal cost
            map[ny][nx] = map[curr.y][curr.x] + cost;
            queue.push({ x: nx, y: ny });
          }
        }
      }
      setDistanceMap(map);
      return map;
    },
    [gridSize, goalNode],
  );

  // Initialize Distance Map
  useEffect(() => {
    calculateDistanceMap(grid);
  }, [calculateDistanceMap, grid]);

  const placeTower = (x: number, y: number) => {
    if (money < TOWER_TYPES[selectedTowerType].cost) return;

    // Check if placing on a wall
    if (!grid[y][x]) {
      floatingTextsRef.current.push({
        id: Math.random(),
        pos: { x, y },
        text: "PLACE ON WALLS ONLY!",
        life: 1000,
        color: "#ef4444",
      });
      return;
    }

    // Check if already occupied
    if (towers.some((t) => t.gridX === x && t.gridY === y)) return;

    setTowers((prev) => [
      ...prev,
      {
        id: Date.now(),
        gridX: x,
        gridY: y,
        type: selectedTowerType,
        damage: TOWER_TYPES[selectedTowerType].damage,
        range: TOWER_TYPES[selectedTowerType].range,
        cooldown: TOWER_TYPES[selectedTowerType].cooldown,
        lastShot: 0,
        targetX: selectedTowerType === "teleporter" ? startNode.x : undefined,
        targetY: selectedTowerType === "teleporter" ? startNode.y : undefined,
      },
    ]);
    setMoney((m) => m - TOWER_TYPES[selectedTowerType].cost);
  };

  const startWave = () => {
    if (isWaveActiveRef.current) return;
    isWaveActiveRef.current = true;
    setIsWaveActive(true);
    const waveIdx = wave % WAVES.length;
    const waveConfig = WAVES[waveIdx];
    const nextWave = wave + 1;
    setWave(nextWave);

    // Difficulty scaling
    const difficultyMultiplier = 1 + Math.floor(wave / WAVES.length) * 0.8; // Increased scaling

    let spawnDelay = 0;

    // Calculate total enemies to spawn
    let totalEnemies = 0;
    waveConfig.enemies.forEach((group) => (totalEnemies += group.count));
    enemiesToSpawnRef.current = totalEnemies;

    waveConfig.enemies.forEach((enemyGroup) => {
      for (let i = 0; i < enemyGroup.count; i++) {
        setTimeout(
          () => {
            const type = ENEMY_TYPES[enemyGroup.type];
            const health =
              (30 + nextWave * 15) *
              type.healthMultiplier *
              difficultyMultiplier;
            const speed =
              (0.025 + Math.min(nextWave * 0.006, 0.05)) * type.speedMultiplier;

            enemiesRef.current.push({
              id: Math.random(),
              type: enemyGroup.type,
              pos: { x: startNode.x, y: startNode.y },
              health: health,
              maxHealth: health,
              speed: speed,
              originalSpeed: speed,
              slowTimer: 0,
              reward: Math.floor(
                (5 + Math.floor(nextWave / 2)) * type.rewardMultiplier,
              ),
            });
            enemiesToSpawnRef.current -= 1;
          },
          spawnDelay + i * enemyGroup.delay,
        );
      }
      spawnDelay += enemyGroup.count * enemyGroup.delay;
    });
  };

  // Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const update = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (screenShake > 0) {
        setScreenShake((s) => Math.max(0, s - deltaTime * 0.01));
      }

      // Update Particles
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          pos: { x: p.pos.x + p.vel.x, y: p.pos.y + p.vel.y },
          life: p.life - deltaTime,
        }))
        .filter((p) => p.life > 0);

      // Update Floating Texts
      floatingTextsRef.current = floatingTextsRef.current
        .map((t) => ({
          ...t,
          pos: { x: t.pos.x, y: t.pos.y - 0.01 },
          life: t.life - deltaTime,
        }))
        .filter((t) => t.life > 0);

      if (
        isWaveActiveRef.current ||
        enemiesRef.current.length > 0 ||
        particlesRef.current.length > 0 ||
        floatingTextsRef.current.length > 0
      ) {
        let moneyChanged = false;
        let livesChanged = false;
        let waveActiveChanged = false;
        let towersChanged = false;
        // Update Enemies
        enemiesRef.current = enemiesRef.current
          .map((enemy) => {
            if (enemy.slowTimer > 0) {
              enemy.slowTimer -= deltaTime;
              if (enemy.slowTimer <= 0) {
                enemy.speed = enemy.originalSpeed;
              }
            }

            const cx = Math.floor(enemy.pos.x);
            const cy = Math.floor(enemy.pos.y);

            const dirs = [
              { x: 0, y: 1 },
              { x: 0, y: -1 },
              { x: 1, y: 0 },
              { x: -1, y: 0 },
            ];

            let bestDir = { x: 0, y: 0 };
            let minVal = distanceMap[cy]?.[cx] ?? Infinity;

            for (const dir of dirs) {
              const nx = cx + dir.x;
              const ny = cy + dir.y;
              const val = distanceMap[ny]?.[nx] ?? Infinity;

              if (val < minVal) {
                minVal = val;
                bestDir = dir;
              }
            }

            const targetX = cx + bestDir.x;
            const targetY = cy + bestDir.y;

            const dx = targetX - enemy.pos.x;
            const dy = targetY - enemy.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.05 && cx === goalNode.x && cy === goalNode.y) {
              livesRef.current -= 1;
              livesChanged = true;
              setScreenShake(10);
              if (enemy.type === "bomber") {
                const prevCount = towersRef.current.length;
                towersRef.current = towersRef.current.filter((t) => {
                  const inRange =
                    Math.abs(t.gridX - cx) <= 2 && Math.abs(t.gridY - cy) <= 2;
                  return !inRange;
                });
                if (towersRef.current.length < prevCount) {
                  towersChanged = true;
                }
                setScreenShake(20);
                const explosionParticles: Particle[] = Array.from({
                  length: 30,
                }).map(() => ({
                  id: Math.random(),
                  pos: { x: enemy.pos.x + 0.5, y: enemy.pos.y + 0.5 },
                  vel: {
                    x: (Math.random() - 0.5) * 0.2,
                    y: (Math.random() - 0.5) * 0.2,
                  },
                  life: 800,
                  maxLife: 800,
                  color: "#f97316",
                  size: 5,
                }));
                particlesRef.current = [
                  ...particlesRef.current,
                  ...explosionParticles,
                ].slice(-MAX_PARTICLES);
              }
              return null;
            }

            if (dist === 0) return enemy;

            // Limit movement to not overshoot the target
            const moveDist = Math.min(enemy.speed, dist);
            const moveX = (dx / dist) * moveDist;
            const moveY = (dy / dist) * moveDist;

            return {
              ...enemy,
              pos: { x: enemy.pos.x + moveX, y: enemy.pos.y + moveY },
            };
          })
          .filter(Boolean) as Enemy[];

        // Check for wave clear
        if (
          enemiesRef.current.length === 0 &&
          enemiesToSpawnRef.current === 0 &&
          isWaveActiveRef.current
        ) {
          isWaveActiveRef.current = false;
          waveActiveChanged = true;
          floatingTextsRef.current.push({
            id: Math.random(),
            pos: { x: goalNode.x, y: goalNode.y },
            text: "WAVE CLEARED!",
            life: 2000,
            color: "#3b82f6",
          });
        }

        // Tower Logic
        towersRef.current.forEach((tower) => {
          if (time - tower.lastShot < tower.cooldown) return;

          if (tower.type === "teleporter") {
            const targetEnemy = enemiesRef.current.find((enemy) => {
              const dx = enemy.pos.x - tower.gridX;
              const dy = enemy.pos.y - tower.gridY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              return dist <= tower.range;
            });

            if (targetEnemy) {
              targetEnemy.pos = { x: tower.targetX!, y: tower.targetY! };
              const newParticles: Particle[] = Array.from({ length: 15 }).map(
                () => ({
                  id: Math.random(),
                  pos: {
                    x: targetEnemy.pos.x + 0.5,
                    y: targetEnemy.pos.y + 0.5,
                  },
                  vel: {
                    x: (Math.random() - 0.5) * 0.1,
                    y: (Math.random() - 0.5) * 0.1,
                  },
                  life: 500,
                  maxLife: 500,
                  color: TOWER_TYPES.teleporter.color,
                  size: 2,
                }),
              );
              particlesRef.current = [
                ...particlesRef.current,
                ...newParticles,
              ].slice(-MAX_PARTICLES);
              tower.lastShot = time;
            }
            return;
          }

          let closestEnemy: Enemy | null = null;
          let minDist = Infinity;

          enemiesRef.current.forEach((enemy) => {
            const dx = enemy.pos.x - tower.gridX;
            const dy = enemy.pos.y - tower.gridY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= tower.range && dist < minDist) {
              minDist = dist;
              closestEnemy = enemy;
            }
          });

          if (closestEnemy) {
            projectilesRef.current.push({
              pos: { x: tower.gridX + 0.5, y: tower.gridY + 0.5 },
              target: closestEnemy,
              damage: tower.damage,
              speed: 0.35,
              color: TOWER_TYPES[tower.type].color,
              type: tower.type,
            });
            tower.lastShot = time;
          }
        });

        // Update Projectiles
        projectilesRef.current = projectilesRef.current
          .map((proj) => {
            const target = enemiesRef.current.find(
              (e) => e.id === proj.target.id,
            );
            if (!target) return null;

            const dx = target.pos.x + 0.5 - proj.pos.x;
            const dy = target.pos.y + 0.5 - proj.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.2) {
              target.health -= proj.damage;

              if (proj.type === "slow") {
                target.speed = target.originalSpeed * 0.5;
                target.slowTimer = 2000; // 2 seconds slow
              }

              const hitParticles: Particle[] = Array.from({ length: 4 }).map(
                () => ({
                  id: Math.random(),
                  pos: { x: proj.pos.x, y: proj.pos.y },
                  vel: {
                    x: (Math.random() - 0.5) * 0.05,
                    y: (Math.random() - 0.5) * 0.05,
                  },
                  life: 300,
                  maxLife: 300,
                  color: proj.color,
                  size: 1.5,
                }),
              );
              particlesRef.current = [
                ...particlesRef.current,
                ...hitParticles,
              ].slice(-MAX_PARTICLES);

              if (target.health <= 0) {
                moneyRef.current += target.reward;
                moneyChanged = true;
                floatingTextsRef.current.push({
                  id: Math.random(),
                  pos: { x: target.pos.x, y: target.pos.y },
                  text: `+$${target.reward}`,
                  life: 1000,
                  color: "#10b981",
                });

                if (target.type === "bomber") {
                  const cx = Math.floor(target.pos.x);
                  const cy = Math.floor(target.pos.y);
                  const prevCount = towersRef.current.length;
                  towersRef.current = towersRef.current.filter((t) => {
                    const inRange =
                      Math.abs(t.gridX - cx) <= 2 &&
                      Math.abs(t.gridY - cy) <= 2;
                    return !inRange;
                  });
                  if (towersRef.current.length < prevCount) {
                    towersChanged = true;
                  }
                  setScreenShake(20);
                  const explosionParticles: Particle[] = Array.from({
                    length: 30,
                  }).map(() => ({
                    id: Math.random(),
                    pos: { x: target.pos.x + 0.5, y: target.pos.y + 0.5 },
                    vel: {
                      x: (Math.random() - 0.5) * 0.2,
                      y: (Math.random() - 0.5) * 0.2,
                    },
                    life: 800,
                    maxLife: 800,
                    color: "#f97316",
                    size: 5,
                  }));
                  particlesRef.current = [
                    ...particlesRef.current,
                    ...explosionParticles,
                  ].slice(-MAX_PARTICLES);
                } else {
                  const deathParticles: Particle[] = Array.from({
                    length: 12,
                  }).map(() => ({
                    id: Math.random(),
                    pos: { x: target.pos.x + 0.5, y: target.pos.y + 0.5 },
                    vel: {
                      x: (Math.random() - 0.5) * 0.08,
                      y: (Math.random() - 0.5) * 0.08,
                    },
                    life: 600,
                    maxLife: 600,
                    color: ENEMY_TYPES[target.type].color,
                    size: 3,
                  }));
                  particlesRef.current = [
                    ...particlesRef.current,
                    ...deathParticles,
                  ].slice(-MAX_PARTICLES);
                }

                // Remove enemy from list
                enemiesRef.current = enemiesRef.current.filter(
                  (e) => e.id !== target.id,
                );
              }
              return null;
            }

            const moveX = (dx / dist) * proj.speed;
            const moveY = (dy / dist) * proj.speed;

            return {
              ...proj,
              pos: { x: proj.pos.x + moveX, y: proj.pos.y + moveY },
            };
          })
          .filter(Boolean) as Projectile[];

        // Batch UI updates
        if (moneyChanged) setMoney(moneyRef.current);
        if (livesChanged) setLives(livesRef.current);
        if (waveActiveChanged) setIsWaveActive(isWaveActiveRef.current);
        if (towersChanged) setTowers([...towersRef.current]);
        const totalRemaining =
          enemiesRef.current.length + enemiesToSpawnRef.current;
        if (totalRemaining !== enemyCountRef.current) {
          enemyCountRef.current = totalRemaining;
          setEnemyCount(enemyCountRef.current);
        }
      }

      // Render
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Grid
        ctx.strokeStyle = "#3b82f611";
        ctx.lineWidth = 1;
        for (let i = 0; i <= gridSize; i++) {
          ctx.beginPath();
          ctx.moveTo(i * CELL_SIZE, 0);
          ctx.lineTo(i * CELL_SIZE, height);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * CELL_SIZE);
          ctx.lineTo(width, i * CELL_SIZE);
          ctx.stroke();
        }

        // Draw Start/Goal
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#10b981";
        ctx.fillStyle = "#10b98133";
        ctx.fillRect(
          startNode.x * CELL_SIZE,
          startNode.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        );
        ctx.strokeStyle = "#10b981";
        ctx.strokeRect(
          startNode.x * CELL_SIZE,
          startNode.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        );

        ctx.shadowColor = "#3b82f6";
        ctx.fillStyle = "#3b82f633";
        ctx.fillRect(
          goalNode.x * CELL_SIZE,
          goalNode.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        );
        ctx.strokeStyle = "#3b82f6";
        ctx.strokeRect(
          goalNode.x * CELL_SIZE,
          goalNode.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        );
        ctx.shadowBlur = 0;

        // Draw Obstacles (Maze Walls)
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            if (grid[y][x]) {
              ctx.shadowBlur = 2;
              ctx.shadowColor = "#000000";
              ctx.fillRect(
                x * CELL_SIZE + 1,
                y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2,
              );
              ctx.strokeRect(
                x * CELL_SIZE + 1,
                y * CELL_SIZE + 1,
                CELL_SIZE - 2,
                CELL_SIZE - 2,
              );
              ctx.shadowBlur = 0;
            }
          }
        }

        // Draw Towers
        towersRef.current.forEach((t) => {
          const color = TOWER_TYPES[t.type].color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(
            t.gridX * CELL_SIZE + 4,
            t.gridY * CELL_SIZE + 4,
            CELL_SIZE - 8,
            CELL_SIZE - 8,
            6,
          );
          ctx.fill();
          ctx.shadowBlur = 0;

          if (
            hoveredCell &&
            hoveredCell.x === t.gridX &&
            hoveredCell.y === t.gridY
          ) {
            ctx.beginPath();
            ctx.arc(
              t.gridX * CELL_SIZE + CELL_SIZE / 2,
              t.gridY * CELL_SIZE + CELL_SIZE / 2,
              t.range * CELL_SIZE,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = color + "11";
            ctx.fill();
            ctx.strokeStyle = color + "33";
            ctx.stroke();
          }
        });

        // Draw Particles
        particlesRef.current.forEach((p) => {
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(
            p.pos.x * CELL_SIZE,
            p.pos.y * CELL_SIZE,
            p.size,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.globalAlpha = 1;
        });

        // Draw Enemies
        enemiesRef.current.forEach((e) => {
          const type = ENEMY_TYPES[e.type];
          ctx.shadowBlur = 5;
          ctx.shadowColor = type.color;
          ctx.fillStyle = type.color;
          ctx.beginPath();
          ctx.arc(
            e.pos.x * CELL_SIZE + CELL_SIZE / 2,
            e.pos.y * CELL_SIZE + CELL_SIZE / 2,
            type.size,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.shadowBlur = 0;

          const barWidth = 24;
          const healthPercent = e.health / e.maxHealth;
          ctx.fillStyle = "#333";
          ctx.fillRect(
            e.pos.x * CELL_SIZE + (CELL_SIZE - barWidth) / 2,
            e.pos.y * CELL_SIZE - 8,
            barWidth,
            4,
          );
          ctx.fillStyle =
            healthPercent > 0.5
              ? "#10b981"
              : healthPercent > 0.2
                ? "#f59e0b"
                : "#ef4444";
          ctx.fillRect(
            e.pos.x * CELL_SIZE + (CELL_SIZE - barWidth) / 2,
            e.pos.y * CELL_SIZE - 8,
            barWidth * healthPercent,
            4,
          );
        });

        // Draw Projectiles
        projectilesRef.current.forEach((p) => {
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.pos.x * CELL_SIZE, p.pos.y * CELL_SIZE, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Draw Floating Texts
        floatingTextsRef.current.forEach((t) => {
          ctx.fillStyle = t.color;
          ctx.font = "bold 12px JetBrains Mono";
          ctx.globalAlpha = t.life / 1000;
          ctx.fillText(t.text, t.pos.x * CELL_SIZE, t.pos.y * CELL_SIZE);
          ctx.globalAlpha = 1;
        });

        // Draw Hover
        if (hoveredCell && grid[hoveredCell.y][hoveredCell.x]) {
          ctx.fillStyle = TOWER_TYPES[selectedTowerType].color + "66";
          ctx.fillRect(
            hoveredCell.x * CELL_SIZE,
            hoveredCell.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE,
          );
          ctx.strokeStyle = TOWER_TYPES[selectedTowerType].color;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            hoveredCell.x * CELL_SIZE,
            hoveredCell.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE,
          );
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    distanceMap,
    gridSize,
    goalNode,
    startNode,
    grid,
    hoveredCell,
    selectedTowerType,
    height,
    width,
  ]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
    placeTower(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      setHoveredCell({ x, y });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-4 md:p-8 flex flex-col items-center overflow-x-hidden">
      <Header
        lives={lives}
        money={money}
        wave={wave}
        showGraph={showGraph}
        setShowGraph={setShowGraph}
        levels={LEVELS}
        currentLevelIdx={currentLevelIdx}
        setCurrentLevelIdx={setCurrentLevelIdx}
        setEnemyCount={setEnemyCount}
      />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        {/* Game Area */}
        <motion.div
          animate={
            screenShake > 0
              ? {
                  x: [0, -screenShake, screenShake, 0],
                  y: [0, screenShake, -screenShake, 0],
                }
              : {}
          }
          transition={{ duration: 0.1, repeat: 2 }}
          className="relative bg-[#050505] border border-[#3b82f633] shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden rounded-lg"
        >
          <div className="absolute top-2 left-2 z-10 bg-[#3b82f6] text-white px-2 py-1 text-[10px] uppercase font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            Level {level.id}: {level.name}
          </div>

          <div className="crt-overlay" />
          <div className="scanline" />

          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredCell(null)}
            className="cursor-crosshair w-full aspect-square"
          />

          {lives <= 0 && <GameOverOverlay />}
        </motion.div>

        <SidebarControls
          isWaveActive={isWaveActive}
          enemyCount={enemyCount}
          startWave={startWave}
          selectedTowerType={selectedTowerType}
          setSelectedTowerType={setSelectedTowerType}
          currentPathLength={currentPath.length}
        />
      </div>

      {/* Footer */}
      <div className="mt-12 text-[9px] opacity-20 uppercase tracking-[0.4em] flex gap-4">
        <span>© 2026 GRAPH DEFENDER</span>
        <span>•</span>
        <span>TOPOLOGY OPTIMIZED</span>
        <span>•</span>
        <span>LATENCY: 0.02ms</span>
      </div>
    </div>
  );
}
