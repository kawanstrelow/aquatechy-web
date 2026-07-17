import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { clientAxios } from '@/lib/clientAxios';

interface ServiceTypeWithPayment {
  serviceTypeId: string;
  serviceTypeName: string;
  calculateMethod: 'amount' | 'percentage';
  paymentAmountPerService?: number;
  paymentPercentagePerService?: number;
}

export interface ReportAdjustment {
  amount: number;
  description: string;
}

interface GenerateTechnicianReportParams {
  assignedToId: string;
  companyId: string;
  serviceTypes: ServiceTypeWithPayment[];
  fromDate: string;
  toDate: string;
  extras?: ReportAdjustment;
  discounts?: ReportAdjustment;
}

const toDateParam = (date: string) => (date.includes('T') ? date.split('T')[0] : date);

export const useGenerateTechnicianReport = () => {
  return useMutation({
    mutationFn: async ({
      assignedToId,
      companyId,
      serviceTypes,
      fromDate,
      toDate,
      extras,
      discounts
    }: GenerateTechnicianReportParams) => {
      const from = toDateParam(fromDate);
      const to = toDateParam(toDate);

      const params = {
        from,
        to,
        assignedToId,
        companyId
      };

      const body: {
        serviceTypes: ServiceTypeWithPayment[];
        extras?: ReportAdjustment;
        discounts?: ReportAdjustment;
      } = { serviceTypes };

      if (extras && extras.amount > 0) {
        body.extras = extras;
      }

      if (discounts && discounts.amount > 0) {
        body.discounts = discounts;
      }

      const response = await clientAxios.post('/reports/service', body, {
        params,
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf',
          'Content-Type': 'application/json'
        }
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
          `technician-report-${from}-to-${to}.pdf`
        : `technician-report-${from}-to-${to}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return response.data;
    },
    onError: async (error: AxiosError) => {
      console.error('Error generating technician report:', error);

      let errorMessage = 'Failed to generate report. Please try again.';

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Keep default message when blob is not JSON
        }
      } else {
        const errorData = error.response?.data as { error?: string; message?: string };
        errorMessage = errorData?.error || errorData?.message || errorMessage;
      }

      throw new Error(errorMessage);
    }
  });
};
