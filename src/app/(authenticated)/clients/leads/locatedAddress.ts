export function locatedAddress(parts: { fullAddress: string; city: string; state: string; zipCode: string }) {
  const street = parts.fullAddress.trim();
  const region = [parts.state, parts.zipCode].filter(Boolean).join(' ');
  const locality = [parts.city, region].filter(Boolean).join(', ');

  if (!street) return locality;
  if (!locality) return street;
  return `${street}, ${locality}`;
}

export type SplitAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

const locatedAddressPatterns = [
  /^(.*?),\s*([^,]+),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/,
  /^(.*?),\s*([^,]+),\s*([A-Za-z]{2}),\s*(\d{5}(?:-\d{4})?)\s*$/,
  /^(.*?),\s*([^,]+),\s*([A-Za-z]{2})\s*$/
];

export function splitLocatedAddress(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): SplitAddress {
  const value = (address ?? '')
    .trim()
    .replace(/,\s*(USA|United States)\s*$/i, '')
    .trim();
  const match = locatedAddressPatterns.map((pattern) => value.match(pattern)).find(Boolean);
  const parsedCity = match?.[2]?.trim() ?? '';
  const parsedState = match?.[3]?.trim().toUpperCase() ?? '';
  const parsedZip = match?.[4]?.trim() ?? '';

  return {
    street: match?.[1]?.trim() || value,
    city: city?.trim() || parsedCity,
    state: state?.trim().toUpperCase() || parsedState,
    zip: zip?.trim() || parsedZip
  };
}
