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
        title: 'Error importing clients',
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
      setParsedData([]);
      router.push('/clients');
    } catch (error: unknown) {
      toast({
        duration: 5000,
        title: 'Error importing clients',
        variant: 'error',
        description: getCreateManyClientsErrorMessage(error, 'Internal server error')
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
            poolType: 'Other',
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
    <div className="p-6">
      <Typography element="h1" className="mb-6">
        Import Clients from Quickbooks
      </Typography>

      <div className="mb-8 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <Typography element="h2" className="mb-4 text-lg font-semibold">
          How to Import Clients from QuickBooks
        </Typography>
        <ol className="list-decimal space-y-3 pl-4">
          <li>Access your QuickBooks Online account</li>
          <li>
            Navigate to <span className="font-medium">Sales</span> and select{' '}
            <span className="font-medium">Customers</span> from the left sidebar
          </li>
          <li>
            Look for the <span className="font-medium">Export</span> button in the top-right corner of the customers
            list and click it to download the Excel file
          </li>
          <li>
            Return to this page and complete these steps:
            <ul className="mt-2 list-disc pl-4 text-slate-600">
              <li>Select your company from the dropdown below</li>
              <li>Click "Choose File" and select the Excel file you just downloaded</li>
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
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
          </label>
          {selectedFile && <span className="text-sm text-slate-500">{selectedFile}</span>}
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            Processing file...
          </div>
        )}

        {parsedData.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Zip</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
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
                Import {parsedData.length} Clients
              </Button>
            </div>
          </>
        )}
      </Form>

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
