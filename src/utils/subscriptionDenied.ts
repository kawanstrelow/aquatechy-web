import { AxiosError } from 'axios';

export const API_SUBSCRIPTION_DENIED_MESSAGE = 'Subscription not allowed.';

export const COMPANY_PLAN_DENIED_DESCRIPTION = 'This company is not on the plan required for this action.';

type ErrorBody = {
  message?: string;
};

export function isCompanyPlanDeniedMessage(message: unknown) {
  return message === API_SUBSCRIPTION_DENIED_MESSAGE || message === COMPANY_PLAN_DENIED_DESCRIPTION;
}

export function applyCompanyPlanDeniedMessage(error: AxiosError<ErrorBody>) {
  const message = error.response?.data?.message;
  if (error.response?.status !== 403 || !isCompanyPlanDeniedMessage(message) || !error.response.data) return;
  error.response.data.message = COMPANY_PLAN_DENIED_DESCRIPTION;
}
