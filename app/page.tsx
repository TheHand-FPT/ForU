"use client";

import GameCard from "@/components/GameCard";
import { Gamepad2, Ghost, Rocket, Swords, Target, Zap } from "lucide-react";
import { motion } from "motion/react";

const GAMES = [
  {
    title: "Clicker",
    description: "The art of interaction.",
    icon: Target,
    href: "/games/clicker",
    color: "bg-red-500",
  },
  {
    title: "Pathfinder",
    description: "Maze solver simulation.",
    icon: Zap,
    href: "/games/pathfinder",
    color: "bg-yellow-500",
  },
  {
    title: "Tank",
    description: "Tank boom!",
    icon: Rocket,
    href: "/games/tank",
    color: "bg-blue-500",
  },
  {
    title: "Sword Master",
    description: "Test your reflexes in this fast-paced arena combat game.",
    icon: Swords,
    href: "/games/sword-master",
    color: "bg-emerald-500",
  },
  {
    title: "Ghost Hunter",
    description: "Navigate the haunted mansion and capture all the spirits.",
    icon: Ghost,
    href: "/games/ghost-hunter",
    color: "bg-purple-500",
  },
  {
    title: "Retro Arcade",
    description: "A collection of classic 8-bit inspired mini-challenges.",
    icon: Gamepad2,
    href: "/games/retro-arcade",
    color: "bg-orange-500",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 lg:px-12 lg:py-24">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl">
        <div className="mb-16 lg:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-6xl font-black uppercase tracking-tighter sm:text-7xl lg:text-8xl text-zinc-400">
              For <span className="text-zinc-200">U</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
              A game collection made for you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-8 h-px w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-transparent"
          />
        </div>

        {/* Game Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          {GAMES.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
            >
              <GameCard {...game} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto mt-24 max-w-7xl border-t border-zinc-900 pt-12 text-center text-zinc-600">
        <p className="text-sm font-medium uppercase tracking-widest">
          ForU – Made for you
        </p>
      </footer>
    </main>
  );
}
