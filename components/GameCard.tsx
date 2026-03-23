"use client";

import { motion } from "motion/react";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface GameCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export default function GameCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative h-full"
    >
      <Link href={href} className="block h-full">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900 h-full">
          {/* Background Glow */}
          <div
            className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-0 blur-3xl transition-opacity group-hover:opacity-20 ${color}`}
          />

          <div className="relative z-10">
            <div
              className={`mb-4 inline-flex rounded-xl p-3 bg-zinc-800/50 text-zinc-100 group-hover:scale-110 transition-transform`}
            >
              <Icon size={24} />
            </div>

            <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-zinc-100">
              {title}
            </h3>

            <p className="text-sm leading-relaxed text-zinc-400">
              {description}
            </p>
          </div>

          <div className="mt-6 flex items-center text-xs font-semibold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
            Play Now
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              className="ml-2"
            >
              →
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
