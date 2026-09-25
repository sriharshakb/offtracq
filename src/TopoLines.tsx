import { useMemo, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

// Wobbly closed contours like a topographic map, generated once from a seed
// and drawn in as the surrounding section scrolls through the viewport.
function contourPath(rings: number, ring: number, seed: number) {
  const points: string[] = [];
  const steps = 72;
  const base = 40 + ring * (300 / rings);
  for (let i = 0; i <= steps; i += 1) {
    const t = (i / steps) * Math.PI * 2;
    const wobble =
      1 +
      0.12 * Math.sin(3 * t + seed + ring * 0.15) +
      0.07 * Math.sin(5 * t - seed * 1.7) +
      0.04 * Math.sin(9 * t + seed * 2.3 + ring * 0.3);
    const r = base * wobble;
    const px = 400 + Math.cos(t) * r * 1.35;
    const py = 300 + Math.sin(t) * r;
    points.push(`${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  return `${points.join(" ")} Z`;
}

export function TopoLines({ seed = 1, className = "" }: { seed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "end 30%"] });
  const draw = useTransform(scrollYProgress, [0, 0.7], [0, 1]);

  const rings = 16;
  const paths = useMemo(
    () => Array.from({ length: rings }, (_, ring) => contourPath(rings, ring, seed)),
    [seed]
  );

  return (
    <div ref={ref} className={`topo-lines ${className}`} aria-hidden="true">
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      {paths.map((d, index) => (
        <motion.path
          key={index}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={index % 4 === 0 ? 1.4 : 0.8}
          style={{ pathLength: reduceMotion ? 1 : draw }}
        />
      ))}
    </svg>
    </div>
  );
}
