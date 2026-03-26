/* eslint-disable @next/next/no-img-element */
"use client";

import GameCard from "@/components/GameCard";
import {
  Crosshair,
  Dices,
  Rocket,
  Route,
  Shield,
  Earth
} from "lucide-react";
import { motion } from "motion/react";

const GAMES = [
  {
    title: "Chill CIWS",
    description: "Watch CIWS firing for forever.",
    icon: Crosshair,
    href: "https://ciws.fowel.online",
    color: "bg-red-500",
  },
  {
    title: "Pathfinder",
    description: "Maze solver simulation.",
    icon: Route,
    href: "/games/pathfinder",
    color: "bg-yellow-500",
  },
  {
    title: "Tank",
    description: "Tank Trouble Remastered.",
    icon: Rocket,
    href: "/games/tank",
    color: "bg-blue-500",
  },
  {
    title: "Dice Roller",
    description: "Roll the dice and see your fate.",
    icon: Dices,
    href: "/games/dice",
    color: "bg-emerald-500",
  },
  {
    title: "Defender",
    description: "Defend your base from incoming storm.",
    icon: Shield,
    href: "/games/defender",
    color: "bg-purple-500",
  },
  {
    title: "Ascension: Earth 3618",
    description: "An escape from the ruined Earth.",
    icon: Earth,
    href: "/games/ascension",
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
      <footer className="mx-auto mt-24 max-w-7xl border-t border-zinc-900 pt-16 pb-24 text-center">
        <div className="flex flex-col items-center gap-20">
          {/* GitHub Style Shield */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex items-center overflow-hidden rounded-sm text-sm font-bold leading-none tracking-tight shadow-xl bg-zinc-900"
          >
            <span className="px-3 py-2.5 text-zinc-300 uppercase">AI CODE</span>
            <span className="bg-[#eeeeee] px-3 py-1.5 text-zinc-900 rounded-sm">100%</span>
          </motion.div>

          {/* Avatars */}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 w-full px-4 max-w-6xl">
            {[1, 2, 3, 4].map((i) => {
              const usernames = ["ForeverWeLearn", "sainoman15", "KhuongDinh11", "hoangminhnhat2311-debug"];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="flex flex-col items-center gap-4 group"
                >
                  <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-zinc-900 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-zinc-700 bg-zinc-950">
                    <img
                      src={`/avatars/avatar${i}.png`}
                      alt={`Avatar ${i}`}
                      className="h-full w-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <a 
                      href={`https://github.com/${usernames[i-1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-lg font-medium text-zinc-500 hover:text-white transition-colors underline-offset-4 hover:underline"
                    >
                      @{usernames[i-1]}
                    </a>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quote & Credit */}
          <div className="space-y-24">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="font-display text-xl italic text-zinc-500 sm:text-2xl"
            >
              &ldquo;We have no talent and we must create.&rdquo;
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
              className="text-sm font-medium tracking-wide text-zinc-600"
            >
              Made with 💖 by{" "}
              <a 
                href="https://github.com/TheHand-FPT" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-zinc-400 transition-colors hover:text-zinc-200 decoration-zinc-700 underline-offset-4 hover:underline"
              >
                TheHand-FPT
              </a>
            </motion.div>
          </div>
        </div>
      </footer>
    </main>
  );
}
