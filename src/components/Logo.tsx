import Link from "next/link";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link
      href="/"
      aria-label="1ry-space home"
      className={`text-[2rem] font-semibold leading-none tracking-[-0.05em] ${tone === "light" ? "text-paper" : "text-ink"}`}
    >
      1ry-<span className="font-extrabold">space</span>
    </Link>
  );
}
