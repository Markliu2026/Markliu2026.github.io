"use client";

import { useEffect, useRef } from "react";

// 轻量粒子场 + 连线，营造数字孪生科技感背景。
export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const cv: HTMLCanvasElement = ref.current;
    const context = cv.getContext("2d");
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let raf = 0;
    let w = 0;
    let h = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];

    function resize() {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * DPR;
      cv.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.min(90, Math.floor((w * h) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
      }));
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      // 连线
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i];
          const b = pts[j];
          const d2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
          if (d2 < 130 * 130) {
            const alpha = (1 - d2 / (130 * 130)) * 0.5;
            ctx.strokeStyle = `rgba(70,150,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      // 粒子
      for (const p of pts) {
        ctx.fillStyle = "rgba(120,200,255,0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    frame();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
