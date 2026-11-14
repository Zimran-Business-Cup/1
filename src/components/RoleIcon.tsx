import {
  Briefcase,
  CalendarCheck,
  ChartColumn,
  Code,
  Handshake,
  Megaphone,
  MonitorSmartphone,
  Palette,
  PenLine,
  PenTool,
  Rocket,
  Server,
  type LucideIcon,
} from "lucide-react";
import type { DirectionId } from "@/lib/catalog";

const ROLE_ICONS: Record<string, LucideIcon> = {
  "backend-engineer": Server,
  "frontend-developer": MonitorSmartphone,
  "data-analyst": ChartColumn,
  "product-designer": PenTool,
  "marketing-specialist": Megaphone,
  "graphic-designer": Palette,
  "business-development-manager": Handshake,
  "product-manager": Rocket,
  "project-manager": CalendarCheck,
};

const DIRECTION_ICONS: Record<DirectionId, LucideIcon> = {
  programming: Code,
  design: PenLine,
  management: Briefcase,
};

type Tone = "light" | "dark";

/** A line icon in a round badge: brand-tinted on light surfaces, translucent white on dark. */
function Badge({ Icon, size, tone, className = "" }: { Icon: LucideIcon; size: number; tone: Tone; className?: string }) {
  return (
    <span
      aria-hidden
      className={`icon-badge icon-badge--${tone} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.48)} strokeWidth={1.9} />
    </span>
  );
}

export function RoleIcon({ slug, size = 44, tone = "light", className }: { slug: string; size?: number; tone?: Tone; className?: string }) {
  return <Badge Icon={ROLE_ICONS[slug] ?? Code} size={size} tone={tone} className={className} />;
}

export function DirectionIcon({ id, size = 44, className }: { id: DirectionId; size?: number; className?: string }) {
  return <Badge Icon={DIRECTION_ICONS[id]} size={size} tone="light" className={className} />;
}
