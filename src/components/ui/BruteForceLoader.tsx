"use client";

import { motion } from "framer-motion";

interface BruteForceLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BruteForceLoader({
  size = "md",
  className = "",
}: BruteForceLoaderProps) {
  const sizeClasses = {
    sm: {
      dots: "w-2 h-2",
      container: "h-16 w-16",
    },
    md: {
      dots: "w-3 h-3",
      container: "h-24 w-24",
    },
    lg: {
      dots: "w-4 h-4",
      container: "h-40 w-40",
    },
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft Glow */}
      {/* <motion.div
        className={`${sizeClasses[size].container} absolute rounded-full bg-[#CCFF00]/10 blur-3xl`}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
        }}
      /> */}

      {/* Dots Animation */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`${sizeClasses[size].dots} rounded-full bg-[#CCFF00]`}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}