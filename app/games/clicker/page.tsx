"use client";

import React, { useState, useEffect, useCallback } from "react";

export default function Clicker() {
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [milestone, setMilestone] = useState<number>(50);
  const [message, setMessage] = useState<string>("Begin the journey");
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );

  const messages = [
    "Precision matters",
    "Focus on the center",
    "Simplicity is complexity",
    "Keep ascending",
    "Pure interaction",
    "The summit awaits",
  ];

  const handleInteraction = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Prevent default to stop ghost clicks on mobile
      if ("touches" in e) {
        // e.preventDefault(); // Handled by touch-action in CSS or manual listener if needed
      }

      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const newClick = { id: Date.now(), x: clientX, y: clientY };
      setClicks((prev) => [...prev, newClick]);
      setScore((prev) => prev + 1);

      // Remove the click element after animation
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      }, 700);
    },
    [],
  );

  useEffect(() => {
    if (score >= milestone) {
      setLevel((prev) => prev + 1);
      setMilestone((prev) => Math.floor(prev * 2.8));
      setMessage(messages[Math.floor(Math.random() * messages.length)]);
    }
  }, [score, milestone]);

  const progress = Math.min((score / milestone) * 100, 100);

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-[#F2F4F7] select-none overflow-hidden touch-none">
      {/* Floating +1 Elements */}
      {clicks.map((click) => (
        <div
          key={click.id}
          className="fixed pointer-events-none text-[#111827] font-extrabold text-xl z-50"
          style={{
            left: click.x,
            top: click.y,
            animation: "float-up 0.7s ease-out forwards",
          }}
        >
          +1
        </div>
      ))}

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
        }
        .neumorphic-card {
          box-shadow: 20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff;
        }
        .click-area {
          background: linear-gradient(145deg, #ffffff, #f0f0f0);
          box-shadow: 25px 25px 50px #d1d1d1, -25px -25px 50px #ffffff, inset 0 0 0 2px rgba(0,0,0,0.02);
        }
        .click-area:active {
          box-shadow: inset 10px 10px 20px #d1d1d1, inset -10px -10px 20px #ffffff;
          transform: scale(0.96);
        }
      `}</style>

      <div className="max-w-sm w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Modern <span className="text-gray-400">Minimal</span>
          </h1>
          <p className="text-gray-400 font-semibold text-[10px] tracking-[0.2em] uppercase">
            The Art of Interaction
          </p>
        </div>

        {/* Game Card */}
        <div className="neumorphic-card bg-white rounded-[40px] p-10 flex flex-col items-center space-y-14 relative overflow-hidden">
          {/* Stats Row */}
          <div className="flex space-x-6 w-full justify-center">
            <div className="bg-white rounded-[20px] shadow-[4px_4px_12px_rgba(0,0,0,0.03)] px-2 py-4 flex flex-col items-center flex-1 border border-gray-50">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.15em] mb-1">
                Score
              </span>
              <span className="text-2xl font-extrabold text-gray-900 leading-none">
                {score.toLocaleString()}
              </span>
            </div>
            <div className="bg-white rounded-[20px] shadow-[4px_4px_12px_rgba(0,0,0,0.03)] px-2 py-4 flex flex-col items-center flex-1 border border-gray-50">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-[0.15em] mb-1">
                Level
              </span>
              <span
                className={`text-2xl font-extrabold text-gray-900 leading-none transition-transform duration-300 ${score === 0 ? "" : "scale-100"}`}
              >
                {level}
              </span>
            </div>
          </div>

          {/* Main Interactive Element */}
          <div
            onMouseDown={handleInteraction}
            onTouchStart={(e) => {
              e.preventDefault();
              handleInteraction(e);
            }}
            className="click-area w-56 h-56 rounded-full flex items-center justify-center cursor-pointer relative group transition-all duration-150 border-[8px] border-white"
          >
            <div className="text-center transition-transform group-hover:scale-105">
              <div className="text-xs font-black text-gray-900 tracking-[0.3em] uppercase">
                Tap
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="w-full space-y-3">
            <div className="flex justify-between text-[9px] uppercase font-black text-gray-400 tracking-widest px-1">
              <span>Progress</span>
              <span className="text-gray-900">
                {score} / {milestone}
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-gray-400 text-[11px] font-medium tracking-wide h-6 uppercase italic opacity-60">
          {message}
        </div>
      </div>
    </div>
  );
}
