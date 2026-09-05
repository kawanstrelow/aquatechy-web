'use client';

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

// Add this type to match your CSV structure
type CSVRow = {
  clientAddress: string;
  clientCity: string;
  email: string;
  firstName: string;
  lastName: string;
  clientNotes: string;
  phone: string;
  clientState: string;
  clientZip: string;
  poolAddress: string;
  animalDanger: string;
  poolCity: string;
  enterSide: string;
  lockerCode: string;
  poolNotes: string;
  poolType: string;
  poolState: string;
  poolZip: string;
  customerCode: string;
  clientCompany: string;
  clientType: string;
  monthlyPayment: string;
  poolAddressLine2?: string;
  bodyOfWater?: string;
  volumeInGallons?: string;
  estimatesConvertedFrom?: string;
};

// Add this type
type PoolType = 'Other' | 'Chlorine' | 'Salt';

// Add this right after the PoolType type definition and before the component
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

export default function ImportFromFile() {
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
      return <span className="text-red-500">Phone must be 10 digits.</span>;
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
      return <span className="text-red-500">E-mail required</span>;
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
          // Convert monthlyPayment from string (e.g., "$123,00") to number
          const monthlyPayment =
            typeof row.monthlyPayment === 'string'
              ? parseFloat(row.monthlyPayment.replace(/\D/g, ''))
              : typeof row.monthlyPayment === 'number'
                ? row.monthlyPayment
                : 0;

          // Convert animalDanger from string to boolean
          const animalDanger = String(row.animalDanger || '').toLowerCase() === 'true';

          const cleanedPhone = String(row.phone || '').replace(/\D/g, '');
          const formattedPhone =
            cleanedPhone.length === 10
              ? `+1 (${cleanedPhone.slice(0, 3)}) ${cleanedPhone.slice(3, 6)}-${cleanedPhone.slice(6)}`
              : cleanedPhone;

          const state = convertStateToAbbreviation(row.clientState || '');
          const poolState = convertStateToAbbreviation(row.poolState || '');

          return {
            firstName: row.firstName,
            lastName: row.lastName,
            clientCompany: row.clientCompany || undefined,
            clientAddress: row.clientAddress,
            poolAddress: row.poolAddress,
            poolAddressLine2: row.poolAddressLine2 || '',
            clientCity: row.clientCity,
            poolCity: row.poolCity,
            clientState: state,
            poolState: poolState,
            clientZip: String(row.clientZip || ''),
            poolZip: String(row.poolZip || ''),
            phone: formattedPhone,
            email: row.email,
            invoiceEmail: row.email,
            animalDanger: animalDanger ? true : false,
            enterSide: row.enterSide || 'Not defined',
            lockerCode: String(row.lockerCode || ''),
            poolType: (row.poolType || 'Other') as PoolType,
            poolNotes: row.poolNotes || '',
            clientType: row.clientType as 'Residential' | 'Commercial',
            clientNotes: row.clientNotes || '',
            customerCode: String(row.customerCode || ''),
            timezone: STATE_TIMEZONE_MAP[state.toUpperCase()] || IanaTimeZones.NY,
            monthlyPayment,
            companyOwnerId: '', // Will be set before import
            ...(row.bodyOfWater?.trim()
              ? { bodyOfWater: row.bodyOfWater.trim() }
              : {}),
            ...(() => {
              const raw = row.volumeInGallons?.trim();
              if (!raw) return {};
              const parsed = parseInt(raw.replace(/\D/g, ''), 10);
              return Number.isInteger(parsed) && parsed > 0 ? { volumeInGallons: parsed } : {};
            })(),
            ...(() => {
              const raw = row.estimatesConvertedFrom?.trim();
              if (!raw) return {};
              const parsed = Number.parseInt(raw, 10);
              return Number.isFinite(parsed) ? { estimatesConvertedFrom: parsed } : {};
            })()
          };
        });

        setParsedData(processedData);
      } catch (error) {
        console.error('Error processing file:', error);
        toast({
          duration: 5000,
          title: 'Error processing file',
          description: 'Please make sure you are using the correct Excel or CSV template format',
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
        title: 'Error',
        description: 'Please select a company first',
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
        title: 'Error',
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
    <div className="p-6">
      <Typography element="h1" className="mb-6">
        Import Clients from Excel or CSV
      </Typography>

      <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <Typography element="h2" className="mb-4 text-lg font-semibold">
          How to Import Clients
        </Typography>
        <ol className="list-decimal space-y-3 pl-4">
          <li>
            Import from Excel (.xlsx):
            <div className="mt-2">
              <a
                href="/templates/client_import_template.xlsx"
                download
                className={cn(buttonVariants({ variant: 'default' }), 'inline-flex items-center gap-2')}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Download Excel Template
              </a>
            </div>
          </li>
          <li>
            Import from CSV:
            <div className="mt-2">
              <a
                href="/templates/client_import_template.csv"
                download
                className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex items-center gap-2')}
              >
                <FileText className="h-4 w-4" />
                Download CSV Template
              </a>
            </div>
          </li>
          <li>
            Fill out the template with your client information:
            <ul className="mt-2 list-disc pl-4 text-slate-600">
              <li>Follow the example row provided in the template</li>
              <li>Make sure to keep the column headers exactly as they are</li>
              <li>Save the file as Excel (.xlsx) or CSV</li>
            </ul>
          </li>
          <li>
            Return to this page and complete these steps:
            <ul className="mt-2 list-disc pl-4 text-slate-600">
              <li>Select your company from the dropdown below</li>
              <li>Click &quot;Choose File&quot; and select your filled Excel or CSV file</li>
            </ul>
          </li>
          <li>
            Review the imported data in the preview table and click <span className="font-medium">Import Clients</span>{' '}
            when ready
          </li>
        </ol>
        <div className="mt-6 rounded-md bg-blue-50 p-4">
          <Typography element="p" className="text-sm text-blue-800">
            <strong>Note:</strong> The import process will automatically create a pool for each client. After importing,
            please remember to:
            <ul className="mt-2 list-disc pl-4">
              <li>Update each client's pool information</li>
              <li>Set up service schedules in the Routes section</li>
            </ul>
          </Typography>
        </div>
      </div>

      <Form {...form}>
        <div className="mb-6">
          <SelectField
            placeholder="Company owner"
            name="companyOwnerId"
            label="Company owner"
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
            Choose File
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

      {/* Rest of the component remains the same as QuickBooks import */}
      {parsedData.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Client Address</TableHead>
                  <TableHead>Client City</TableHead>
                  <TableHead>Client State</TableHead>
                  <TableHead>Client Zip</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pool Address</TableHead>
                  <TableHead>Pool Address Line 2</TableHead>
                  <TableHead>Pool City</TableHead>
                  <TableHead>Pool State</TableHead>
                  <TableHead>Pool Zip</TableHead>
                  <TableHead>Pool Type</TableHead>
                  <TableHead>Animal Danger</TableHead>
                  <TableHead>Enter Side</TableHead>
                  <TableHead>Locker Code</TableHead>
                  <TableHead>Body of Water</TableHead>
                  <TableHead>Volume (gal)</TableHead>
                  <TableHead>Monthly Payment</TableHead>
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
                    <TableCell>{client.poolType}</TableCell>
                    <TableCell>{client.animalDanger ? 'Yes' : 'No'}</TableCell>
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
              Import {parsedData.length} Clients
            </Button>
          </div>
        </>
      )}

      <Dialog
        open={!isCompaniesLoading && isCompaniesSuccess && showNoCompaniesDialog}
        onOpenChange={setShowNoCompaniesDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">No Companies Available</DialogTitle>
            <DialogDescription>Please create a company before importing clients.</DialogDescription>
          </DialogHeader>
          <Button type="button" onClick={() => router.push('/settings/companies')}>
            Create Company
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
