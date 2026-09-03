import { ClipboardList, ShieldCheck, UserRound } from "lucide-react";

export const navItems = [
  { href: "/", labelKey: "nav.profile", icon: UserRound },
  { href: "/my-registration", labelKey: "nav.myRegistration", icon: ClipboardList },
  { href: "/organizer", icon: ShieldCheck, labelKey: "nav.organizer", permission: "registration::review" }
] as const;
