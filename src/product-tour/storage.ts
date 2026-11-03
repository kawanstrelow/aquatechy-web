export type ProductTourStatus = 'active' | 'dismissed' | 'completed';

export type ProductTourState = {
  status: ProductTourStatus;
  step: number;
};

export const PRODUCT_TOUR_START_EVENT = 'aquatechy-product-tour-start';

const STORAGE_PREFIX = 'aquatechy-product-tour-';

export function productTourStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readTourState(userId: string): ProductTourState | null {
  if (typeof window === 'undefined' || !userId) return null;

  try {
    const raw = localStorage.getItem(productTourStorageKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ProductTourState>;
    if (parsed.status !== 'active' && parsed.status !== 'dismissed' && parsed.status !== 'completed') {
      return null;
    }

    const step = typeof parsed.step === 'number' && parsed.step >= 0 ? parsed.step : 0;
    return { status: parsed.status, step };
  } catch {
    return null;
  }
}

export function writeTourState(userId: string, state: ProductTourState) {
  if (typeof window === 'undefined' || !userId) return;
  localStorage.setItem(productTourStorageKey(userId), JSON.stringify(state));
}

export function markProductTourActive(userId: string) {
  writeTourState(userId, { status: 'active', step: 0 });
}

export function replayProductTour(userId: string) {
  writeTourState(userId, { status: 'active', step: 0 });
  window.dispatchEvent(new Event(PRODUCT_TOUR_START_EVENT));
}
