import { translateMessage } from '@/i18n/runtime';

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

export const MEMBER_ROLE_DESCRIPTIONS: Record<AssignableMemberRole, string> = {
  get Admin() {
    return translateMessage(
      'shell.roleAdminDescription',
      'Same access as the owner, except they cannot delete the company.'
    );
  },
  get Office() {
    return translateMessage(
      'shell.roleOfficeDescription',
      'Can see all clients, routes, invoices, and estimates, add clients, and move routes.'
    );
  },
  get Technician() {
    return translateMessage(
      'shell.roleTechnicianDescription',
      'Sees only their own clients and routes. Can clean pools and do repairs.'
    );
  },
  get Cleaner() {
    return translateMessage('shell.roleCleanerDescription', 'Sees only their own clients and routes. Cleans pools.');
  }
};

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
