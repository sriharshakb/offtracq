import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";

// Start at Denver (home base, 5,280 ft) and "climb" to the top of Mt Elbert,
// Colorado's highest peak (14,440 ft), as you scroll down the page.
const START_FT = 5280;
const SUMMIT_FT = 14440;
const TICKS = 21;

export function Altimeter() {
  const { scrollYProgress } = useScroll();
  const [feet, setFeet] = useState(START_FT);
  const [visible, setVisible] = useState(false);

  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    setFeet(Math.round(START_FT + progress * (SUMMIT_FT - START_FT)));
  });

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside className={`altimeter${visible ? " altimeter-visible" : ""}`} aria-hidden="true">
      <span className="altimeter-label">ELEV</span>
      <div className="altimeter-rail">
        <div className="altimeter-ticks">
          {Array.from({ length: TICKS }).map((_, index) => (
            <span key={index} className={index % 5 === 0 ? "altimeter-tick-major" : ""} />
          ))}
        </div>
        <motion.div className="altimeter-fill" style={{ scaleY: fill }} />
      </div>
      <span className="altimeter-value">{feet.toLocaleString("en-US")} FT</span>
    </aside>
  );
}
