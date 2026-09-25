import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// A compass-needle cursor for mouse users. The needle swings toward the
// direction of travel, the ring swells over links and buttons, and anything
// tagged data-cursor="watch" turns it into a labelled play reticle. Rendered
// only on fine pointers so touch devices keep their normal behaviour.
export function CompassCursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"idle" | "link" | "watch">("idle");
  const [hidden, setHidden] = useState(true);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.35 });
  const angle = useMotionValue(0);
  const sAngle = useSpring(angle, { stiffness: 120, damping: 14 });
  const last = useRef({ x: 0, y: 0, a: 0 });

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine) and (hover: hover)");
    const sync = () => setEnabled(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-compass-cursor");

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      setHidden(false);

      const dx = event.clientX - last.current.x;
      const dy = event.clientY - last.current.y;
      if (Math.hypot(dx, dy) > 6) {
        // Atan2 wraps at ±180°; keep the spring on the shortest path.
        let next = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        const delta = ((next - last.current.a + 540) % 360) - 180;
        next = last.current.a + delta;
        last.current = { x: event.clientX, y: event.clientY, a: next };
        angle.set(next);
      }

      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-cursor='watch']")) setMode("watch");
      else if (target?.closest("a, button, input, textarea, label")) setMode("link");
      else setMode("idle");
    };
    const onLeave = () => setHidden(true);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.documentElement.classList.remove("has-compass-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y, angle]);

  if (!enabled) return null;

  return (
    <motion.div
      className={`compass-cursor compass-cursor-${mode}${hidden ? " compass-cursor-hidden" : ""}`}
      style={{ x: sx, y: sy }}
      aria-hidden="true"
    >
      <div className="compass-cursor-ring" />
      <motion.svg className="compass-cursor-needle" viewBox="-12 -12 24 24" style={{ rotate: sAngle }}>
        <path d="M0 -9 L3.2 2 L0 0.2 L-3.2 2 Z" fill="var(--accent)" />
        <path d="M0 9 L2 3 L0 4.2 L-2 3 Z" fill="rgba(255,255,255,0.55)" />
      </motion.svg>
      <span className="compass-cursor-label">WATCH</span>
    </motion.div>
  );
}
