import { AxiosError } from 'axios';

type ErrorResponse = {
  message?: string | string[];
};

export function getLeadErrorMessage(error: AxiosError<ErrorResponse>, fallback: string) {
  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
}
