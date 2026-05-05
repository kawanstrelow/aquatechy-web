'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useUserStore } from '@/store/user';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import useGetRecurringInvoiceTemplates, { RecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useGetRecurringInvoiceTemplates';
import useGetAllClients from '@/hooks/react-query/clients/getAllClients';
import { useDeleteRecurringInvoiceTemplate } from '@/hooks/react-query/invoices/useDeleteRecurringInvoiceTemplate';
import ConfirmActionDialog from '@/components/confirm-action-dialog';
import { RecurringInvoiceSummaryCards } from './_components/RecurringInvoiceSummaryCards';
import { DataTableRecurringInvoices } from './DataTableRecurringInvoices/index';
import { createColumns } from './DataTableRecurringInvoices/columns';

export default function RecurringInvoicesPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: templatesData, isLoading: isLoadingTemplates } = useGetRecurringInvoiceTemplates();
  const { data: clients = [] } = useGetAllClients();
  const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeleteRecurringInvoiceTemplate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<RecurringInvoiceTemplate | null>(null);
  const templates = useMemo(() => templatesData?.templates ?? [], [templatesData]);

  // Auth check
  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  // Get unique clients from templates
  const templateClients = useMemo(() => {
    const clientMap = new Map<string, { id: string; name: string }>();
    templates.forEach((template: RecurringInvoiceTemplate) => {
      if (template.clientId && !clientMap.has(template.clientId)) {
        const client = clients.find((c) => c.id === template.clientId);
        const clientName = client?.fullName || `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || `${template.client.firstName} ${template.client.lastName}`.trim() || 'Unknown';
        clientMap.set(template.clientId, { id: template.clientId, name: clientName });
      }
    });
    return Array.from(clientMap.values());
  }, [templates, clients]);

  // Action handlers
  const handleEdit = (template: RecurringInvoiceTemplate) => {
    router.push(`/invoices/recurring/${template.id}/edit`);
  };

  const handleDelete = (template: RecurringInvoiceTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate({ templateId: templateToDelete.id });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleCreateTemplate = () => {
    router.push('/invoices/recurring/new');
  };

  const columns = createColumns(handleEdit, handleDelete);

  if (isLoadingTemplates) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <RecurringInvoiceSummaryCards templates={templates} />

      <DataTableRecurringInvoices 
        columns={columns} 
        data={templates} 
        clients={templateClients}
        onCreateTemplate={handleCreateTemplate}
      />
      
      {/* Delete Confirmation Dialog */}
      <ConfirmActionDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Recurring Invoice Template"
        description={
          templateToDelete
            ? `Are you sure you want to delete the recurring invoice template "${templateToDelete.referenceNumber || 'Untitled'}"? This action cannot be undone and will stop all future recurring invoices from being generated.`
            : 'Are you sure you want to delete this recurring invoice template? This action cannot be undone.'
        }
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}
