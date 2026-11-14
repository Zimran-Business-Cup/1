"use client";

import dynamic from "next/dynamic";
import { getProfession } from "@/lib/catalog";

// Sessions live in the browser's storage, so the session view renders on the
// client only. Keyed by slug so switching roles mounts a fresh view.
const SessionView = dynamic(() => import("./SessionView").then((m) => m.SessionView), {
  ssr: false,
  loading: () => <div className="h-dvh bg-hero" />,
});

export function SessionClient({ slug }: { slug: string }) {
  const profession = getProfession(slug)!;
  return <SessionView key={slug} profession={profession} />;
}
