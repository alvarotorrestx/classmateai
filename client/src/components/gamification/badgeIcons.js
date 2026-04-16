import { Flame, Sparkles, Trophy } from "lucide-react";

const ICONS_BY_SLUG = {
  trophy: Trophy,
  flame: Flame,
  sparkles: Sparkles,
};

export function getBadgeIconComponent(slug) {
  const key = String(slug || "").toLowerCase();
  return ICONS_BY_SLUG[key] || Trophy;
}

