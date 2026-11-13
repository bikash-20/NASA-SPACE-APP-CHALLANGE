"use client";

import { useEffect, useRef } from "react";

interface ECGMonitorProps {
  heartRate: number;
  height?: number;
  className?: string;
  leadLabel?: string;
  isCompact?: boolean;
}

export function ECGMonitor({
  heartRate = 72,
  height = 150,
  className = "",
  leadLabel = "ECG - LEAD II (50 mm/s)",
  isCompact = false,
}: ECGMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let x = 0;
    const width = canvas.width;
    const h = canvas.height;
    const midY = h / 2;

    const drawGrid = () => {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, width, h);

      // Fine grid
      ctx.strokeStyle = "rgba(16, 185, 129, 0.1)";
      ctx.lineWidth = 1;
      const step = 20;
      for (let gx = 0; gx < width; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
    };

    drawGrid();

    // Waveform generator based on normalized phase 0..1
    const getEcgSample = (phase: number): number => {
      if (phase < 0.15) {
        return 0;
      } else if (phase >= 0.15 && phase < 0.25) {
        // P wave
        const p = (phase - 0.15) / 0.1;
        return Math.sin(p * Math.PI) * 0.2;
      } else if (phase >= 0.25 && phase < 0.32) {
        return 0;
      } else if (phase >= 0.32 && phase < 0.35) {
        // Q wave dip
        const q = (phase - 0.32) / 0.03;
        return -Math.sin(q * Math.PI) * 0.18;
      } else if (phase >= 0.35 && phase < 0.42) {
        // R wave peak
        const r = (phase - 0.35) / 0.07;
        return Math.sin(r * Math.PI) * 1.0;
      } else if (phase >= 0.42 && phase < 0.46) {
        // S wave dip
        const s = (phase - 0.42) / 0.04;
        return -Math.sin(s * Math.PI) * 0.32;
      } else if (phase >= 0.46 && phase < 0.56) {
        return 0;
      } else if (phase >= 0.56 && phase < 0.72) {
        // T wave
        const t = (phase - 0.56) / 0.16;
        return Math.sin(t * Math.PI) * 0.28;
      } else {
        return 0;
      }
    };

    let prevY = midY;
    let cycleTime = 0;

    const render = () => {
      const beatIntervalSec = 60 / Math.max(40, Math.min(180, heartRate));
      const stepWidth = 2.4;
      const pointsPerSecond = 60 * stepWidth;
      const cycleLengthInSteps = beatIntervalSec * pointsPerSecond;

      cycleTime = (cycleTime + stepWidth) % cycleLengthInSteps;
      const phase = cycleTime / cycleLengthInSteps;

      const sample = getEcgSample(phase);
      const targetY = midY - sample * (midY * 0.82);

      // Clear a sweep window
      const clearWidth = 16;
      ctx.fillStyle = "#020617";
      ctx.fillRect(x, 0, clearWidth, h);

      // Redraw fine grid in cleared region
      ctx.strokeStyle = "rgba(16, 185, 129, 0.1)";
      ctx.lineWidth = 1;
      const step = 20;
      const startG = Math.floor(x / step) * step;
      for (let gx = startG; gx <= x + clearWidth; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += step) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + clearWidth, gy);
        ctx.stroke();
      }

      // Draw glowing ECG trace
      const isElevated = heartRate > 105;
      ctx.shadowBlur = 12;
      ctx.shadowColor = isElevated ? "#f43f5e" : "#10b981";
      ctx.strokeStyle = isElevated ? "#fda4af" : "#34d399";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(Math.max(0, x - stepWidth), prevY);
      ctx.lineTo(x, targetY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      prevY = targetY;
      x = (x + stepWidth) % width;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [heartRate]);

  const isTachy = heartRate > 105;
  const isBrady = heartRate < 55;
  const rhythmName = isTachy
    ? "Sinus Tachycardia"
    : isBrady
    ? "Sinus Bradycardia"
    : "Normal Sinus Rhythm";

  return (
    <div
      className={`rounded-2xl border border-emerald-500/30 bg-slate-950 p-4 shadow-xl backdrop-blur-md ${className}`}
    >
      {/* Clean, Non-colliding Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-block h-3 w-3 animate-ping rounded-full bg-emerald-400 shrink-0" />
          <span className="font-mono text-sm font-bold tracking-wider text-emerald-400 truncate">
            {leadLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isCompact && (
            <span className="font-mono text-xs text-slate-300 font-medium">
              PR: <strong className="text-white">142ms</strong> · QRS: <strong className="text-white">86ms</strong> · QTc: <strong className="text-white">412ms</strong>
            </span>
          )}
          <span
            className={`rounded-md px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
              isTachy
                ? "bg-rose-950 text-rose-300 border border-rose-500/50 shadow-sm shadow-rose-950"
                : "bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950"
            }`}
          >
            ● {rhythmName}
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-800 bg-[#020617]">
        <canvas
          ref={canvasRef}
          width={800}
          height={height}
          className="w-full h-auto block"
        />
        {/* Subtle scanline overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent bg-[length:100%_4px]" />
      </div>
    </div>
  );
}
