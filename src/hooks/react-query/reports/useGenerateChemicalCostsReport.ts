import { useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { clientAxios } from '@/lib/clientAxios';

import { translateMessage } from '@/i18n/runtime';

interface GenerateChemicalCostsReportParams {
  from: string; // ISO date string
  to: string; // ISO date string
  companyId: string;
  clientIds: string[];
}

export const useGenerateChemicalCostsReport = () => {
  return useMutation({
    mutationFn: async ({ from, to, companyId, clientIds }: GenerateChemicalCostsReportParams) => {
      const params = {
        from,
        to,
        companyId
      };

      const response = await clientAxios.post(
        '/reports/chemical-costs',
        { clientIds },
        {
          params,
          responseType: 'blob',
          headers: {
            Accept: 'application/pdf',
            'Content-Type': 'application/json'
          }
        }
      );

      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') ||
          `chemical-costs-report-${format(new Date(from), 'yyyy-MM-dd')}-to-${format(new Date(to), 'yyyy-MM-dd')}.pdf`
        : `chemical-costs-report-${format(new Date(from), 'yyyy-MM-dd')}-to-${format(new Date(to), 'yyyy-MM-dd')}.pdf`;

      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return response.data;
    },
    onError: (error: any) => {
      console.error('Error generating chemical costs report:', error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        translateMessage('toasts.failedToGenerateReportPleaseTryAgain', 'Failed to generate report. Please try again.');
      throw new Error(errorMessage);
    }
  });
};
