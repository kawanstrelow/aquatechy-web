import { routes } from '@/constants';
import { Menu } from '@/ts/interfaces/Others';

import { Pool } from '../ts/interfaces/Pool';

// função para colocar ponto antes dos dois últimos dígitos
// Ex.: 123 => 1.23
// Ex.: 123456 => 1234.56
export function insertDot(number: number) {
  const str = number.toString();
  const result = str.slice(0, -2) + '.' + str.slice(-2);
  return parseFloat(result);
}

export function calculateTotalMonthlyOfAllPools(pools: Pool[]) {
  const totalMonthlyPayment = pools.reduce((acc, pool) => {
    if (!pool.isActive) {
      return acc;
    }
    if (pool.monthlyPayment == null) {
      return acc;
    }
    const parsed = parseInt(pool.monthlyPayment.toString().replaceAll(/\D/g, ''), 10);
    if (Number.isNaN(parsed)) {
      return acc;
    }
    return acc + parsed;
  }, 0);
  return insertDot(totalMonthlyPayment);
}

export function calculateTotalAssignmentsOfAllPools(pools: Pool[]) {
  return pools.reduce((acc, pool) => acc + (pool.services?.length || 0), 0);
}

/** Pool label with optional body of water for assignment lists (e.g. "Josh … - Pool"). */
export function formatPoolNameWithBodyOfWater(pool: Pick<Pool, 'name' | 'bodyOfWater'>) {
  const label = pool.name?.trim() ?? '';
  const bow = pool.bodyOfWater?.trim() ?? '';
  if (label && bow) return `${label} - ${bow}`;
  return label || bow;
}

/** Pool street line with optional body of water for lists (e.g. "123 Main St - Spa"). */
export function formatPoolAddressWithBodyOfWater(pool: Pool) {
  const street = pool.address?.trim() ?? '';
  const bow = pool.bodyOfWater?.trim() ?? '';
  if (street && bow) return `${street} - ${bow}`;
  if (street) return street;
  if (bow) return bow;
  return pool.name?.trim() ?? '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmpty = (val: any) => val == null || !(Object.keys(val) || val).length;

export const onlyNumbers = (value: string | number) => {
  const parsed = parseInt(value.toString().replace(/\D/g, ''));
  if (isNaN(parsed)) return 0;
  return parsed;
};

export function findRouteByHref(href: string): Menu | undefined {
  for (const route of routes) {
    if (route.href === href) {
      return route;
    }

    if (route.submenu) {
      for (const key in route.submenu) {
        if (route.submenu[key].href === href) {
          return route.submenu[key] as Menu;
        }
      }
    }

    if (href.includes(route.href)) {
      return route;
    }
  }

  return undefined;
}

export function formatCamelCase(str: string) {
  // Insert a space before all uppercase letters (except the first one)
  let result = str.replace(/([A-Z])/g, ' $1');

  // Trim any leading space and capitalize the first letter of the entire string
  result = result.trim().replace(/^./, (char) => char.toUpperCase());

  return result;
}
