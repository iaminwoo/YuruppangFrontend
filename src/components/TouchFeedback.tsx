"use client";

import { useEffect } from "react";

export default function TouchFeedback() {
  useEffect(() => {
    const spawnRipple = (x: number, y: number) => {
      const ripple = document.createElement("div");
      ripple.className =
        "fixed w-8 h-8 border border-amber-500/80 bg-transparent rounded-full pointer-events-none z-[9999]";

      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.animation = "ripple 0.7s ease-out";

      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    const handleTouch = (e: TouchEvent) => {
      const touch = e.touches[0];
      spawnRipple(touch.clientX, touch.clientY);
    };

    window.addEventListener("touchstart", handleTouch);
    return () => window.removeEventListener("touchstart", handleTouch);
  }, []);

  return null;
}
