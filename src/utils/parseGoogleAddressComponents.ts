const CITY_COMPONENT_TYPES = [
  'locality',
  'postal_town',
  'sublocality',
  'sublocality_level_1',
  'neighborhood',
  'administrative_area_level_3'
] as const;

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  types: string[],
  useShortName = false
): string {
  for (const type of types) {
    const component = components.find((entry) => entry.types.includes(type));
    if (component) {
      return useShortName ? component.short_name : component.long_name;
    }
  }

  return '';
}

export function parseGoogleAddressComponents(components: google.maps.GeocoderAddressComponent[]) {
  const streetNumber = getComponent(components, ['street_number']);
  const route = getComponent(components, ['route']);
  const city = getComponent(components, [...CITY_COMPONENT_TYPES]);
  const state = getComponent(components, ['administrative_area_level_1'], true);
  const zipCode = getComponent(components, ['postal_code']);

  return {
    fullAddress: `${streetNumber} ${route}`.trim(),
    city,
    state,
    zipCode
  };
}
