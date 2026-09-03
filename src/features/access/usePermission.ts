import { useCurrentUser } from "../profile/useCurrentUser";

export function useHasPermission(permission: string): boolean {
  const me = useCurrentUser();
  return me.data?.data?.permissions?.includes(permission) ?? false;
}

export function useHasRole(role: string): boolean {
  const me = useCurrentUser();
  return me.data?.data?.roles?.includes(role) ?? false;
}
