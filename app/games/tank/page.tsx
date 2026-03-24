"use client";

import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { GameManager } from './game/GameManager';
import { COLORS } from './game/Constants';

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    const initPixi = async () => {
      if (!canvasRef.current) return;

      const app = new Application();
      await app.init({
        resizeTo: window,
        backgroundColor: COLORS.BACKGROUND,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      canvasRef.current.appendChild(app.canvas);
      appRef.current = app;

      // Initialize Game Manager
      new GameManager(app);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={canvasRef} 
      className="w-full h-screen overflow-hidden bg-black"
      id="game-container"
    />
  );
}
