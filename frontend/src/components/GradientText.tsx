import { motion } from "framer-motion";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function GradientText({ children, className = "", delay = 0 }: GradientTextProps) {
  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-blue-400 animate-[gradient-shift_6s_ease_infinite] bg-[length:200%_200%] ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}
