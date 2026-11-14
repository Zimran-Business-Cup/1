import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PROFESSIONS, getProfession } from "@/lib/catalog";
import { SessionClient } from "@/components/session/SessionClient";

// Every role is prerendered below and the session itself renders on the
// client, so the generic [slug] shell doesn't need instant-navigation checks.
export const instant = false;

export function generateStaticParams() {
  return PROFESSIONS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProfession(slug);
  return { title: p ? `${p.name}: test-drive the role | heforage` : "heforage" };
}

export default async function SessionPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const profession = getProfession(slug);
  if (!profession) notFound();
  return <SessionClient slug={slug} />;
}
