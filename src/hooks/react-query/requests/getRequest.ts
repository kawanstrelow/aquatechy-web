import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { translateMessage } from '@/i18n/runtime';
import { clientAxios } from '@/lib/clientAxios';
import { Request } from '@/ts/interfaces/Request';

export class RequestNotFoundError extends Error {
  constructor() {
    super(translateMessage('requests.notFound', 'Request not found'));
    this.name = 'RequestNotFoundError';
  }
}

type GetRequestResponse = {
  request: Request;
};

function normalizeRequest(request: Request): Request {
  const client = request.client
    ? {
        ...request.client,
        fullName: request.client.fullName || `${request.client.firstName ?? ''} ${request.client.lastName ?? ''}`.trim()
      }
    : request.client;

  return {
    ...request,
    outcome: request.outcome ?? null,
    photos: request.photos ?? [],
    estimates: request.estimates ?? [],
    shoppingItems: request.shoppingItems ?? [],
    client
  };
}

export default function useGetRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ['requests', requestId],
    queryFn: async () => {
      if (!requestId) {
        throw new Error('Request ID is required');
      }

      try {
        const response = await clientAxios.get<GetRequestResponse>(`/requests/${requestId}`);
        return normalizeRequest(response.data.request);
      } catch (error) {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const errorMessage = error.response?.data?.message;

          if (status === 404) {
            throw new RequestNotFoundError();
          }

          const message = Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage;
          throw new Error(message || translateMessage('requests.loadError', 'Could not load this request'));
        }

        throw error;
      }
    },
    enabled: !!requestId,
    staleTime: Infinity
  });
}
