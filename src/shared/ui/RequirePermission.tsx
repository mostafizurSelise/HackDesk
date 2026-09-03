import type { ReactNode } from "react";
import { useHasPermission } from "../../features/access/usePermission";

export function RequirePermission({ permission, children }: { permission: string; children: ReactNode }) {
  if (!useHasPermission(permission)) return null;
  return <>{children}</>;
}
