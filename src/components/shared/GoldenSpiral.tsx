"use client";

import { useEffect, useRef } from "react";

interface GoldenSpiralProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  animate?: boolean;
  interactive?: boolean;
}

export default function GoldenSpiral({
  size = 500,
  color = "rgba(196, 164, 74, 0.3)",
  strokeWidth = 1.5,
  className = "",
  animate = true,
  interactive = false,
}: GoldenSpiralProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const phi = 1.618033988749895;

  // Generate golden spiral path using quarter arcs
  const generateSpiralPath = () => {
    const points: string[] = [];
    let x = size;
    let y = size;
    let w = size;
    let direction = 0; // 0=right, 1=down, 2=left, 3=up

    for (let i = 0; i < 12; i++) {
      const nextW = w / phi;
      const r = w - nextW;

      let cx: number, cy: number, sx: number, sy: number, ex: number, ey: number;
      let sweep: number;

      switch (direction % 4) {
        case 0: // arc going down-right
          cx = x; cy = y;
          sx = x; sy = y - r;
          ex = x + r; ey = y;
          sweep = 1;
          x = x; y = y;
          break;
        case 1: // arc going down-left
          cx = x; cy = y;
          sx = x + r; sy = y;
          ex = x; ey = y + r;
          sweep = 1;
          break;
        case 2: // arc going up-left
          cx = x; cy = y;
          sx = x; sy = y + r;
          ex = x - r; ey = y;
          sweep = 1;
          break;
        case 3: // arc going up-right
          cx = x; cy = y;
          sx = x - r; sy = y;
          ex = x; ey = y - r;
          sweep = 1;
          break;
        default:
          cx = x; cy = y; sx = x; sy = y; ex = x; ey = y; sweep = 1;
      }

      if (i === 0) {
        points.push(`M ${sx} ${sy}`);
      }
      points.push(`A ${r} ${r} 0 0 ${sweep} ${ex} ${ey}`);

      // Move origin for next iteration
      switch (direction % 4) {
        case 0: w = nextW; direction++; break;
        case 1: w = nextW; direction++; break;
        case 2: w = nextW; direction++; break;
        case 3: w = nextW; direction++; break;
      }
    }

    return points.join(" ");
  };

  // Simple Fibonacci golden spiral using parametric equations
  const generateParametricSpiral = () => {
    const centerX = size / 2;
    const centerY = size / 2;
    const maxR = size * 0.45;
    const points: string[] = [];
    const steps = 300;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 4 * Math.PI; // 2 full turns
      const r = maxR * Math.pow(phi, (t * 2) / Math.PI - 4);
      const x = centerX + r * Math.cos(t);
      const y = centerY + r * Math.sin(t);

      if (i === 0) {
        points.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
      } else {
        points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
      }
    }

    return points.join(" ");
  };

  // Generate golden rectangles for visual overlay
  const generateRectangles = () => {
    const rects: { x: number; y: number; w: number; h: number }[] = [];
    let w = size * 0.8;
    let h = w / phi;
    let x = size * 0.1;
    let y = (size - h) / 2;

    for (let i = 0; i < 8; i++) {
      rects.push({ x, y, w, h });
      const newW = w - h;

      switch (i % 4) {
        case 0: x = x + h; w = newW; break;
        case 1: y = y + w; h = h - w; break;
        case 2: w = w - h; break;
        case 3: h = h - w; break;
      }
    }

    return rects;
  };

  useEffect(() => {
    if (!interactive || !svgRef.current) return;

    const svg = svgRef.current;
    const handleMove = (e: MouseEvent) => {
      const rect = svg.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;
      svg.style.transform = `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg)`;
    };

    const handleLeave = () => {
      svg.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    };

    svg.addEventListener("mousemove", handleMove);
    svg.addEventListener("mouseleave", handleLeave);

    return () => {
      svg.removeEventListener("mousemove", handleMove);
      svg.removeEventListener("mouseleave", handleLeave);
    };
  }, [interactive]);

  const spiralPath = generateParametricSpiral();
  const rects = generateRectangles();

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      className={`transition-transform duration-300 ease-out ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Golden rectangles */}
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          stroke={color}
          strokeWidth={strokeWidth * 0.5}
          opacity={0.15 + (i * 0.05)}
          rx={2}
        />
      ))}

      {/* Spiral */}
      <path
        d={spiralPath}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        fill="none"
        className={animate ? "golden-spiral-draw" : ""}
        style={animate ? {
          strokeDasharray: 2000,
          strokeDashoffset: 2000,
          animation: "drawSpiral 3s ease-out forwards",
        } : {}}
      />

      {/* Center golden circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.02}
        fill={color}
        opacity={0.6}
      />
    </svg>
  );
}
