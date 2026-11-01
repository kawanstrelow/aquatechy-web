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
import { Loader2Icon, FileSpreadsheet, FileText } from 'lucide-react';
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

// SheetJS returns numbers and booleans for typed Excel cells, and strings for CSV / text cells.
type CellValue = string | number | boolean;

type CSVRow = {
  clientAddress?: CellValue;
  clientCity?: CellValue;
  email?: CellValue;
  firstName?: CellValue;
  lastName?: CellValue;
  clientNotes?: CellValue;
  phone?: CellValue;
  clientState?: CellValue;
  clientZip?: CellValue;
  poolAddress?: CellValue;
  animalDanger?: CellValue;
  poolCity?: CellValue;
  enterSide?: CellValue;
  lockerCode?: CellValue;
  poolNotes?: CellValue;
  hasSaltSystem?: CellValue;
  poolState?: CellValue;
  poolZip?: CellValue;
  customerCode?: CellValue;
  clientCompany?: CellValue;
  clientType?: CellValue;
  monthlyPayment?: CellValue;
  poolAddressLine2?: CellValue;
  bodyOfWater?: CellValue;
  volumeInGallons?: CellValue;
  estimatesConvertedFrom?: CellValue;
};

const cellText = (value: CellValue | null | undefined): string => {
  if (value == null) return '';
  return String(value).trim();
};

const parseFlag = (value: CellValue | null | undefined): boolean => {
  if (typeof value === 'boolean') return value;
  return cellText(value).toLowerCase() === 'true';
};

const parseMonthlyPayment = (value: CellValue | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const digits = cellText(value).replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = parseFloat(digits);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseVolumeInGallons = (value: CellValue | null | undefined): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.trunc(value);
  const digits = cellText(value).replace(/\D/g, '');
  if (!digits) return undefined;
  const parsed = parseInt(digits, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const parseEstimatesConvertedFrom = (value: CellValue | null | undefined): number | undefined => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const parsed = Number.parseInt(cellText(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
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

const convertStateToAbbreviation = (state: CellValue | null | undefined): string => {
  const value = cellText(state);
  if (!value) return '';

  // If it's already a 2-letter code, return it uppercase
  if (value.length === 2) return value.toUpperCase();

  // Remove extra spaces, periods, and normalize
  const normalizedState = value.toUpperCase().replace(/\s+/g, ' ').replace(/\.$/, '');

  return STATE_MAPPINGS[normalizedState] || value;
};

export default function ImportFromFile() {
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
        const jsonData = XLSX.utils.sheet_to_json<CSVRow>(worksheet);

        const processedData: CreateManyClientsInput = jsonData.map((row) => {
          const monthlyPayment = parseMonthlyPayment(row.monthlyPayment);
          const animalDanger = parseFlag(row.animalDanger);
          const hasSaltSystem = parseFlag(row.hasSaltSystem);

          const cleanedPhone = cellText(row.phone).replace(/\D/g, '');
          const formattedPhone =
            cleanedPhone.length === 10
              ? `+1 (${cleanedPhone.slice(0, 3)}) ${cleanedPhone.slice(3, 6)}-${cleanedPhone.slice(6)}`
              : cleanedPhone;

          const state = convertStateToAbbreviation(row.clientState);
          const poolState = convertStateToAbbreviation(row.poolState);
          const bodyOfWater = cellText(row.bodyOfWater);
          const volumeInGallons = parseVolumeInGallons(row.volumeInGallons);
          const estimatesConvertedFrom = parseEstimatesConvertedFrom(row.estimatesConvertedFrom);
          const clientCompany = cellText(row.clientCompany);
          const email = cellText(row.email);

          return {
            firstName: cellText(row.firstName),
            lastName: cellText(row.lastName),
            clientCompany: clientCompany || undefined,
            clientAddress: cellText(row.clientAddress),
            poolAddress: cellText(row.poolAddress),
            poolAddressLine2: cellText(row.poolAddressLine2),
            clientCity: cellText(row.clientCity),
            poolCity: cellText(row.poolCity),
            clientState: state,
            poolState: poolState,
            clientZip: cellText(row.clientZip),
            poolZip: cellText(row.poolZip),
            phone: formattedPhone,
            email,
            invoiceEmail: email,
            animalDanger,
            enterSide: cellText(row.enterSide) || 'Not defined',
            lockerCode: cellText(row.lockerCode),
            hasSaltSystem,
            poolType: hasSaltSystem ? 'Salt' : 'Chlorine',
            poolNotes: cellText(row.poolNotes),
            clientType: cellText(row.clientType) as 'Residential' | 'Commercial',
            clientNotes: cellText(row.clientNotes),
            customerCode: cellText(row.customerCode),
            timezone: STATE_TIMEZONE_MAP[state.toUpperCase()] || IanaTimeZones.NY,
            monthlyPayment,
            companyOwnerId: '', // Will be set before import
            ...(bodyOfWater ? { bodyOfWater } : {}),
            ...(volumeInGallons != null ? { volumeInGallons } : {}),
            ...(estimatesConvertedFrom != null ? { estimatesConvertedFrom } : {})
          };
        });

        setParsedData(processedData);
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          duration: 5000,
          title: t('import.processError'),
          description: t('import.processErrorDescription'),
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

  // Add this function to check if all phones are valid
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
          <Typography element="h1">{t('import.fileTitle')}</Typography>
        </div>

        <div className="border-b border-line px-5 py-5 lg:px-8">
          <Typography element="h2" className="mb-4 text-lg font-semibold">
            {t('import.howTo')}
          </Typography>
          <ol className="list-decimal space-y-3 pl-4">
            <li>
              {t('import.fromExcel')}
              <div className="mt-2">
                <a
                  href="/templates/client_import_template.xlsx"
                  download
                  className={cn(buttonVariants({ variant: 'default' }), 'inline-flex items-center gap-2')}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {t('import.downloadExcel')}
                </a>
              </div>
            </li>
            <li>
              {t('import.fromCsv')}
              <div className="mt-2">
                <a
                  href="/templates/client_import_template.csv"
                  download
                  className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex items-center gap-2')}
                >
                  <FileText className="h-4 w-4" />
                  {t('import.downloadCsv')}
                </a>
              </div>
            </li>
            <li>
              {t('import.fillTemplate')}
              <ul className="mt-2 list-disc pl-4 text-slate-600">
                <li>{t('import.followExample')}</li>
                <li>{t('import.keepHeaders')}</li>
                <li>{t('import.saveAs')}</li>
              </ul>
            </li>
            <li>
              {t('import.returnSteps')}
              <ul className="mt-2 list-disc pl-4 text-slate-600">
                <li>{t('import.selectCompany')}</li>
                <li>{t('import.chooseFilledFile')}</li>
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
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileUpload}
                  className="hidden"
                />
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
                      <TableHead>{t('fields.poolAddressLine2')}</TableHead>
                      <TableHead>{t('fields.poolCity')}</TableHead>
                      <TableHead>{t('fields.poolState')}</TableHead>
                      <TableHead>{t('fields.poolZip')}</TableHead>
                      <TableHead>{t('fields.saltSystem')}</TableHead>
                      <TableHead>{t('fields.animalDangerTitle')}</TableHead>
                      <TableHead>{t('fields.enterSideTitle')}</TableHead>
                      <TableHead>{t('fields.lockerCode')}</TableHead>
                      <TableHead>{t('fields.bodyOfWater')}</TableHead>
                      <TableHead>{t('fields.volumeGal')}</TableHead>
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
                        <TableCell>{client.poolAddressLine2}</TableCell>
                        <TableCell>{client.poolCity}</TableCell>
                        <TableCell>{client.poolState}</TableCell>
                        <TableCell>{client.poolZip}</TableCell>
                        <TableCell>{client.hasSaltSystem ? t('shared.yes') : t('shared.no')}</TableCell>
                        <TableCell>{client.animalDanger ? t('shared.yes') : t('shared.no')}</TableCell>
                        <TableCell>{client.enterSide}</TableCell>
                        <TableCell>{client.lockerCode}</TableCell>
                        <TableCell>{client.bodyOfWater ?? '-'}</TableCell>
                        <TableCell>{client.volumeInGallons ?? '-'}</TableCell>
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
