"use client";

import { useEffect, useRef } from "react";

/** Each stroke is drawn in order, the way a person would sketch the house. */
const STROKES = [
  "M20 190H340", // ground
  "M70 190V100H290V190", // walls
  "M52 102L180 38L308 102", // roof
  "M165 190V138H195V190", // door
  "M92 122H140V158H92Z", // left window
  "M116 122V158",
  "M92 140H140",
  "M220 122H268V158H220Z", // right window
  "M244 122V158",
  "M220 140H268",
];

const START_DELAY_MS = 300;
const DRAW_SPEED = 0.6; // viewBox units per ms while the pencil is down
const TRAVEL_SPEED = 1.4; // viewBox units per ms while the pencil is lifted
const MIN_TRAVEL_MS = 120;
const LIFT = 8; // how far the pencil lifts between strokes
const ENTER_FROM = { x: 360, y: 230 };
const EXIT_TO = { x: 345, y: 70 };

type Point = { x: number; y: number };
type Step =
  | { kind: "draw"; stroke: number; start: number; end: number }
  | { kind: "travel"; from: Point; to: Point; start: number; end: number; exit?: boolean };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

/** Decorative line drawing of a house elevation. A pencil sketches it once on page load. */
export function HouseDrawing({ className }: { className?: string }) {
  const strokeRefs = useRef<(SVGPathElement | null)[]>([]);
  const pencilRef = useRef<SVGGElement>(null);
  const dimensionRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const paths = strokeRefs.current.filter((p): p is SVGPathElement => p !== null);
    const pencil = pencilRef.current;
    const dimension = dimensionRef.current;
    if (paths.length !== STROKES.length || !pencil || !dimension) return;

    const finish = () => {
      for (const p of paths) p.style.strokeDashoffset = "0";
      pencil.style.opacity = "0";
      dimension.style.opacity = "0.7";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    // Build the timeline: travel to each stroke's start with the pencil lifted, then draw it.
    const steps: Step[] = [];
    let t = START_DELAY_MS;
    let at: Point = ENTER_FROM;
    const travel = (to: Point, exit?: boolean) => {
      const end = t + Math.max(MIN_TRAVEL_MS, distance(at, to) / TRAVEL_SPEED);
      steps.push({ kind: "travel", from: at, to, start: t, end, exit });
      t = end;
      at = to;
    };
    paths.forEach((path, stroke) => {
      const length = path.getTotalLength();
      const startPoint = path.getPointAtLength(0);
      travel({ x: startPoint.x, y: startPoint.y });
      const end = t + length / DRAW_SPEED;
      steps.push({ kind: "draw", stroke, start: t, end });
      t = end;
      const endPoint = path.getPointAtLength(length);
      at = { x: endPoint.x, y: endPoint.y };
    });
    travel(EXIT_TO, true);
    const total = t;

    let frame = 0;
    const began = performance.now();

    const tick = (now: number) => {
      const elapsed = now - began;

      for (const step of steps) {
        if (step.kind !== "draw") continue;
        const p = clamp01((elapsed - step.start) / (step.end - step.start));
        paths[step.stroke].style.strokeDashoffset = String(1 - p);
      }

      const step = steps.find((s) => elapsed < s.end) ?? steps[steps.length - 1];
      const p = clamp01((elapsed - step.start) / (step.end - step.start));
      let tip: Point;
      let lift = 0;
      let opacity = 1;
      if (step.kind === "draw") {
        const path = paths[step.stroke];
        const point = path.getPointAtLength(p * path.getTotalLength());
        tip = { x: point.x, y: point.y };
      } else {
        const e = ease(p);
        tip = { x: step.from.x + (step.to.x - step.from.x) * e, y: step.from.y + (step.to.y - step.from.y) * e };
        lift = step.exit ? LIFT * e : LIFT * Math.sin(Math.PI * p);
        if (step.exit) opacity = 1 - p;
        if (step === steps[0]) opacity = p;
      }
      // A small wobble so the hand looks alive while drawing.
      const wobble = step.kind === "draw" ? Math.sin(elapsed / 70) * 2 : 0;
      pencil.setAttribute(
        "transform",
        `translate(${tip.x + lift * 0.6} ${tip.y - lift}) rotate(${-55 + wobble})`,
      );
      pencil.style.opacity = String(opacity);

      dimension.style.opacity = String(0.7 * clamp01((elapsed - total + 200) / 500));

      if (elapsed < total + 400) frame = requestAnimationFrame(tick);
      else finish();
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg
      viewBox="0 0 360 230"
      aria-hidden
      className={className}
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {STROKES.map((d, i) => (
        <path
          key={d}
          ref={(el) => {
            strokeRefs.current[i] = el;
          }}
          className="pencil-stroke"
          d={d}
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1}
        />
      ))}
      <path
        ref={dimensionRef}
        className="pencil-fade"
        d="M70 208H290 M70 201V215 M290 201V215"
        strokeDasharray="3 4"
        opacity={0}
        style={{ transition: "opacity 0.2s" }}
      />

      {/* The pencil. Drawn along +x with the graphite tip at the origin, then rotated. */}
      <g ref={pencilRef} className="pencil" opacity={0} strokeWidth="0.8" stroke="oklch(0.25 0.02 160)">
        <rect x="16" y="-5" width="48" height="10" fill="oklch(0.82 0.14 85)" />
        <path d="M16 0H64" opacity=".35" />
        <rect x="64" y="-5" width="7" height="10" fill="oklch(0.78 0.02 250)" />
        <rect x="71" y="-5" width="9" height="10" rx="2.5" fill="oklch(0.72 0.12 15)" />
        <path d="M0 0L16 -5V5Z" fill="oklch(0.88 0.05 75)" />
        <path d="M0 0L5 -1.6V1.6Z" fill="oklch(0.3 0.01 250)" />
      </g>
    </svg>
  );
}
