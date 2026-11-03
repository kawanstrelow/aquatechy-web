'use client';

import { driver, type Driver, type DriveStep } from 'driver.js';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { ownerCompanyId, PRODUCT_TOUR_STEPS, type ProductTourStep } from '@/product-tour/steps';
import { PRODUCT_TOUR_START_EVENT, readTourState, writeTourState } from '@/product-tour/storage';

import 'driver.js/dist/driver.css';
import './product-tour.css';

const ELEMENT_WAIT_MS = 8000;

type Translator = (key: string, values?: Record<string, string | number>) => string;

type TourContext = {
  userId?: string;
  companyId?: string;
  router: ReturnType<typeof useRouter>;
  t: Translator;
};

function stepCopy(t: Translator, step: ProductTourStep) {
  return {
    title: t(`${step.id}Title`),
    description: t(`${step.id}Description`)
  };
}

function buildSteps(t: Translator): DriveStep[] {
  return PRODUCT_TOUR_STEPS.map((step) => {
    const copy = stepCopy(t, step);
    return {
      element: step.selector,
      disableActiveInteraction: true,
      popover: {
        title: copy.title,
        description: copy.description,
        side: step.side,
        align: step.align ?? 'start'
      }
    };
  });
}

function dismissTour(userId: string | undefined) {
  if (!userId) return;
  const current = readTourState(userId);
  writeTourState(userId, { status: 'dismissed', step: current?.step ?? 0 });
}

type Props = {
  enabled: boolean;
  userId?: string;
};

export function ProductTour({ enabled, userId }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('productTour') as unknown as Translator;
  const { data: companies = [], isLoading: companiesLoading } = useGetCompanies();
  const companyId = ownerCompanyId(companies);

  const driverRef = useRef<Driver | null>(null);
  const pendingHref = useRef<string | null>(null);
  const [startNonce, setStartNonce] = useState(0);
  const ctx = useRef<TourContext>({ userId, companyId, router, t });
  ctx.current = { userId, companyId, router, t };

  const goToRef = useRef<(index: number) => void>(() => undefined);
  const ensureDriverRef = useRef<() => Driver>(() => {
    throw new Error('Product tour is not ready');
  });

  ensureDriverRef.current = () => {
    if (driverRef.current?.isActive()) return driverRef.current;
    driverRef.current?.destroy();
    driverRef.current = null;

    const { t: translate, userId: id } = ctx.current;
    const instance = driver({
      animate: true,
      allowClose: true,
      overlayClickBehavior: 'close',
      smoothScroll: true,
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: 'aquatechy-tour',
      showProgress: true,
      nextBtnText: translate('next'),
      prevBtnText: translate('back'),
      doneBtnText: translate('done'),
      closeBtnLabel: translate('close'),
      steps: buildSteps(translate),
      onPopoverRender: (popover, { index }) => {
        const current = (index ?? 0) + 1;
        popover.progress.textContent = ctx.current.t('progress', {
          current,
          total: PRODUCT_TOUR_STEPS.length
        });

        popover.footer.querySelectorAll('.aquatechy-tour-quit').forEach((node) => node.remove());
        const quit = document.createElement('button');
        quit.type = 'button';
        quit.className = 'aquatechy-tour-quit';
        quit.textContent = ctx.current.t('quit');
        quit.addEventListener('click', () => {
          dismissTour(ctx.current.userId);
          driverRef.current?.destroy();
        });
        popover.footerButtons.prepend(quit);
      },
      onNextClick: (_element, _step, opts) => {
        goToRef.current((opts.index ?? 0) + 1);
      },
      onPrevClick: (_element, _step, opts) => {
        goToRef.current((opts.index ?? 0) - 1);
      },
      onCloseClick: () => {
        dismissTour(id);
        driverRef.current?.destroy();
      },
      onDestroyed: (_element, _step, { reason }) => {
        driverRef.current = null;
        if (reason === 'close' || reason === 'escape' || reason === 'overlay') {
          dismissTour(ctx.current.userId);
        }
      }
    });

    driverRef.current = instance;
    return instance;
  };

  goToRef.current = (index: number) => {
    const { userId: id, companyId: activeCompanyId, router: nav } = ctx.current;
    if (!id) return;

    if (index >= PRODUCT_TOUR_STEPS.length) {
      writeTourState(id, { status: 'completed', step: PRODUCT_TOUR_STEPS.length - 1 });
      driverRef.current?.destroy();
      driverRef.current = null;
      return;
    }

    if (index < 0) return;

    writeTourState(id, { status: 'active', step: index });
    const step = PRODUCT_TOUR_STEPS[index];
    const href = step.href(activeCompanyId);
    if (href && !step.match(window.location.pathname)) {
      pendingHref.current = href;
      driverRef.current?.destroy();
      driverRef.current = null;
      nav.push(href);
      return;
    }

    const started = Date.now();
    const tick = () => {
      const latest = readTourState(id);
      if (!latest || latest.status !== 'active' || latest.step !== index) return;
      const found = !step.selector || document.querySelector(step.selector);
      if (!found && Date.now() - started < ELEMENT_WAIT_MS) {
        window.setTimeout(tick, 150);
        return;
      }
      ensureDriverRef.current().drive(index);
    };
    tick();
  };

  useEffect(() => {
    const onStart = () => {
      driverRef.current?.destroy();
      driverRef.current = null;
      pendingHref.current = null;
      setStartNonce((value) => value + 1);
    };
    window.addEventListener(PRODUCT_TOUR_START_EVENT, onStart);
    return () => window.removeEventListener(PRODUCT_TOUR_START_EVENT, onStart);
  }, []);

  useEffect(() => {
    if (!enabled || !userId || pathname === '/onboarding') {
      driverRef.current?.destroy();
      driverRef.current = null;
      return;
    }

    const state = readTourState(userId);
    if (!state || state.status !== 'active') {
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
      return;
    }

    const step = PRODUCT_TOUR_STEPS[state.step];
    if (!step) {
      writeTourState(userId, { status: 'completed', step: Math.max(state.step, 0) });
      driverRef.current?.destroy();
      driverRef.current = null;
      return;
    }

    if (step.requiresCompany && !companyId && companiesLoading) return;

    const href = step.href(companyId);
    if (href && !step.match(pathname)) {
      if (pendingHref.current !== href) {
        pendingHref.current = href;
        driverRef.current?.destroy();
        driverRef.current = null;
        ctx.current.router.push(href);
        return;
      }
    } else {
      pendingHref.current = null;
    }

    if (driverRef.current?.isActive() && driverRef.current.getActiveIndex() === state.step) return;

    let cancelled = false;
    const started = Date.now();
    const index = state.step;

    const tick = () => {
      if (cancelled) return;
      const found = !step.selector || document.querySelector(step.selector);
      if (!found && Date.now() - started < ELEMENT_WAIT_MS) {
        window.setTimeout(tick, 150);
        return;
      }
      if (cancelled) return;
      ensureDriverRef.current().drive(index);
    };

    const timer = window.setTimeout(tick, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [companiesLoading, companyId, enabled, pathname, startNonce, userId]);

  return null;
}
