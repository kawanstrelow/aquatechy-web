import { CompanyWithMyRole } from '@/ts/interfaces/Company';

export function managedCompanies(companies: CompanyWithMyRole[]) {
  return companies.filter(
    (company) => company.role === 'Owner' || company.role === 'Admin' || company.role === 'Office'
  );
}
