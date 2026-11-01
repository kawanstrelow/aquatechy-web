'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { translateMessage, translateOptionLabel } from '@/i18n/runtime';
import InputField from '@/components/InputField';
import { MultiSelect } from '@/components/MultiSelect';
import SelectField from '@/components/SelectField';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { FieldType } from '@/ts/enums/enums';

import { ModalSend } from './ModalSend';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import { SendIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { clientAxios } from '@/lib/clientAxios';
import { AxiosError } from 'axios';
import { error } from 'console';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';

const schema = z.object({
  message: z.string().min(1, { message: 'clients.errors.messageRequired' }),
  subject: z.string().min(1, { message: 'clients.errors.subjectRequired' })
});

type SendBroadcastInput = {
  contacts: {
    name: string;
    email: string;
  }[];
  message: string;
  subject: string;
};

async function sendBroadcastFn(data: SendBroadcastInput) {
  const response = await clientAxios.post('/clients/broadcast', data);
  return response.data;
}

const useSendBroadcastService = () => {
  const t = useTranslations('clients');
  const { toast } = useToast();
  return useMutation({
    mutationFn: sendBroadcastFn,
    onSuccess: () => {
      toast({
        variant: 'success',
        title: t('broadcast.scheduled'),
        description: t('broadcast.scheduledDescription')
      });
    },
    onError: (
      error: AxiosError<{
        message: string;
      }>
    ) => {
      toast({
        variant: 'error',
        title: t('broadcast.error'),
        description: error.response?.data?.message
          ? error.response.data.message
          : translateMessage('toasts.internalServerError', 'Internal server error')
      });
    }
  });
};

export default function Page() {
  const t = useTranslations('clients');
  const { data: clientsData = [] } = useGetAllClients();
  const [selectedCities, setSelectedCities] = useState<string[]>(['All cities']);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['All clients']);
  const [selectedDays, setSelectedDays] = useState<string[]>(['All days']);
  const [filteredClients, setFilteredClients] = useState(clientsData);
  const { toast } = useToast();

  const sendBroadcasService = useSendBroadcastService();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      message: '',
      subject: ''
    }
  });

  const cities = ['All cities', ...Array.from(new Set(clientsData.map((client) => client.city)))];
  const types = ['All clients', 'Residential', 'Commercial'];
  const daysOfWeek = [
    'All days',
    ...Array.from(
      new Set(
        clientsData.flatMap((client) =>
          client.pools.flatMap((pool) => pool.assignments?.map((assignment) => assignment.weekday))
        )
      )
    )
  ];

  const applyFilters = () => {
    const isAllSelected = (selected: string[], allValue: string) =>
      selected.includes(allValue) || selected.length === 0;

    const filtered = clientsData.filter((client) => {
      const cityMatch = isAllSelected(selectedCities, 'All cities') || selectedCities.includes(client.city);
      const typeMatch = isAllSelected(selectedTypes, 'All clients') || selectedTypes.includes(client.type);
      const dayMatch =
        isAllSelected(selectedDays, 'All days') ||
        client.pools.some((pool) => pool.assignments?.some((assignment) => selectedDays.includes(assignment.weekday)));

      return cityMatch && typeMatch && dayMatch;
    });

    setFilteredClients(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedCities, selectedTypes, selectedDays]);

  const handleCitySelectionChange = (selected: string[]) => {
    if (selected.includes('All cities') && !selectedCities.includes('All cities')) {
      setSelectedCities(['All cities']);
    } else {
      setSelectedCities(selected.filter((city) => city !== 'All cities'));
    }
  };

  const handleTypeSelectionChange = (selected: string[]) => {
    if (selected.includes('All clients')) {
      // Se "All" for selecionado, apenas defina isso como valor
      setSelectedTypes(['All clients']);
    } else {
      // Caso contrário, defina os tipos selecionados
      setSelectedTypes(selected);
    }
  };

  const handleDaySelectionChange = (selected: string[]) => {
    if (selected.includes('All days') && !selectedDays.includes('All days')) {
      setSelectedDays(['All days']);
    } else {
      setSelectedDays(selected.filter((city) => city !== 'All days'));
    }
  };

  const handleSubmit = async (formData: { message: string; subject: string }) => {
    if (filteredClients.length === 0) {
      toast({
        variant: 'error',
        title: t('broadcast.noneSelected'),
        description: t('broadcast.noneSelectedDescription'),
        duration: 5000
      });
      return;
    }

    try {
      await sendBroadcasService.mutateAsync({
        ...formData,
        contacts: filteredClients.map((client) => ({ name: client.fullName, email: client.email }))
      });
      setSelectedCities(['All cities']);
      setSelectedDays(['All days']);
      setSelectedTypes(['All clients']);
      form.reset({ subject: '', message: '' });
    } catch (error) {
      return;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="flex w-full flex-col items-start justify-start gap-4 bg-gray-50 p-2">
          <div>
            <p>
              {t.rich('broadcast.addressTo', {
                count: filteredClients.length,
                b: (chunks) => <b>{chunks}</b>
              })}
            </p>
          </div>

          <div className="mb-5 flex w-full flex-col gap-1 md:flex-row md:gap-4">
            <MultiSelect
              placeholder={t('broadcast.selectCities')}
              options={cities.map((city) => ({
                value: city,
                label: city === 'All cities' ? t('broadcast.allCities') : city
              }))}
              selected={selectedCities}
              onChange={handleCitySelectionChange}
            />
            <MultiSelect
              placeholder={t('broadcast.selectDays')}
              options={
                daysOfWeek.map((day) => {
                  const weekday = day ?? '';
                  return {
                    value: weekday,
                    label:
                      weekday === 'All days'
                        ? t('broadcast.allDays')
                        : translateOptionLabel({
                            key: weekday.charAt(0) + weekday.slice(1).toLowerCase(),
                            name: weekday
                          })
                  };
                }) as any
              }
              selected={selectedDays}
              onChange={handleDaySelectionChange}
            />
            <div className="mt-2 w-full">
              <SelectField
                name="type"
                placeholder={t('broadcast.selectClientTypes')}
                value={selectedTypes[0] || 'All clients'}
                options={types.map((type) => ({
                  key: type, // Uma chave única para cada item
                  value: type, // O valor que será enviado ao formulário
                  name:
                    type === 'All clients'
                      ? t('broadcast.allClients')
                      : type === 'Residential'
                        ? t('fields.residential')
                        : type === 'Commercial'
                          ? t('fields.commercial')
                          : type
                }))}
                onValueChange={handleTypeSelectionChange as any}
              />
            </div>
          </div>

          <Input placeholder={t('broadcast.subject')} {...form.register('subject')} />
          <div className="w-full">
            <InputField placeholder={t('broadcast.message')} name="message" type={FieldType.TextArea} />
          </div>
          <ConfirmActionDialog
            trigger={
              <Button
                className="w-full"
                disabled={
                  form.watch('subject').length < 3 || form.watch('message').length < 3 || filteredClients.length === 0
                }
              >
                <SendIcon className="mr-2 h-4 w-4" />
                {t('broadcast.schedule')}
              </Button>
            }
            title={t('broadcast.confirmTitle')}
            description={t('broadcast.confirmDescription')}
            onConfirm={form.handleSubmit(handleSubmit)}
          />
        </div>
      </form>
    </Form>
  );
}
