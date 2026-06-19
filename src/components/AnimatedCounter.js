// src/components/AnimatedCounter.js
"use client";
import { useEffect, useState, useRef } from "react";

export default function AnimatedCounter({ value = 0, duration = 1500 }) {
  const [count, setCount] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(from + (to - from) * progress);
      setCount(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
      {Intl.NumberFormat().format(count)}
    </div>
  );
}
