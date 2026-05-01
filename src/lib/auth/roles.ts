export const userRoles = ["USER", "ADMIN", "SUPPORT"] as const;

export type UserRole = (typeof userRoles)[number];

