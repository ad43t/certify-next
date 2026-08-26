'use client';
import { lusitana } from '@/components/ui/fonts';
import { ValidateUser } from '@/components/ui/validation/buttons';
import { useCallback, useState } from 'react';
import type { SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';

type UserOption = {
  label: string;
  value: string;
};

export default function Page() {
  const [selectedOption, setSelectedOption] =
    useState<SingleValue<UserOption>>(null);
  const [lookupError, setLookupError] = useState('');

  const loadOptions = useCallback(async (inputValue: string) => {
    try {
      const response = await fetch(
        `/api/validation/users?q=${encodeURIComponent(inputValue)}`,
      );

      if (!response.ok) {
        throw new Error('User lookup failed.');
      }

      const data = (await response.json()) as { results: UserOption[] };
      setLookupError('');
      return data.results;
    } catch {
      setLookupError('Unable to load active users. Please try again.');
      return [];
    }
  }, []);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Validation</h1>
      </div>
      <div className="mt-4 max-w-2xl md:mt-8">
        <label
          htmlFor="userEmailSelect"
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          Active user
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <AsyncSelect<UserOption, false>
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            value={selectedOption}
            className="w-full sm:max-w-lg"
            id={'userEmailSelect'}
            instanceId="validation-user-select"
            placeholder="Search by name or email"
            noOptionsMessage={() => 'No active users found'}
            onChange={(option) => {
              setSelectedOption(option);
            }}
          />
          <ValidateUser userId={selectedOption?.value ?? null} />
        </div>
        {lookupError ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {lookupError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
