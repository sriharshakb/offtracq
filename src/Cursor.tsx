import { useEffect, useRef } from "react";

// A small custom cursor (dot + lagging ring) used on fine-pointer devices
// only. Left alone on touch/coarse pointers via the pointer:coarse check
// below, so nothing changes on mobile.
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let ringX = window.innerWidth / 2;
    let ringY = window.innerHeight / 2;
    let targetX = ringX;
    let targetY = ringY;
    let raf = 0;

    const place = (el: HTMLDivElement | null, x: number, y: number) => {
      if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      place(dotRef.current, targetX, targetY);
    };

    const handleOver = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const interactive = target?.closest("a, button, .journey-pin");
      document.body.classList.toggle("cursor-active", Boolean(interactive));
    };

    const tick = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      place(ringRef.current, ringX, ringY);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerover", handleOver);
    raf = requestAnimationFrame(tick);
    document.body.classList.add("cursor-enabled");

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerover", handleOver);
      cancelAnimationFrame(raf);
      document.body.classList.remove("cursor-enabled", "cursor-active");
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
