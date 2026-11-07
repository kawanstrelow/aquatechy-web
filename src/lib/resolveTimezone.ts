import { clientAxios } from '@/lib/clientAxios';

export async function resolveTimezoneFromAddress(input: {
  address: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
}): Promise<string | null> {
  const response = await clientAxios.post<{ timezone: string }>('/timezones/resolve', {
    address: input.address,
    addressLine2: input.addressLine2,
    city: input.city,
    state: input.state,
    zip: input.zip,
    latitude: input.latitude,
    longitude: input.longitude
  });

  return response.data.timezone || null;
}
