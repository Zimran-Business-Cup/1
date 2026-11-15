import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PROFESSIONS, getProfession } from "@/lib/catalog";
import { SessionClient } from "@/components/session/SessionClient";
import { isRoleOpen, roleName } from "@/lib/features";

// Every role is prerendered below and the session itself renders on the
// client, so the generic [slug] shell doesn't need instant-navigation checks.
export const instant = false;

export function generateStaticParams() {
  return PROFESSIONS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProfession(slug);
  return { title: p ? `${roleName(p)}: test-drive the role | 1ry-space` : "1ry-space" };
}

export default async function SessionPage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const profession = getProfession(slug);
  if (!profession) notFound();
  // Roles that aren't open yet show "Coming soon" in the catalog; a direct link goes home.
  if (!isRoleOpen(slug)) redirect("/");
  return <SessionClient slug={slug} />;
}
