import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { toast } from '@/components/ui/use-toast';

import { clientAxios } from '../../../lib/clientAxios';
import { InvoiceCompanyInformation, InvoiceDefaultValues, InvoiceCommunication } from '@/ts/interfaces/Company';
import { RecurringInvoiceFrequency, PaymentTermsDays } from '@/ts/interfaces/RecurringInvoiceTemplate';

import { translateMessage } from '@/i18n/runtime';

type ErrorResponse = {
  message?:
    | string
    | Array<{
        code: string;
        message: string;
        path?: (string | number)[];
        validation?: string;
        minimum?: number;
        type?: string;
        inclusive?: boolean;
      }>;
  issues?: Array<{
    code: string;
    message: string;
    path?: (string | number)[];
  }>;
};

/**
 * Hook to update invoice communication settings (email templates)
 * @param companyId - The company ID to update settings for
 */
export const useUpdateInvoiceCommunicationSettings = (companyId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: InvoiceCommunication) => {
      const response = await clientAxios.patch(`/companies/${companyId}/invoice-settings/communication`, settings);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['invoice-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-settings-communication', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });

      toast({
        title: translateMessage(
          'toasts.communicationSettingsUpdatedSuccessfully',
          'Communication settings updated successfully'
        ),
        variant: 'success'
      });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error('Error updating communication settings:', error);

      // Extract error message from response
      let errorMessage = translateMessage('toasts.anErrorOccurred', 'An error occurred');
      if (error.response?.data?.message) {
        // Handle both string and array formats for message
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.map((issue) => issue.message || String(issue)).join(', ');
        }
      } else if (error.response?.data?.issues && error.response.data.issues.length > 0) {
        errorMessage = error.response.data.issues.map((issue) => issue.message).join(', ');
      }

      toast({
        title: translateMessage('toasts.errorUpdatingCommunicationSettings', 'Error updating communication settings'),
        description: errorMessage,
        variant: 'error'
      });
    }
  });
};

/**
 * Hook to update invoice company information
 * @param companyId - The company ID to update settings for
 * @param options - Optional callbacks for mutation lifecycle
 */
export const useUpdateInvoiceCompanyInformation = (
  companyId: string,
  options?: {
    onSuccess?: (data: unknown, variables: InvoiceCompanyInformation) => void;
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: InvoiceCompanyInformation) => {
      // Only include replyToEmail if it's provided and not null/undefined/empty
      const requestBody: { replyToEmail?: string } = {};
      if (settings.replyToEmail && settings.replyToEmail.trim() !== '') {
        requestBody.replyToEmail = settings.replyToEmail.trim();
      }

      const response = await clientAxios.patch(
        `/companies/${companyId}/invoice-settings/company-information`,
        requestBody
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-settings-company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });

      toast({
        title: translateMessage(
          'toasts.companyInformationUpdatedSuccessfully',
          'Company information updated successfully'
        ),
        variant: 'success'
      });

      // Call optional onSuccess callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error('Error updating company information:', error);

      let errorMessage = translateMessage('toasts.anErrorOccurred', 'An error occurred');
      if (error.response?.data?.message) {
        // Handle both string and array formats for message
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.map((issue) => issue.message || String(issue)).join(', ');
        }
      } else if (error.response?.data?.issues && error.response.data.issues.length > 0) {
        errorMessage = error.response.data.issues.map((issue) => issue.message).join(', ');
      }

      toast({
        title: translateMessage('toasts.errorUpdatingCompanyInformation', 'Error updating company information'),
        description: errorMessage,
        variant: 'error'
      });
    }
  });
};

/**
 * Hook to update invoice default values
 * @param companyId - The company ID to update settings for
 * @param options - Optional callbacks for mutation lifecycle
 */
export const useUpdateInvoiceDefaultValues = (
  companyId: string,
  options?: {
    onSuccess?: (data: unknown, variables: InvoiceDefaultValues) => void;
  }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: InvoiceDefaultValues) => {
      // Ensure all four fields are provided together (API requirement: all-or-nothing)
      // If any field is provided, all must be provided
      const requestBody: {
        paymentInstructions: string;
        notes: string;
        defaultFrequency: RecurringInvoiceFrequency;
        defaultPaymentTerm: PaymentTermsDays;
      } = {
        paymentInstructions: settings.paymentInstructions ?? '',
        notes: settings.notes ?? '',
        defaultFrequency: (settings.defaultFrequency as RecurringInvoiceFrequency) ?? RecurringInvoiceFrequency.Monthly,
        defaultPaymentTerm: (settings.defaultPaymentTerm as PaymentTermsDays) ?? PaymentTermsDays.ThirtyDays
      };

      const response = await clientAxios.patch(`/companies/${companyId}/invoice-settings/default-values`, requestBody);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-settings', companyId] });
      queryClient.invalidateQueries({ queryKey: ['invoice-settings-defaults', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });

      toast({
        title: translateMessage('toasts.defaultValuesUpdatedSuccessfully', 'Default values updated successfully'),
        variant: 'success'
      });

      // Call optional onSuccess callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      console.error('Error updating default values:', error);

      let errorMessage = translateMessage('toasts.anErrorOccurred', 'An error occurred');
      if (error.response?.data?.message) {
        // Handle both string and array formats for message
        if (typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.map((issue) => issue.message || String(issue)).join(', ');
        }
      } else if (error.response?.data?.issues && error.response.data.issues.length > 0) {
        errorMessage = error.response.data.issues.map((issue) => issue.message).join(', ');
      }

      toast({
        title: translateMessage('toasts.errorUpdatingDefaultValues', 'Error updating default values'),
        description: errorMessage,
        variant: 'error'
      });
    }
  });
};
