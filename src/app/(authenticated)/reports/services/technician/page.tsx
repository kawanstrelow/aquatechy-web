'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Download, FileBarChartIcon, CalendarIcon, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUserStore } from '@/store/user';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useGenerateTechnicianReport } from '@/hooks/react-query/reports/useGenerateTechnicianReport';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { MultiSelect } from '@/components/MultiSelect';
import { Input } from '@/components/ui/input';

export default function TechnicianReportPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: members, isLoading: membersLoading } = useGetMembersOfAllCompaniesByUserId(user.id);
  const generateReportMutation = useGenerateTechnicianReport();

  // define 'from' como 1 dia antes do 'to'
  const defaultFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const defaultTo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | undefined>(defaultFrom);
  const [toDate, setToDate] = useState<Date | undefined>(defaultTo);
  const [fromDateString, setFromDateString] = useState<string | undefined>(defaultFrom.toISOString());
  const [toDateString, setToDateString] = useState<string | undefined>(defaultTo.toISOString());

  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [serviceTypePayments, setServiceTypePayments] = useState<{[key: string]: {
    calculateMethod: "amount" | "percentage";
    paymentAmountPerService?: number | string;
    paymentPercentagePerService?: number | string;
  }}>({});
 const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(
   selectedCompany || ''
  );
  // Get unique companies from members
  const companies = useMemo(() => {
    if (!members) return [];
    const uniqueCompanies = new Map();
    members.forEach(member => {
      if (!uniqueCompanies.has(member.company.id)) {
        uniqueCompanies.set(member.company.id, {
          id: member.company.id,
          name: member.company.name
        });
      }
    });
    return Array.from(uniqueCompanies.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [members]);

  // Filter technicians based on selected company
  const filteredTechnicians = useMemo(() => {
    if (!members) return [];
    const list = !selectedCompany
      ? members
      : members.filter((member) => member.company.id === selectedCompany);
    return [...list].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [members, selectedCompany]);

  // Filter Type of service based on selected company
  const filteredTypeOfService = useMemo(() => {
    if (!serviceTypesData?.serviceTypes) return [];
    return serviceTypesData.serviceTypes
      .filter((service) => service.isActive)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
  }, [serviceTypesData]);

  // Handle service type selection and initialize payment values
  const handleServiceTypesChange = (newSelectedTypes: string[]) => {
    setSelectedServiceTypes(newSelectedTypes);
    
    // Initialize payment values for new service types
    const newPayments = { ...serviceTypePayments };
    newSelectedTypes.forEach(serviceTypeId => {
      if (!newPayments[serviceTypeId]) {
        newPayments[serviceTypeId] = {
          calculateMethod: "amount",
          paymentAmountPerService: 0,
          paymentPercentagePerService: 0
        };
      }
    });
    
    // Remove payment values for deselected service types
    Object.keys(newPayments).forEach(serviceTypeId => {
      if (!newSelectedTypes.includes(serviceTypeId)) {
        delete newPayments[serviceTypeId];
      }
    });
    
    setServiceTypePayments(newPayments);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (serviceTypeId: string, method: "amount" | "percentage") => {
    setServiceTypePayments((prev: {[key: string]: {
      calculateMethod: "amount" | "percentage";
      paymentAmountPerService?: number | string;
      paymentPercentagePerService?: number | string;
    }}) => ({
      ...prev,
      [serviceTypeId]: {
        ...prev[serviceTypeId],
        calculateMethod: method,
        paymentAmountPerService: method === "amount" ? (prev[serviceTypeId]?.paymentAmountPerService || 0) : undefined,
        paymentPercentagePerService: method === "percentage" ? (prev[serviceTypeId]?.paymentPercentagePerService || 0) : undefined
      }
    }));
  };

  // Handle payment amount change
  const handlePaymentAmountChange = (serviceTypeId: string, value: string) => {
    setServiceTypePayments((prev: {[key: string]: {
      calculateMethod: "amount" | "percentage";
      paymentAmountPerService?: number | string;
      paymentPercentagePerService?: number | string;
    }}) => ({
      ...prev,
      [serviceTypeId]: {
        ...prev[serviceTypeId],
        paymentAmountPerService: value === '' ? '' : parseFloat(value) || 0
      }
    }));
  };

  // Handle payment percentage change
  const handlePaymentPercentageChange = (serviceTypeId: string, value: string) => {
    setServiceTypePayments((prev: {[key: string]: {
      calculateMethod: "amount" | "percentage";
      paymentAmountPerService?: number | string;
      paymentPercentagePerService?: number | string;
    }}) => ({
      ...prev,
      [serviceTypeId]: {
        ...prev[serviceTypeId],
        paymentPercentagePerService: value === '' ? '' : parseFloat(value) || 0
      }
    }));
  };

  const handleGenerateReport = async () => {
    try {
      // Create the service types array with payment configuration
      const serviceTypesWithPayments = selectedServiceTypes.map(serviceTypeId => {
        const payment = serviceTypePayments[serviceTypeId];
        const serviceType = filteredTypeOfService.find(s => s.id === serviceTypeId);
        return {
          serviceTypeId,
          serviceTypeName: serviceType?.name || 'Unknown Service',
          calculateMethod: payment.calculateMethod,
          ...(payment.calculateMethod === "amount" && {
            paymentAmountPerService: payment.paymentAmountPerService === '' || payment.paymentAmountPerService === undefined ? 0 : payment.paymentAmountPerService
          }),
          ...(payment.calculateMethod === "percentage" && {
            paymentPercentagePerService: payment.paymentPercentagePerService === '' || payment.paymentPercentagePerService === undefined ? 0 : payment.paymentPercentagePerService
          })
        };
      });

      await generateReportMutation.mutateAsync({
        assignedToId: selectedTechnician,
        companyId: selectedCompany,
        serviceTypes: serviceTypesWithPayments,
        fromDate: fromDateString!,
        toDate: toDateString!,
      } as any);
      setSelectedServiceTypes([]);
      setServiceTypePayments({});
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please check the console for details.');
    }
  };

  // Helper function to safely parse payment values
  const parsePaymentValue = (value: number | string | undefined): number | null => {
    if (value === '' || value === undefined) return null;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? null : parsed;
  };

  // Validation function for payment configuration
  const validatePaymentConfiguration = () => {
    for (const serviceTypeId of selectedServiceTypes) {
      const payment = serviceTypePayments[serviceTypeId];
      if (!payment) return false;

      if (payment.calculateMethod === "amount") {
        const amount = parsePaymentValue(payment.paymentAmountPerService);
        // Require a filled, positive amount (0 or empty is not valid)
        if (amount === null || amount <= 0) {
          return false;
        }
      } else if (payment.calculateMethod === "percentage") {
        const percentage = parsePaymentValue(payment.paymentPercentagePerService);
        // Require a filled percentage in valid range (empty is not valid)
        if (percentage === null || percentage < 0 || percentage > 100) {
          return false;
        }
      }
    }
    return true;
  };

  const canGenerateReport =
    selectedCompany &&
    selectedTechnician &&
    selectedServiceTypes.length > 0 &&
    validatePaymentConfiguration();
    // fromDateString &&
    // toDateString;

  if (membersLoading || isServiceTypesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Service Reports
        </Button>

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileBarChartIcon className="h-6 w-6 text-blue-600" />
          Technician Performance Report
        </h1>
        <p className="text-gray-600 mt-2">
          Generate and download detailed PDF reports showing service completion rates and efficiency metrics for specific technicians.
        </p>
      </div>

      <div className="max-w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Select company, technician and date range for the report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company
              </label>
              <Select value={selectedCompany} onValueChange={(value) => {
                setSelectedCompany(value);
                setSelectedTechnician('');
                setSelectedServiceTypes([]);
                setServiceTypePayments({});
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Technician</label>
              <Select
              disabled={!selectedCompany}
               value={selectedTechnician} onValueChange={setSelectedTechnician}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a technician" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTechnicians?.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Service types</label>
              <MultiSelect
                disabled={!selectedCompany}
                options={filteredTypeOfService.map((service) => ({
                  label: service.name,
                  value: service.id,
                }))}
                selected={selectedServiceTypes}
                onChange={handleServiceTypesChange}
                placeholder="Select service types"
                className="w-full"
              />
            </div>

            {/* Payment configuration for selected service types */}
            {selectedServiceTypes.length > 0 && (
              <div className="space-y-4">
                <label className="text-sm font-medium block">Payment Configuration</label>
                {selectedServiceTypes.map((serviceTypeId) => {
                  const serviceType = filteredTypeOfService.find(s => s.id === serviceTypeId);
                  const payment = serviceTypePayments[serviceTypeId];
                  return (
                    <div key={serviceTypeId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800 truncate block">
                            {serviceType?.name || 'Unknown Service'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Payment Method Selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Payment Method</label>
                        <Select
                          value={payment?.calculateMethod || "amount"}
                          onValueChange={(value: "amount" | "percentage") => handlePaymentMethodChange(serviceTypeId, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="amount">Fixed amount per service</SelectItem>
                            <SelectItem value="percentage">Percentage of the pool's monthly payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Payment Input */}
                      <div className="space-y-2">
                        {payment?.calculateMethod === "amount" ? (
                          <>
                            <label className="text-xs font-medium text-gray-600">Amount paid per Service (US$)</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">$</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={payment.paymentAmountPerService || ''}
                                onChange={(e) => handlePaymentAmountChange(serviceTypeId, e.target.value)}
                                className={`text-sm ${
                                  (() => {
                                    const amount = parsePaymentValue(payment.paymentAmountPerService);
                                    return amount !== null && amount < 0;
                                  })()
                                    ? 'border-red-500 focus:border-red-500' 
                                    : ''
                                }`}
                              />
                            </div>
                            {(() => {
                              const amount = parsePaymentValue(payment.paymentAmountPerService);
                              return amount !== null && amount < 0;
                            })() && (
                              <p className="text-xs text-red-500">Amount cannot be negative</p>
                            )}
                            
                            {/* Explanation text for Pool Cleaning with amount payment */}
                            {payment?.calculateMethod === "amount" && serviceType?.name === "Pool Cleaning" && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                <p className="text-xs text-blue-700">
                                  <strong>How it works:</strong> Services will be calculated considering payment unit settled in the pool multiplied by the fixed amount set here.
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                  <strong>Example:</strong> If you set $10.00 here and Pool A has 2 payment units while Pool B has 3 payment units, 
                                  Pool A will pay $20.00 per service (2 × $10.00) and Pool B will pay $30.00 per service (3 × $10.00).
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <label className="text-xs font-medium text-gray-600">Percentage per Service (%)</label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                placeholder="0.0"
                                value={payment.paymentPercentagePerService || ''}
                                onChange={(e) => handlePaymentPercentageChange(serviceTypeId, e.target.value)}
                                className={`text-sm ${
                                  (() => {
                                    const percentage = parsePaymentValue(payment.paymentPercentagePerService);
                                    return percentage !== null && (percentage < 0 || percentage > 100);
                                  })()
                                    ? 'border-red-500 focus:border-red-500' 
                                    : ''
                                }`}
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                            {(() => {
                              const percentage = parsePaymentValue(payment.paymentPercentagePerService);
                              return percentage !== null && (percentage < 0 || percentage > 100);
                            })() && (
                              <p className="text-xs text-red-500">Percentage must be between 0 and 100</p>
                            )}
                            
                            {/* Explanation text for percentage calculation */}
                            {payment?.calculateMethod === "percentage" && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                <p className="text-xs text-blue-700">
                                  <strong>How it works:</strong> Enter the percentage of the pool's monthly payment 
                                  that should be paid per service. For example, if you want to pay 70% of the monthly 
                                  payment for weekly services, enter <strong>16.2%</strong> (70% ÷ 4.33 weeks).
                                </p>
                              </div>
                            )}

                            
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <DatePicker
                placeholder="Select start date"
                value={fromDate}
                className='w-full'
                onChange={(date) => {
                  if (date) {
                    const startOfDay = new Date(date);
                    startOfDay.setHours(0, 0, 0, 0);
                    setFromDate(startOfDay);
                    setFromDateString(startOfDay.toISOString());
                  } else {
                    setFromDate(undefined);
                    setFromDateString(undefined);
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <DatePicker
                placeholder="Select end date"
                value={toDate}
                className='w-full'
                onChange={(date) => {
                  if (date) {
                    const endOfDay = new Date(date);
                    endOfDay.setHours(23, 59, 59, 999);
                    setToDate(endOfDay);

                    setToDateString(endOfDay.toISOString());
                  } else {
                    setToDate(undefined);
                    setToDateString(undefined);
                  }
                }}
              />
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={!canGenerateReport || generateReportMutation.isPending}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {generateReportMutation.isPending ? 'Generating PDF...' : 'Generate & Download PDF'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
