import { useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [visible, setVisible] = useState(false);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 28 });

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!visible) setVisible(true);
    },
    [cursorX, cursorY, visible],
  );

  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", () => setClicked(true));
    window.addEventListener("mouseup", () => setClicked(false));
    window.addEventListener("mouseleave", () => setVisible(false));
    window.addEventListener("mouseenter", () => setVisible(true));

    const observer = new MutationObserver(() => {
      updateHoverState();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    function updateHoverState() {
      // We'll rely on CSS hover events instead
    }

    function handleMouseOver(e: Event) {
      const target = e.target as HTMLElement;
      if (!target) return;
      const interactive = target.closest(
        "a, button, [role='button'], input, textarea, select, [data-cursor-hover]",
      );
      setHovered(!!interactive);
    }

    function handleMouseOut(e: MouseEvent) {
      const target = e.relatedTarget as HTMLElement | null;
      if (!target) {
        setHovered(false);
        return;
      }
      const interactive = target.closest(
        "a, button, [role='button'], input, textarea, select, [data-cursor-hover]",
      );
      setHovered(!!interactive);
    }

    document.addEventListener("mouseover", handleMouseOver as EventListener);
    document.addEventListener("mouseout", handleMouseOut as EventListener);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", handleMouseOver as EventListener);
      document.removeEventListener("mouseout", handleMouseOut as EventListener);
      observer.disconnect();
    };
  }, [onMouseMove]);

  if (!visible) return null;

  return (
    <>
      {/* Main dot */}
      <motion.div
        className="fixed top-0 left-0 z-[9999] pointer-events-none mix-blend-difference"
        style={{ x: springX, y: springY }}
      >
        <motion.div
          className="rounded-full -translate-x-1/2 -translate-y-1/2"
          animate={{
            width: hovered ? 48 : clicked ? 6 : 10,
            height: hovered ? 48 : clicked ? 6 : 10,
            backgroundColor: hovered ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.9)",
            borderWidth: hovered ? 1 : 0,
            borderColor: "rgba(59, 130, 246, 0.5)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          style={{ borderStyle: "solid" }}
        />
      </motion.div>

      {/* Trailing ring */}
      <motion.div
        className="fixed top-0 left-0 z-[9998] pointer-events-none"
        style={{ x: springX, y: springY }}
      >
        <motion.div
          className="rounded-full -translate-x-1/2 -translate-y-1/2 border border-white/20"
          animate={{
            width: hovered ? 64 : 32,
            height: hovered ? 64 : 32,
            opacity: hovered ? 0.6 : 0.3,
            borderColor: hovered ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.15)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      </motion.div>
    </>
  );
}
