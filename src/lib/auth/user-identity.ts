type UserIdentity = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export function getUserDisplayName(user: UserIdentity) {
  return user.name || user.email || user.phone || "حساب کاربری";
}

export function getUserIdentifier(user: UserIdentity) {
  return user.email || user.phone || "بدون شناسه";
}
