import { CompanyWithMyRole } from '@/ts/interfaces/Company';

const MANAGEMENT_ROLES = new Set(['Owner', 'Admin', 'Office']);

export function isManagementRole(role?: string | null): boolean {
  return Boolean(role && MANAGEMENT_ROLES.has(role));
}

export function getManagementCompanies(companies: CompanyWithMyRole[]): CompanyWithMyRole[] {
  return companies.filter((company) => isManagementRole(company.role));
}

export function canAccessAiChat(companies: CompanyWithMyRole[]): boolean {
  return getManagementCompanies(companies).length > 0;
}
