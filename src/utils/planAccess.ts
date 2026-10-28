import { UserSubscription } from '@/ts/enums/enums';

const PLAN_RANK: Record<UserSubscription, number> = {
  [UserSubscription.FREE]: 0,
  [UserSubscription.ROUTE]: 1,
  [UserSubscription.GROW]: 2,
  [UserSubscription.PRO]: 2
};

const POOL_LIMIT_BY_PLAN: Record<UserSubscription, number> = {
  [UserSubscription.FREE]: 20,
  [UserSubscription.ROUTE]: 75,
  [UserSubscription.GROW]: Number.POSITIVE_INFINITY,
  [UserSubscription.PRO]: Number.POSITIVE_INFINITY
};

const ROUTE_PREFIXES = ['/routes/route-finder', '/settings/payments', '/invoices', '/work-orders'];
const GROW_PREFIXES = ['/chat', '/reports'];
const POOL_CREATE_PREFIXES = [
  '/clients/new',
  '/clients/add-pool',
  '/clients/import-from-file',
  '/clients/import-skimmer',
  '/clients/import-quickbooks'
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function planRank(plan: UserSubscription | undefined | null) {
  if (!plan || !(plan in PLAN_RANK)) return 0;
  return PLAN_RANK[plan];
}

export function hasPlanAccess(current: UserSubscription | undefined | null, required: UserSubscription) {
  return planRank(current) >= planRank(required);
}

export function isPlanUpgrade(current: UserSubscription | undefined | null, target: UserSubscription) {
  return planRank(target) > planRank(current);
}

export function isAtPoolLimit(plan: UserSubscription | undefined | null, poolsCount: number | undefined | null) {
  if (!plan || poolsCount == null || !(plan in POOL_LIMIT_BY_PLAN)) return false;
  const limit = POOL_LIMIT_BY_PLAN[plan];
  if (!Number.isFinite(limit)) return false;
  return poolsCount >= limit;
}

export function requiredPlanForPath(pathname: string): UserSubscription | null {
  if (GROW_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return UserSubscription.GROW;
  if (ROUTE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) return UserSubscription.ROUTE;
  return null;
}

export function isPoolCreatePath(pathname: string) {
  return POOL_CREATE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function planDisplayName(plan: UserSubscription) {
  if (plan === UserSubscription.GROW) return 'Grow';
  if (plan === UserSubscription.PRO) return 'Pro';
  if (plan === UserSubscription.ROUTE) return 'Route';
  return 'Starter';
}
