import type { UserRole } from "@prisma/client";

export function getDefaultRouteByRole(role: UserRole): string {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "SUPPORT") {
    return "/support";
  }

  return "/dashboard";
}

export function hasRouteAccess(role: UserRole, section: "dashboard" | "admin" | "support"): boolean {
  if (section === "dashboard") {
    return true;
  }

  if (section === "admin") {
    return role === "ADMIN";
  }

  return role === "SUPPORT" || role === "ADMIN";
}
