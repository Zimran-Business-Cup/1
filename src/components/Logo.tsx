import Link from "next/link";

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <Link
      href="/"
      aria-label="heforage home"
      className={`text-[2rem] font-semibold leading-none tracking-[-0.05em] ${tone === "light" ? "text-paper" : "text-ink"}`}
    >
      he<span className="font-extrabold">forage</span>
    </Link>
  );
}
