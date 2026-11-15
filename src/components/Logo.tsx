import { House } from "lucide-react";
import Link from "next/link";

const Wordmark = () => (
  <>
    1ry-<span className="font-extrabold">space</span>
  </>
);

/**
 * The wordmark, linking home. Inside a session (`home`) it reads as a button:
 * a house badge, a hover state and a "Back to home" tooltip.
 */
export function Logo({ tone = "light", home = false }: { tone?: "light" | "dark"; home?: boolean }) {
  const color = tone === "light" ? "text-paper" : "text-ink";

  if (home) {
    return (
      <Link
        href="/"
        title="Back to home"
        aria-label="1ry-space: back to home"
        className={`group -mx-2 flex shrink-0 items-center gap-3 self-start rounded-2xl px-2 py-1.5 transition hover:bg-paper/15 ${color}`}
      >
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-paper/20 transition group-hover:bg-paper group-hover:text-hero">
          <House size={20} strokeWidth={2.2} />
        </span>
        <span className="whitespace-nowrap text-[1.75rem] font-semibold leading-none tracking-[-0.05em]">
          <Wordmark />
        </span>
      </Link>
    );
  }

  return (
    <Link href="/" aria-label="1ry-space home" className={`shrink-0 whitespace-nowrap text-[2rem] font-semibold leading-none tracking-[-0.05em] ${color}`}>
      <Wordmark />
    </Link>
  );
}
