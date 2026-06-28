/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldValues, UseFormReturn } from 'react-hook-form';

import { isEmpty } from '.';

export function buildSelectOptions(
  data: any[] | undefined,
  { key, name, value }: { key: string; name: string; value: string }
) {
  if (!data) return [];
  const options = data.map((item) => {
    return {
      key: item[key],
      name: item[name],
      value: item[value]
    };
  });
  // filter out duplicates
  return options.filter((item, index, currentArr) => {
    return index === currentArr.findIndex((t) => t.key === item.key);
  });
}

export function buildSelectOptionsSimple(data: string[]) {
  return data.map((item) => {
    return {
      key: item,
      name: item,
      value: item
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createFormData(data: Record<string, any>) {
  const formData = new FormData();
  for (const key in data) {
    switch (key) {
      case 'createdBy':
        formData.append(key, JSON.stringify(data[key]));
        break;
      case 'photo':
        data[key].forEach((photo: { file: string | Blob }) => formData.append(key, photo.file));
        break;
      case 'monthlyPayment':
        // convert to number
        formData.append('monthlyPayment', data.monthlyPayment.toString());
        break;
      case 'volumeInGallons':
        formData.append('volumeInGallons', data.volumeInGallons.toString());
        break;
      default:
        formData.append(key, data[key]);
        break;
    }
  }
  return formData;
}

export const getDirtyValues = <T extends FieldValues>(
  allFields: T,
  dirtyFields: Partial<Record<keyof T, boolean | boolean[]>>
): Partial<T> => {
  const changedFieldValues = Object.keys(dirtyFields).reduce((acc, currentField) => {
    const isDirty = Array.isArray(dirtyFields[currentField])
      ? (dirtyFields[currentField] as boolean[]).some((value) => value === true)
      : dirtyFields[currentField] === true;
    if (isDirty) {
      return {
        ...acc,
        [currentField]: allFields[currentField]
      };
    }
    return acc;
  }, {} as Partial<T>);

  return changedFieldValues;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateForm = async (form: UseFormReturn<any>): Promise<boolean> => {
  form.formState.errors; // also works if you read form.formState.isValid
  await form.trigger();
  if (form.formState.isValid) {
    return true;
  }
  if (isEmpty(form.formState.errors)) {
    console.error('Error in the form');
  } else {
    console.error(form.formState.errors);
  }
  return false;
};

export const filterChangedFormFields = <T extends FieldValues>(
  allFields: T,
  dirtyFields: Partial<Record<keyof T, boolean>>
): Partial<T> => {
  const changedFieldValues = Object.keys(dirtyFields).reduce((acc, currentField) => {
    return {
      ...acc,
      [currentField]: allFields[currentField]
    };
  }, {} as Partial<T>);

  return changedFieldValues;
};
