export const ROLES = {
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
  VIEWER: "VIEWER",
};

export function hasRole(userRole, requiredRole) {
  const hierarchy = {
    SUPERADMIN: 4,
    ADMIN: 3,
    EDITOR: 2,
    VIEWER: 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}
