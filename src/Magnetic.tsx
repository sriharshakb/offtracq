import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ComponentProps, PointerEvent as ReactPointerEvent } from "react";

// Wraps a link so it gently pulls toward the cursor when hovered, snapping
// back with a spring on leave. Only affects position, not layout. Disabled
// entirely under prefers-reduced-motion.
export function MagneticLink({ className, children, ...rest }: ComponentProps<typeof motion.a>) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 200, damping: 15, mass: 0.4 });

  const handleMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * 0.35);
    y.set((event.clientY - (rect.top + rect.height / 2)) * 0.35);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      className={className}
      style={{ x: springX, y: springY }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      {...rest}
    >
      {children}
    </motion.a>
  );
}
