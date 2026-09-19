export type CompanyRole = 'Owner' | 'Admin' | 'Office' | 'Technician' | 'Cleaner';
export type AssignableMemberRole = Exclude<CompanyRole, 'Owner'>;

const MANAGEMENT_ROLES = new Set<CompanyRole>(['Owner', 'Admin', 'Office']);
const OWNER_ADMIN_ASSIGNABLE: AssignableMemberRole[] = ['Admin', 'Office', 'Technician', 'Cleaner'];
const OFFICE_ASSIGNABLE: AssignableMemberRole[] = ['Office', 'Technician', 'Cleaner'];

export function canManageCompanyTeam(role?: string | null): boolean {
  return Boolean(role && MANAGEMENT_ROLES.has(role as CompanyRole));
}

export function getAssignableMemberRoles(actorRole?: string | null): AssignableMemberRole[] {
  if (actorRole === 'Owner' || actorRole === 'Admin') {
    return OWNER_ADMIN_ASSIGNABLE;
  }
  if (actorRole === 'Office') {
    return OFFICE_ASSIGNABLE;
  }
  return [];
}

export function toAssignableRoleEnum(actorRole?: string | null): [AssignableMemberRole, ...AssignableMemberRole[]] {
  const roles = getAssignableMemberRoles(actorRole);
  if (roles.length === 0) {
    return ['Office', 'Technician', 'Cleaner'];
  }
  return roles as [AssignableMemberRole, ...AssignableMemberRole[]];
}

export function getMemberRoleSelectOptions(actorRole?: string | null) {
  return getAssignableMemberRoles(actorRole).map((role) => ({
    key: role,
    name: role,
    value: role
  }));
}

export function canMutateCompanyMember(actorRole?: string | null, targetRole?: string | null): boolean {
  if (!actorRole || !targetRole || targetRole === 'Owner') {
    return false;
  }
  if (actorRole === 'Owner' || actorRole === 'Admin') {
    return true;
  }
  if (actorRole === 'Office') {
    return targetRole === 'Office' || targetRole === 'Technician' || targetRole === 'Cleaner';
  }
  return false;
}
