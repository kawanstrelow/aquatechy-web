export type ProductTourStepId =
  | 'welcome'
  | 'addTechnician'
  | 'schedule'
  | 'routeFinder'
  | 'requests'
  | 'invoices'
  | 'recurring'
  | 'done';

export type ProductTourStep = {
  id: ProductTourStepId;
  selector?: string;
  match: (pathname: string) => boolean;
  href: (companyId?: string) => string | null;
  requiresCompany?: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
};

const ADD_MEMBER_PATH = /^\/settings\/companies\/team\/[^/]+\/add-member$/;

export const PRODUCT_TOUR_STEPS: ProductTourStep[] = [
  {
    id: 'welcome',
    match: (pathname) => pathname === '/dashboard',
    href: () => '/dashboard'
  },
  {
    id: 'addTechnician',
    selector: '[data-tour="add-member"]',
    requiresCompany: true,
    match: (pathname) => ADD_MEMBER_PATH.test(pathname),
    href: (companyId) => (companyId ? `/settings/companies/team/${companyId}/add-member` : null),
    side: 'top',
    align: 'start'
  },
  {
    id: 'schedule',
    selector: '[data-tour="schedule"]',
    match: (pathname) => pathname === '/routes/schedule',
    href: () => '/routes/schedule',
    side: 'top',
    align: 'start'
  },
  {
    id: 'routeFinder',
    selector: '[data-tour="route-finder"]',
    match: (pathname) => pathname === '/routes/route-finder',
    href: () => '/routes/route-finder',
    side: 'top',
    align: 'start'
  },
  {
    id: 'requests',
    selector: '[data-tour="requests"]',
    match: (pathname) => pathname === '/requests',
    href: () => '/requests',
    side: 'top',
    align: 'start'
  },
  {
    id: 'invoices',
    selector: '[data-tour="create-invoice"]',
    match: (pathname) => pathname === '/invoices',
    href: () => '/invoices',
    side: 'bottom',
    align: 'start'
  },
  {
    id: 'recurring',
    selector: '[data-tour="create-recurring-invoice"]',
    match: (pathname) => pathname === '/invoices/recurring',
    href: () => '/invoices/recurring',
    side: 'bottom',
    align: 'start'
  },
  {
    id: 'done',
    match: () => true,
    href: () => null
  }
];

export function ownerCompanyId(companies: { id: string; role?: string | null }[]) {
  return (
    companies.find((company) => company.role === 'Owner')?.id ??
    companies.find((company) => company.role === 'Admin')?.id
  );
}

export function isProductTourAudience(companies: { role?: string | null }[]) {
  return companies.some((company) => company.role === 'Owner' || company.role === 'Admin');
}
