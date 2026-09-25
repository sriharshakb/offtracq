import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

type Stat = { label: string; value: number };

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -80px 0px" });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to, reduceMotion]);

  return <span ref={ref}>{reduceMotion ? to : value}</span>;
}

export function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="stats-band" aria-label="Offtracq by the numbers">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <strong>
            <CountUp to={stat.value} />
          </strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  );
}
