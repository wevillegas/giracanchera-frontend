// Roles: 'user' < 'admin' < 'superadmin'. El superadmin tiene todo lo del admin, más poder sobre otros admins.
export const isAdminRole = (rol) => rol === 'admin' || rol === 'superadmin';
export const isSuperAdmin = (rol) => rol === 'superadmin';
