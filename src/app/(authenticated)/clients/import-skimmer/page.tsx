'use client';

import { useTranslations } from 'next-intl';
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
import { Loader2Icon, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useForm } from 'react-hook-form';

import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import SelectField from '@/components/SelectField';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useUserStore } from '@/store/user';
import { useShallow } from 'zustand/react/shallow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Skimmer data structure
type SkimmerRow = {
  FullName: string;
  DisplayAsCompany: string;
  MobilePhone1: string;
  MobilePhone2: string;
  MobileLabel1: string;
  MobileLabel2: string;
  HomePhone: string;
  WorkPhone: string;
  Email1: string;
  Email2: string;
  Email3: string;
  Email4: string;
  CustomerNotes: string;
  TagList: string;
  BillingAddress: string;
  BillingCity: string;
  BillingState: string;
  BillingZip: string;
  Status: string;
  LocationAddress: string;
  LocationCity: string;
  LocationState: string;
  LocationZip: string;
  LocationCode: string;
  GateCode: string;
  DogsName: string;
  Rate: string;
  RateType: string;
  LaborCost: string;
  LaborCostType: string;
  MinutesAtStop: string;
  LocationNotes: string;
  FirstName: string;
  LastName: string;
  CompanyName: string;
  CustomerCode: string;
  FullNameOrCompanyDisplay: string;
  ListSortName: string;
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
  CAROLINAS: 'SC',
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

export default function ImportFromSkimmer() {
  const t = useTranslations('clients');
  const { data: companies = [], isLoading: isCompaniesLoading, isSuccess: isCompaniesSuccess } = useGetCompanies();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [parsedData, setParsedData] = useState<CreateManyClientsInput>([]);
  const { toast } = useToast();
  const { mutateAsync: createManyClients, isPending } = useCreateManyClients();
  const router = useRouter();
  const form = useForm();
  const [showNoCompaniesDialog, setShowNoCompaniesDialog] = useState(false);

  const formatPhoneNumber = (phone: string) => {
    const phoneRegex = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;

    if (!phoneRegex.test(phone)) {
      return <span className="text-red-500">{t('shared.phoneTenDigits')}</span>;
    }

    return phone;
  };

  const formatMonthlyPayment = (payment: string | number | undefined) => {
    if (payment === undefined) return 'U$ 0.00';
    const amount = typeof payment === 'string' ? parseFloat(payment.replace(/\D/g, '')) : payment;
    return `U$ ${(amount / 100).toFixed(2)}`;
  };

  const formatEmail = (email: string | undefined) => {
    if (!email) {
      return <span className="text-red-500">{t('shared.emailRequiredShort')}</span>;
    }
    return email;
  };

  // Helper function to get the best phone number from Skimmer data
  const getBestPhone = (row: SkimmerRow): string => {
    const phones = [row.MobilePhone1, row.MobilePhone2, row.HomePhone, row.WorkPhone].filter(Boolean);
    return phones[0] || '';
  };

  // Helper function to get the best email from Skimmer data
  const getBestEmail = (row: SkimmerRow): string => {
    return row.Email1;
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
        const jsonData = XLSX.utils.sheet_to_json<SkimmerRow>(worksheet);

        const processedData: CreateManyClientsInput = jsonData.map((row) => {
          // Parse rate as monthly payment (convert to cents)
          const rateValue = typeof row.Rate === 'string' ? parseFloat(row.Rate.replace(/\D/g, '')) : 0;
          const monthlyPayment = rateValue * 100; // Convert to cents

          // Check for animal danger (dogs)
          const animalDanger = Boolean(row.DogsName && row.DogsName.trim() !== '');

          // Get phone number and format it
          const rawPhone = getBestPhone(row);
          const cleanedPhone = String(rawPhone).replace(/\D/g, '');
          const formattedPhone =
            cleanedPhone.length === 10
              ? `+1 (${cleanedPhone.slice(0, 3)}) ${cleanedPhone.slice(3, 6)}-${cleanedPhone.slice(6)}`
              : cleanedPhone;

          // Get names
          const firstName = row.FirstName || '';
          const lastName = row.LastName || '';

          // Use DisplayAsCompany or CompanyName for company field
          const clientCompany = row.CompanyName || '';

          // Convert states
          const clientState = convertStateToAbbreviation(row.BillingState || '');
          const poolState = convertStateToAbbreviation(row.LocationState || '');

          // Get email
          const email = getBestEmail(row);

          return {
            firstName,
            lastName,
            clientCompany,
            clientAddress: row.BillingAddress || '',
            poolAddress: row.LocationAddress || row.BillingAddress || '',
            clientCity: row.BillingCity || '',
            poolCity: row.LocationCity || row.BillingCity || '',
            clientState,
            poolState: poolState || clientState,
            clientZip: String(row.BillingZip || ''),
            poolZip: String(row.LocationZip || row.BillingZip || ''),
            phone: formattedPhone,
            email,
            invoiceEmail: email,
            animalDanger,
            enterSide: 'Not defined',
            lockerCode: row.GateCode || row.LocationCode || '',
            hasSaltSystem: false,
            poolType: 'Chlorine',
            poolNotes: row.CustomerNotes || row.LocationNotes || '',
            clientType: clientCompany ? 'Commercial' : 'Residential',
            clientNotes: row.CustomerNotes || row.LocationNotes || '',
            customerCode: row.CustomerCode || '',
            timezone: STATE_TIMEZONE_MAP[clientState.toUpperCase()] || IanaTimeZones.NY,
            monthlyPayment,
            companyOwnerId: '' // Will be set before import
          };
        });

        setParsedData(processedData);
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          duration: 5000,
          title: t('import.processError'),
          description: t('import.skimmerFileError'),
          variant: 'error'
        });
      }
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    const companyOwnerId = form.getValues('companyOwnerId');
    if (!companyOwnerId) {
      toast({
        title: t('shared.error'),
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
      router.push('/clients');
    } catch (error: unknown) {
      toast({
        title: t('shared.error'),
        description: getCreateManyClientsErrorMessage(error),
        variant: 'error'
      });
    }
  };

  // Check if all phones are valid
  const areAllPhonesValid = (data: CreateManyClientsInput) => {
    const phoneRegex = /^\+1 \(\d{3}\) \d{3}-\d{4}$/;
    return data.every((client) => phoneRegex.test(client.phone));
  };

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user
    }))
  );

  useEffect(() => {
    if (user && user.id && user.id !== undefined && isCompaniesSuccess) {
      setShowNoCompaniesDialog(companies.length === 0);
    }
  }, [companies, user, isCompaniesSuccess]);

  return (
    <>
      <div className="w-full overflow-hidden rounded-xl border border-line bg-surface shadow-lift">
        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Typography element="h1">{t('import.skimmerTitle')}</Typography>
        </div>

        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Typography element="h2" className="mb-4 text-lg font-semibold">
            {t('import.skimmerHowTo')}
          </Typography>
          <ol className="list-decimal space-y-3 pl-4">
            <li>
              {t('import.skimmerExport')}
              <ul className="mt-2 list-disc pl-4 text-slate-600">
                <li>{t('import.skimmerOpen')}</li>
                <li>{t('import.skimmerSettings')}</li>
                <li>{t('import.skimmerExportCustomers')}</li>
                <li>{t('import.skimmerAllFields')}</li>
              </ul>
            </li>
            <li>
              {t('import.skimmerPrepare')}
              <ul className="mt-2 list-disc pl-4 text-slate-600">
                <li>{t('import.skimmerColumns')}</li>
                <li>{t('import.skimmerKeepHeaders')}</li>
                <li>{t('import.skimmerKeepXlsx')}</li>
              </ul>
            </li>
            <li>
              {t('import.skimmerComplete')}
              <ul className="mt-2 list-disc pl-4 text-slate-600">
                <li>{t('import.selectCompany')}</li>
                <li>{t('import.skimmerChooseFile')}</li>
                <li>{t('import.skimmerReview')}</li>
              </ul>
            </li>
            <li>
              {t.rich('import.skimmerClickImport', {
                emphasis: (chunks) => <span className="font-medium">{chunks}</span>
              })}
            </li>
          </ol>
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <Typography element="p" className="text-sm text-blue-800">
              <strong>{t('shared.note')}</strong> {t('import.skimmerAuto')}
              <ul className="mt-2 list-disc pl-4">
                <li>{t('import.skimmerCreatePool')}</li>
                <li>{t('import.skimmerMap')}</li>
                <li>{t('import.skimmerDogs')}</li>
                <li>{t('import.skimmerPhones')}</li>
                <li>{t('import.skimmerDuplicates')}</li>
                <li>{t('import.skimmerAssignments')}</li>
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
              {isProcessing && <Loader2Icon className="h-4 w-4 animate-spin" />}
            </div>
          </Form>

          {parsedData.length > 0 && (
            <>
              <div className="overflow-x-auto rounded-lg border border-line">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('columns.name')}</TableHead>
                      <TableHead>{t('columns.company')}</TableHead>
                      <TableHead>{t('fields.clientAddress')}</TableHead>
                      <TableHead>{t('fields.clientCity')}</TableHead>
                      <TableHead>{t('fields.clientState')}</TableHead>
                      <TableHead>{t('fields.clientZip')}</TableHead>
                      <TableHead>{t('columns.phone')}</TableHead>
                      <TableHead>{t('columns.email')}</TableHead>
                      <TableHead>{t('fields.type')}</TableHead>
                      <TableHead>{t('fields.poolAddressTitle')}</TableHead>
                      <TableHead>{t('fields.poolCity')}</TableHead>
                      <TableHead>{t('fields.poolState')}</TableHead>
                      <TableHead>{t('fields.poolZip')}</TableHead>
                      <TableHead>{t('fields.saltSystem')}</TableHead>
                      <TableHead>{t('fields.animalDangerTitle')}</TableHead>
                      <TableHead>{t('fields.gateLocationCode')}</TableHead>
                      <TableHead>{t('fields.monthlyPaymentTitle')}</TableHead>
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
                        <TableCell>{formatPhoneNumber(client.phone)}</TableCell>
                        <TableCell>{formatEmail(client.email)}</TableCell>
                        <TableCell>{client.clientType}</TableCell>
                        <TableCell>{client.poolAddress}</TableCell>
                        <TableCell>{client.poolCity}</TableCell>
                        <TableCell>{client.poolState}</TableCell>
                        <TableCell>{client.poolZip}</TableCell>
                        <TableCell>{client.hasSaltSystem ? t('shared.yes') : t('shared.no')}</TableCell>
                        <TableCell>{client.animalDanger ? t('shared.yes') : t('shared.no')}</TableCell>
                        <TableCell>{client.lockerCode}</TableCell>
                        <TableCell>{formatMonthlyPayment(client.monthlyPayment)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6">
                <Button onClick={handleImport} type="button" disabled={isPending || !areAllPhonesValid(parsedData)}>
                  {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  {t('shared.importClientsCount', { count: parsedData.length })}
                </Button>
              </div>
            </>
          )}
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
