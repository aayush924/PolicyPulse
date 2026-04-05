import { useRef, useCallback } from "react";
import { motion, type Variants } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
  onClick?: () => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export function GlassCard({
  children,
  className = "",
  hover = true,
  delay = 0,
  onClick,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ref.current.style.setProperty("--glow-x", `${x}px`);
    ref.current.style.setProperty("--glow-y", `${y}px`);
  }, []);

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`glass-card relative overflow-hidden rounded-2xl ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="glass-card-glow" />
      {children}
    </motion.div>
  );
}
