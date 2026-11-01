'use client';

import { useTranslations } from 'next-intl';

import { translateMessage } from '@/i18n/runtime';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  useCreateManyClients,
  CreateManyClientsInput,
  getCreateManyClientsErrorMessage
} from '@/hooks/react-query/clients/createManyClients';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { STATE_TIMEZONE_MAP, IanaTimeZones } from '@/ts/enums/enums';
import { Typography } from '@/components/Typography';
import { Loader2Icon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import SelectField from '@/components/SelectField';
import { Form } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { useUserStore } from '@/store/user';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type QuickbooksRow = {
  Name: string;
  'Company name': string;
  'Street Address': string;
  City: string;
  State: string;
  Country: string;
  Zip: string;
  Phone: string;
  Email: string;
  Attachments: string;
  'Open Balance': string;
};

const STATE_MAPPINGS: { [key: string]: string } = {
  // Standard names
  ALABAMA: 'AL',
  ALASKA: 'AK',
  ARIZONA: 'AZ',
  ARKANSAS: 'AR',
  CALIFORNIA: 'CA',
  COLORADO: 'CO',
  CONNECTICUT: 'CT',
  DELAWARE: 'DE',
  FLORIDA: 'FL',
  GEORGIA: 'GA',
  HAWAII: 'HI',
  IDAHO: 'ID',
  ILLINOIS: 'IL',
  INDIANA: 'IN',
  IOWA: 'IA',
  KANSAS: 'KS',
  KENTUCKY: 'KY',
  LOUISIANA: 'LA',
  MAINE: 'ME',
  MARYLAND: 'MD',
  MASSACHUSETTS: 'MA',
  MICHIGAN: 'MI',
  MINNESOTA: 'MN',
  MISSISSIPPI: 'MS',
  MISSOURI: 'MO',
  MONTANA: 'MT',
  NEBRASKA: 'NE',
  NEVADA: 'NV',
  'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ',
  'NEW MEXICO': 'NM',
  'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND',
  OHIO: 'OH',
  OKLAHOMA: 'OK',
  OREGON: 'OR',
  PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI',
  'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD',
  TENNESSEE: 'TN',
  TEXAS: 'TX',
  UTAH: 'UT',
  VERMONT: 'VT',
  VIRGINIA: 'VA',
  WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV',
  WISCONSIN: 'WI',
  WYOMING: 'WY',

  // Common misspellings and alternative names
  FLORDIA: 'FL',
  FLÓRIDA: 'FL',
  'NOVA YORK': 'NY',
  'NOVA IORQUE': 'NY',
  'NEW YORK CITY': 'NY',
  NYC: 'NY',
  MASSACHUSETS: 'MA',
  MASSACHUSSETTS: 'MA',
  MASACHUSETS: 'MA',
  MASS: 'MA',
  KALIFORNIA: 'CA',
  CALIFÓRNIA: 'CA',
  CALI: 'CA',
  PENSYLVANIA: 'PA',
  PENN: 'PA',
  PENSILVANIA: 'PA',
  CONNECTCUT: 'CT',
  CONNETICUT: 'CT',
  CONN: 'CT',
  JERSIE: 'NJ',
  JERSY: 'NJ',
  'N JERSEY': 'NJ',
  'N.J.': 'NJ',
  'N.Y.': 'NY',
  'N.C.': 'NC',
  'S.C.': 'SC',
  'SOUTH CAROLIN': 'SC',
  'NORTH CAROLIN': 'NC',
  CAROLINAS: 'SC', // Default to SC if just "Carolinas"
  TENN: 'TN',
  TENNESE: 'TN',
  TEXAZ: 'TX',
  TEX: 'TX',
  FLA: 'FL',
  FLOR: 'FL',
  ILL: 'IL',
  ILLNOIS: 'IL',
  WASH: 'WA',
  'WASH.': 'WA',
  'D.C.': 'DC',
  'WASHINGTON DC': 'DC',
  'WASHINGTON D.C.': 'DC',
  'DISTRICT OF COLUMBIA': 'DC'
};

const convertStateToAbbreviation = (state: string): string => {
  if (!state) return '';

  // If it's already a 2-letter code, return it uppercase
  if (state.length === 2) return state.toUpperCase();

  // Remove extra spaces, periods, and normalize
  const normalizedState = state.toUpperCase().trim().replace(/\s+/g, ' ').replace(/\.$/, '');

  return STATE_MAPPINGS[normalizedState] || state;
};

export default function ImportFromQuickbooks() {
  const t = useTranslations('clients');
  const { toast } = useToast();
  const router = useRouter();
  const [parsedData, setParsedData] = useState<CreateManyClientsInput>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutateAsync: createManyClients, isPending } = useCreateManyClients();
  const [showNoCompaniesDialog, setShowNoCompaniesDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user
    }))
  );

  const { data: companies = [], isLoading: isCompaniesLoading, isSuccess: isCompaniesSuccess } = useGetCompanies();

  const ownerAdminOfficeCompanies = companies.filter(
    (c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office'
  );

  const form = useForm({
    defaultValues: {
      companyOwnerId: ownerAdminOfficeCompanies.length === 1 ? ownerAdminOfficeCompanies[0].id : ''
    }
  });

  useEffect(() => {
    if (user && user.id && user.id !== undefined && isCompaniesSuccess) {
      setShowNoCompaniesDialog(companies.length === 0);
    }
  }, [companies, user, isCompaniesSuccess]);

  const handleImport = async () => {
    const companyOwnerId = form.getValues('companyOwnerId');
    if (!companyOwnerId) {
      toast({
        duration: 5000,
        title: t('import.qbError'),
        description: t('import.selectCompanyFirst'),
        variant: 'error'
      });
      return;
    }

    try {
      const dataWithCompany = parsedData.map((client) => ({
        ...client,
        companyOwnerId
      }));

      await createManyClients(dataWithCompany);
      setParsedData([]);
      router.push('/clients');
    } catch (error: unknown) {
      toast({
        duration: 5000,
        title: t('import.qbError'),
        variant: 'error',
        description: getCreateManyClientsErrorMessage(
          error,
          translateMessage('toasts.internalServerError', 'Internal server error')
        )
      });
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) return phone;
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  };

  const processName = (name: string) => {
    if (!name || typeof name !== 'string') {
      return {
        firstName: '-',
        lastName: '-'
      };
    }

    const parts = name.trim().split(' ').filter(Boolean); // filter removes empty strings

    if (parts.length === 0) {
      return {
        firstName: '-',
        lastName: '-'
      };
    }

    return {
      firstName: parts[0],
      lastName: parts.length > 1 ? parts.slice(1).join(' ') : '-'
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsProcessing(true);
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<QuickbooksRow>(worksheet);

        const processedData: CreateManyClientsInput = jsonData.map((row) => {
          const { firstName, lastName } = processName(row.Name);
          const state = convertStateToAbbreviation(row.State || '');
          const timezone = STATE_TIMEZONE_MAP[state] || IanaTimeZones.NY;
          const isCommercial = Boolean(row['Company name']);

          return {
            firstName,
            lastName,
            clientCompany: row['Company name'] || undefined,
            clientAddress: row['Street Address'] || '',
            poolAddress: row['Street Address'] || '',
            clientCity: row.City || '',
            poolCity: row.City || '',
            clientState: state || '',
            poolState: state || '',
            clientZip: row.Zip || '',
            poolZip: row.Zip || '',
            phone: formatPhoneNumber(row.Phone || ''),
            email: row.Email || '',
            invoiceEmail: row.Email || '',
            animalDanger: false,
            enterSide: 'Not defined',
            lockerCode: '',
            hasSaltSystem: false,
            poolType: 'Chlorine',
            poolNotes: '',
            clientType: isCommercial ? 'Commercial' : 'Residential',
            clientNotes: '',
            customerCode: '',
            timezone,
            monthlyPayment: 0,
            companyOwnerId: '' // This still needs to be set based on the logged-in user's company
          };
        });

        setParsedData(processedData);
      } catch (error) {
        console.error('Error processing file:', error);
      }
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Typography element="h1">{t('import.quickbooksTitle')}</Typography>
        </div>

        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Typography element="h2" className="mb-4 text-lg font-semibold">
            {t('import.quickbooksHowTo')}
          </Typography>
          <ol className="list-decimal space-y-3 pl-4">
            <li>{t('import.qbAccess')}</li>
            <li>
              {t.rich('import.qbNavigate', {
                emphasis: (chunks) => <span className="font-medium">{chunks}</span>
              })}
            </li>
            <li>
              {t.rich('import.qbExport', {
                emphasis: (chunks) => <span className="font-medium">{chunks}</span>
              })}
            </li>
            <li>
              {t('import.returnSteps')}
              <ul className="mt-2 list-disc pl-4 text-slate-600">
                <li>{t('import.selectCompany')}</li>
                <li>{t('import.qbChooseFile')}</li>
              </ul>
            </li>
            <li>
              {t.rich('import.reviewAndImport', {
                emphasis: (chunks) => <span className="font-medium">{chunks}</span>
              })}
            </li>
          </ol>
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <Typography element="p" className="text-sm text-blue-800">
              <strong>{t('shared.note')}</strong> {t('import.autoPool')}
              <ul className="mt-2 list-disc pl-4">
                <li>{t('import.updatePool')}</li>
                <li>{t('import.setupRoutes')}</li>
              </ul>
            </Typography>
          </div>
        </div>

        <div className="px-5 py-5 lg:px-8 lg:py-6">
          <Form {...form}>
            <div className="mb-6">
              <SelectField
                placeholder={t('shared.companyOwner')}
                name="companyOwnerId"
                label={t('shared.companyOwner')}
                options={
                  companies
                    .filter((c) => c.role === 'Owner' || c.role === 'Admin' || c.role === 'Office')
                    .map((c) => ({
                      key: c.id,
                      name: c.name,
                      value: c.id
                    })) || []
                }
              />
            </div>

            <div className="mb-6 flex items-center gap-2">
              <label className={cn(buttonVariants({ variant: 'default' }), 'cursor-pointer')}>
                {t('shared.chooseFile')}
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
              {selectedFile && <span className="text-sm text-slate-500">{selectedFile}</span>}
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                {t('shared.processingFile')}
              </div>
            )}

            {parsedData.length > 0 && (
              <>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('columns.name')}</TableHead>
                        <TableHead>{t('columns.company')}</TableHead>
                        <TableHead>{t('columns.address')}</TableHead>
                        <TableHead>{t('fields.city')}</TableHead>
                        <TableHead>{t('fields.state')}</TableHead>
                        <TableHead>{t('fields.zip')}</TableHead>
                        <TableHead>{t('columns.phone')}</TableHead>
                        <TableHead>{t('columns.email')}</TableHead>
                        <TableHead>{t('fields.type')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((client, index) => (
                        <TableRow key={index}>
                          <TableCell>{`${client.firstName} ${client.lastName}`}</TableCell>
                          <TableCell>{client.clientCompany || '-'}</TableCell>
                          <TableCell>{client.clientAddress}</TableCell>
                          <TableCell>{client.clientCity}</TableCell>
                          <TableCell>{client.clientState}</TableCell>
                          <TableCell>{client.clientZip}</TableCell>
                          <TableCell>{client.phone}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.clientType}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6">
                  <Button onClick={handleImport} type="button" disabled={isPending}>
                    {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                    {t('shared.importClientsCount', { count: parsedData.length })}
                  </Button>
                </div>
              </>
            )}
          </Form>
        </div>
      </div>

      <Dialog
        open={!isCompaniesLoading && isCompaniesSuccess && showNoCompaniesDialog}
        onOpenChange={setShowNoCompaniesDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">{t('shared.noCompaniesTitle')}</DialogTitle>
            <DialogDescription>{t('shared.createCompanyBeforeImport')}</DialogDescription>
          </DialogHeader>
          <Button type="button" onClick={() => router.push('/settings/companies')}>
            {t('shared.createCompanyTitle')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
