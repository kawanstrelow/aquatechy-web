import { format } from 'date-fns';

import { RequestStatus } from '@/constants';
import { translateOptionLabel } from '@/i18n/runtime';
import { Request } from '@/ts/interfaces/Request';

export const NO_REQUEST = '__none__';

export function requestOptionLabel(request: Request) {
  const when = format(new Date(request.createdAt), 'MMM d, yyyy');
  const statusOption = RequestStatus.find((option) => option.value === request.status);
  const status = statusOption ? translateOptionLabel(statusOption) : request.status;
  const dated = `${when} (${status})`;
  const description = request.description?.trim();
  if (!description) return dated;
  const short = description.length > 60 ? `${description.slice(0, 57)}…` : description;
  return `${dated} — ${short}`;
}
