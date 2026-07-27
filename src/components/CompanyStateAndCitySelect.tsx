import { ICity, State } from 'country-state-city';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { buildCitySelectOptions, getCitiesOfState } from '@/constants/usCities';

import SelectField from './SelectField';

type Props = {
  stateName?: string;
  cityName?: string;
  disabled?: boolean;
  defaultStateValue?: string;
  showLabels?: boolean; // New prop
};

const states = State.getStatesOfCountry('US');

export default function CompanyStateAndCitySelect({
  stateName = 'state',
  cityName = 'city',
  defaultStateValue,
  showLabels = true,
  ...props
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useFormContext();

  const [hasCities, setHasCities] = useState(true);

  const [cities, setCities] = useState<ICity[]>([]);
  const state = form.watch(stateName);
  const city = form.watch(cityName);

  const handleStateChange = (selectedState: string) => {
    if (!selectedState) return;
    form.setValue(stateName, selectedState);
    const citiesOfSelectedState = getCitiesOfState('US', selectedState);
    setCities(citiesOfSelectedState);

    if (citiesOfSelectedState.length === 0) {
      setHasCities(false);
      form.setValue(cityName, 'No cities available');
    } else {
      setHasCities(true);
      if (city === 'No cities available') {
        form.setValue(cityName, '');
      }
    }
  };

  useEffect(() => {
    handleStateChange(state);
  }, [state]);

  return (
    <div className="inline-flex w-full items-start justify-start gap-4 self-stretch">
      <SelectField
        name={stateName}
        label={showLabels ? 'State' : ''}
        value={state}
        placeholder="State"
        defaultValue={defaultStateValue}
        options={states.map((state) => {
          return {
            key: state.isoCode,
            value: state.isoCode,
            name: state.name
          };
        })}
        {...props}
      />
      {hasCities && (
        <SelectField
          // disabled={!state || cities.length === 0}
          label={showLabels ? 'City' : ''}
          name={cityName}
          value={city}
          placeholder={'City'}
          options={buildCitySelectOptions(cities, city)}
          {...props}
        />
      )}
    </div>
  );
}
