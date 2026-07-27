import { City, ICity } from 'country-state-city';

export type CitySelectOption = {
  key: string;
  value: string;
  name: string;
};

/** Cities missing from country-state-city, keyed by US state ISO code */
const EXTRA_CITIES_BY_STATE: Record<string, ICity[]> = {
  NC: [
    {
      name: 'Corolla',
      countryCode: 'US',
      stateCode: 'NC',
      latitude: '36.38020000',
      longitude: '-75.83000000'
    }
  ]
};

export function getCitiesOfState(countryCode: string, stateCode: string): ICity[] {
  const libraryCities = City.getCitiesOfState(countryCode, stateCode);
  const extraCities = EXTRA_CITIES_BY_STATE[stateCode] ?? [];

  const existingNames = new Set(libraryCities.map((city) => city.name.toLowerCase()));
  const merged = [
    ...libraryCities,
    ...extraCities.filter((city) => !existingNames.has(city.name.toLowerCase()))
  ];

  return merged.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildCitySelectOptions(cities: ICity[], selectedCity?: string): CitySelectOption[] {
  const options = cities.map((city) => ({
    key: city.name,
    value: city.name,
    name: city.name
  }));

  if (
    selectedCity &&
    selectedCity !== 'No cities available' &&
    !options.some((option) => option.value === selectedCity)
  ) {
    options.unshift({
      key: selectedCity,
      value: selectedCity,
      name: selectedCity
    });
  }

  return options;
}
