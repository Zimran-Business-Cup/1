import type { CSSProperties } from "react";

// White dot grid for colored panels, brightest in the middle and fading
// toward the edges, with a soft light glow behind the content.
// `subtle` dims the dots for panels with body text on top.

const glow: CSSProperties = {
  background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgb(255 255 255 / 0.16), transparent 70%)",
};

const mask = "radial-gradient(ellipse 90% 80% at 50% 40%, #000 45%, rgb(0 0 0 / 0.3) 100%)";

const dots = (alpha: number): CSSProperties => ({
  backgroundImage: `radial-gradient(circle, rgb(255 255 255 / ${alpha}) 2.6px, transparent 3.2px)`,
  backgroundSize: "42px 42px",
  backgroundPosition: "center 20px",
  maskImage: mask,
  WebkitMaskImage: mask,
});

export function DotGrid({ subtle = false }: { subtle?: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0" style={glow} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={dots(subtle ? 0.28 : 0.6)} />
    </>
  );
}
